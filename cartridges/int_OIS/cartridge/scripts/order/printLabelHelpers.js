'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var HookManager = require('dw/system/HookMgr');
var Resource = require('dw/web/Resource');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');

/**
 * Returns Instruction Text Based On Return Label Service And Site/Locale
 *
 * @param {Object} order - order data received from OIS
 * @returns {Object} returnInstructionText - Returns Instruction Text
 */
function getReturnInstructionText(order) {
    var returnInstructionText = '';
    try {
        var returnService = Site.getCurrent().getCustomPreferenceValue('returnService') || ''; // FedEx OR CanadaPost
        if (!empty(returnService) && !empty(returnService.value)) {
            returnService = returnService.value;
        }
        var serviceType = '';
        var resourceKey = 'order.return.instruction';
        if (!empty(returnService) && returnService.equalsIgnoreCase('FedEx')) {
            var smartPostEligibleStateCodes = Site.getCurrent().getCustomPreferenceValue('smartPostEligibleStateCodes');
            var stateCode = (!empty(order.shippingAddress) && !empty(order.shippingAddress.stateCode)) ? order.shippingAddress.stateCode : null;
            if (!empty(smartPostEligibleStateCodes) && !empty(stateCode) && smartPostEligibleStateCodes.indexOf(stateCode) > -1) {
                serviceType = 'SmartPost';
            }
        }
        if (!empty(returnService)) {
            resourceKey += '.' + returnService; // order.return.instruction.FedEx OR order.return.instruction.CanadaPost
        }
        if (!empty(serviceType)) {
            resourceKey += '.' + serviceType; // order.return.instruction.FedEx.SmartPost
        }
        returnInstructionText = Resource.msg(resourceKey, 'account', null);
    } catch (e) {
        Logger.error('Error in printLabelHelpers.js -> getReturnInstructionText()', e.message);
    }
    return returnInstructionText;
}
/**
 * Main function of the script to start order export process.
 * @param {string} requestType - mention about the type of request to be process
 * @param {Object} order - retrieve respective order info
 * @param {Object} returnObj - return items info
 * @param {Object} guestData - form data for store returns
 * @param {boolean} emailLabel - emailLabel
 * @param {string} email - customer's email
 * @param {boolean} exchangeItems - exchangeItems
 * @return {Object} Return orders list
 */
function getPDF(requestType, order, returnObj, guestData, emailLabel, email, exchangeItems) {
    var result = {
        errorInResponse: true,
        errorMessage: Resource.msg('label.print.error', 'account', null),
        renderedTemplate: ''
    };
    if ('returnService' in Site.getCurrent().getPreferences().getCustom() && !empty(Site.getCurrent().getCustomPreferenceValue('returnService'))) {
        var returnService = Site.getCurrent().getCustomPreferenceValue('returnService');
        var sapCarrierCode = Site.getCurrent().getCustomPreferenceValue('carrierCode');
        sapCarrierCode = sapCarrierCode ? sapCarrierCode.toUpperCase() : 'FEDEX'; // TODO: Should not hardcode default value. Specify in site preference definition.
        returnService = typeof (returnService) === 'string' ? returnService : returnService.value;
        var rmaNumber = returnHelpers.generateRmaNumber(20);
        if (HookManager.hasHook('app.returns.label.' + returnService.toLowerCase())) {
            var pdfObject = HookManager.callHook('app.returns.label.' + returnService.toLowerCase(), 'createReturnLabel', order, rmaNumber);
            if (pdfObject.trackingNumber && pdfObject.shipLabel) {
                var requestParams = null;
                var response = null;
                var data = null;
                try {
                    if (requestType === 'createGuestItemizedRma') {
                        requestParams = returnHelpers.getGuestRMARequestBody(order, returnObj, pdfObject, sapCarrierCode, rmaNumber);
                    } else if (requestType === 'createItemizedRma') {
                        requestParams = returnHelpers.getRMARequestBody(order, returnObj, pdfObject, sapCarrierCode, rmaNumber);
                    } else if (requestType === 'createGuestStoreRma') {
                        data = guestData;
                        requestParams = returnHelpers.getGuestOrderRMARequestBody(guestData, pdfObject, sapCarrierCode, rmaNumber);
                    }
                    if (requestParams) {
                        response = returnHelpers.createRmaMutation(requestType, requestParams);
                    }
                } catch (e) {
                    Logger.error('Order.js: Error with rma creation:{0}', e.message);
                }
                if (response && !response.error) {
                    var authFormObject = returnHelpers.createAuthFormObj(response, data);
                    if (emailLabel) {
                        var sfmcData = {
                            CustomerEmail: email,
                            CustomerFirstName: authFormObject.firstName,
                            CustomerLastName: authFormObject.lastName,
                            IsExchange: exchangeItems,
                            RMANumber: authFormObject.rmaNumber,
                            RMAOrderNumber: order.orderNo,
                            ReturnCarrierCode: sapCarrierCode,
                            ReturnTrackingNumber: authFormObject.trackingNumber,
                            LabelAttachmentUrl: '',
                            customerLocale: request.locale // eslint-disable-line
                        };
                        // Send "ServiceType" to SFMC for SmartPost service to identify FedEx Ground vs SmartPost
                        if (!empty(returnService) && returnService.equalsIgnoreCase('FedEx')) {
                            var smartPostEligibleStateCodes = Site.getCurrent().getCustomPreferenceValue('smartPostEligibleStateCodes');
                            var stateCode = (!empty(order.shippingAddress) && !empty(order.shippingAddress.stateCode)) ? order.shippingAddress.stateCode : null;
                            if (!empty(smartPostEligibleStateCodes) && !empty(stateCode) && smartPostEligibleStateCodes.indexOf(stateCode) > -1) {
                                sfmcData.ServiceType = 'SMART_POST';
                            }
                        }
                        var fileType = pdfObject.mimeType ? pdfObject.mimeType : '';
                        if (fileType) {
                            fileType = fileType.toLowerCase();
                        }
                        if (fileType === ('application/pdf' || 'pdf')) {
                            fileType = 'pdf';
                        } else if (fileType === ('image/png' || 'png')) {
                            fileType = 'png';
                        }
                        var com = require('dw/object/CustomObjectMgr');
                        var objectDefinition = com.getCustomObject('returnLabelEmailRequests', authFormObject.rmaNumber);
                        if (empty(objectDefinition)) {
                            require('dw/system/Transaction').wrap(function () {
                                objectDefinition = com.createCustomObject('returnLabelEmailRequests', authFormObject.rmaNumber);
                                objectDefinition.custom.fileType = fileType;
                                objectDefinition.custom.base64encodedFileData = pdfObject.shipLabel;
                                objectDefinition.custom.returnLabelUrl = '';
                                objectDefinition.custom.sfmcData = JSON.stringify(sfmcData);
                                objectDefinition.custom.customerNo = !empty(order.customerInfo) ? order.customerInfo.customerNo : '';
                            });
                        }
                        result.renderedTemplate = renderTemplateHelper.getRenderedHtml({ email: email }, '/refund/emaillabel');
                        result.errorInResponse = false;
                        result.errorMessage = '';
                    } else {
                        var imageObj = '';
                        if (authFormObject.country === 'US') {
                            imageObj = 'data:image/jpeg;base64,' + pdfObject.shipLabel;
                        } else {
                            imageObj = 'data:application/pdf;base64,' + pdfObject.shipLabel;
                        }
                        var returnInstructionText = getReturnInstructionText(order);
                        result.renderedTemplate = renderTemplateHelper.getRenderedHtml({ pdfObject: pdfObject, authFormObject: authFormObject, imageObj: imageObj, returnInstructionText: returnInstructionText }, '/refund/printlabel');
                        result.errorInResponse = false;
                        result.errorMessage = '';
                    }
                } else if (response && response.error) {
                    Logger.error('Order.js:' + response.errorMessage);
                    result.errorMessage = response.errorMessage || Resource.msg('label.print.error', 'account', null);
                } else {
                    Logger.error('Order.js:' + response);
                    result.errorMessage = Resource.msg('label.return.error', 'account', null);
                }
            } else {
                Logger.error('Order.js:' + pdfObject.errorDescription);
                result.errorMessage = pdfObject.errorDescription;
            }
        } else {
            Logger.error('Order.js: Empty hook extension point');
        }
    } else {
        Logger.error('Order.js: Site Preference not configured');
    }
    return result;
}

module.exports = {
    getPDF: getPDF,
    getReturnInstructionText: getReturnInstructionText
};
