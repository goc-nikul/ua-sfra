'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var HookManager = require('dw/system/HookMgr');

var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
var CreateObject = require('*/cartridge/scripts/orders/CreateObject');
var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
var Transaction = require('dw/system/Transaction');

/**
 * Returns Instruction Text Based On Return Label Service And Site/Locale
 *@param {dw.order.Order} order - retrieve respective order info
 * @returns {Object} returnInstructionText - Returns Instruction Text
 */
function getReturnInstructionText(order) {
    var returnInstructionText = '';
    try {
        var returnService = '';
        returnService = Site.getCurrent().getCustomPreferenceValue('returnService') || ''; // FedEx OR CanadaPost
        if (!empty(returnService) && !empty(returnService.value)) {
            returnService = returnService.value;
        } else {
            var returnsUtil = new ReturnsUtils();
            returnService = returnsUtil.getPreferenceValue('returnService', order.custom.customerLocale);
            if (!empty(returnService) && !empty(returnService.value)) {
                returnService = returnService.value;
            }
        }
        var serviceType = '';
        var resourceKey = 'order.return.instruction';

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
 * @param {dw.order.Order} order - retrieve respective order info
 * @param {Object} returnObj - return items info
 * @return {Object} Return orders list
 */
function getPDF(order, returnObj) {
    var result = {
        errorInResponse: true,
        errorMessage: Resource.msg('label.print.error', 'account', null),
        renderedTemplate: ''
    };
    var returnItemsInfo = returnObj.returnArray;
    if ('returnService' in Site.getCurrent().getPreferences().getCustom() && !empty(Site.getCurrent().getCustomPreferenceValue('returnService'))) {
        var returnService = Site.getCurrent().getCustomPreferenceValue('returnService');
        returnService = typeof (returnService) === 'string' ? returnService : returnService.value;
        if (HookManager.hasHook('app.shipment.label.' + returnService.toLowerCase())) {
            var createReturnCase = require('*/cartridge/scripts/orders/CreateReturnCase');
            var returnCaseNew = createReturnCase.create({
                Order: order,
                ReturnItemsInfo: returnItemsInfo,
                PrintLabel: true
            });
            var pdfObject = HookManager.callHook('app.shipment.label.' + returnService.toLowerCase(), 'shippingLabelAndTrackingNumber', order);
            if (pdfObject.trackingNumber && pdfObject.shipLabel) {
                var imageObj = 'data:image/png;base64,' + pdfObject.shipLabel;
                var returnInstructionText = getReturnInstructionText();
                let TrackingNumber = 'trackingNumber' in pdfObject && !empty(pdfObject.trackingNumber) ? pdfObject.trackingNumber : '';
                let caseItems = order.getReturnCaseItems().asMap().values();

                if (caseItems && !caseItems.empty) {
                    let caseItemsQuantities = {};
                    let orderQuantities = {};

                    for (let i = 0; i < caseItems.length; i++) {
                        let caseItem = caseItems[i];

                        if (!caseItemsQuantities[caseItem.orderItemID]) {
                            caseItemsQuantities[caseItem.orderItemID] = 0;
                        }

                        caseItemsQuantities[caseItem.orderItemID] += caseItem.authorizedQuantity.value;
                        orderQuantities[caseItem.orderItemID] = caseItem.orderItem.lineItem.quantityValue;
                    }

                    for (let i = 0; i < returnItemsInfo.length; i++) {
                        let returnItemInfo = returnItemsInfo[i];
                        let canReturn = orderQuantities[returnItemInfo.orderItemID] - caseItemsQuantities[returnItemInfo.orderItemID];
                        if (returnItemInfo.qty > canReturn) {
                            Logger.error('To many items of {0} to return, failing returnCase creation', returnItemInfo.orderItemID);
                            return result;
                        }
                    }
                }

                // We are not using these vars anywhere throughout the code
                /* var SoapResponse = 'SoapResponse' in pdfObject && !empty(pdfObject.SoapResponse) ? pdfObject.SoapResponse : '';
                var ProfileData = 'ProfileData' in pdfObject && !empty(pdfObject.ProfileData) ? pdfObject.ProfileData : ''; */
                var ShipLabel = pdfObject.shipLabel;
                var ConsignmentID = 'ConsignmentID' in pdfObject && !empty(pdfObject.ConsignmentID) ? pdfObject.ConsignmentID : '';

                var returnCase = returnCaseNew;
                Transaction.wrap(function () {
                    returnCase.custom.trackingNumber = TrackingNumber;
                    returnCase.custom.consignmentId = ConsignmentID;

                    if (!empty(ShipLabel) && typeof (ShipLabel) === 'string') {
                        returnCase.custom.shipmentLabel = ShipLabel;
                    } else if (!empty(ShipLabel) && typeof (ShipLabel) === 'object') {
                        returnCase.custom.shipmentLabel = JSON.stringify(ShipLabel);
                    } else {
                        returnCase.custom.shipmentLabel = null;
                    }
                });

                /* var returnCase = createReturnCase.create({
                    Order: order,
                    ReturnItemsInfo: returnItemsInfo,
                    PrintLabel: true,
                    TrackingNumber: trackingNumber,
                    ShipLabel: pdfObject.shipLabel,
                    SoapResponse: 'SoapResponse' in pdfObject && !empty(pdfObject.SoapResponse) ? pdfObject.SoapResponse : '',
                    ProfileData: 'ProfileData' in pdfObject && !empty(pdfObject.ProfileData) ? pdfObject.ProfileData : '',
                    ConsignmentID: 'ConsignmentID' in pdfObject && !empty(pdfObject.ConsignmentID) ? pdfObject.ConsignmentID : ''
                });*/

                if (!empty(returnCase)) {
                    returnHelpers.sendReturnCreatedConfirmationEmail(order, returnCase);
                    var returnsUtils = new ReturnsUtils();
                    var enableReturnXMLs = returnsUtils.getPreferenceValue('enableReturnXMLs');
                    if (enableReturnXMLs) {
                        CreateObject.createObj(order, returnCase);
                    }

                    var authFormObject = returnHelpers.createAuthFormObj(returnCase);
                    result.renderedTemplate = renderTemplateHelper.getRenderedHtml({ pdfObject: pdfObject, authFormObject: authFormObject, imageObj: imageObj, returnInstructionText: returnInstructionText }, '/refund/printlabel');
                    result.errorInResponse = false;
                    result.errorMessage = '';
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
    getReturnInstructionText: getReturnInstructionText,
    getPDF: getPDF
};
