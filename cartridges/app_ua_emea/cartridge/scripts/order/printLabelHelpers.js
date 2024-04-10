'use strict';

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
        var returnsUtil = new ReturnsUtils();
        returnService = returnsUtil.getPreferenceValue('returnService', order.custom.customerLocale);

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
 * Generates the return tracking link
 * @param {string} serviceValue - Return service provider
 * @param {string} trackingNumber - Tracking number
 * @param {string} customerLocale - customer locale
 * @returns {string} - Tracking Link
 */
function generateTrackingLink(serviceValue, trackingNumber, customerLocale) {
    const allowedServices = ['ups', 'fedex', 'dhlparcel'];
    const locale = customerLocale || 'en_DE';
    let trackingLink = '';
    if (allowedServices.indexOf(serviceValue) > -1) {
        var modifiedLocale = '';
        switch (serviceValue) {
            case 'ups':
                // same format as SFCC, en_NL, nl_NL meaning lang_countryCode
                trackingLink = 'https://www.ups.com/track?loc={0}&tracknum={1}'.replace('{0}', locale).replace('{1}', trackingNumber);
                break;
            case 'fedex':
                // same format as SFCC, en_NL, nl_NL meaning lang_countryCode
                trackingLink = 'https://www.fedex.com/fedextrack/?cntry_code={0}&trknbr={1}'.replace('{0}', locale).replace('{1}', trackingNumber);
                break;
            case 'dhlparcel':
                modifiedLocale = locale.toLowerCase().split('_').reverse().join('-');
                // de-de, de-en meaning countrycode-lang
                trackingLink = 'https://www.dhl.com/{0}/home/tracking/tracking-parcel.html?submit=1&tracking-id={1}'.replace('{0}', modifiedLocale).replace('{1}', trackingNumber);
                break;
            default:
                break;
        }
    }

    return trackingLink;
}

/**
 * Modify Return Provider Value to Show User Friendly Information
 * @param {string} provider - return service provider, e.g. FedEx, DHLParcel, UPS
 * @returns {string} - modified service provider, e.g. DHLParcel > DHL
 */
function modifyReturnProviderValue(provider) {
    if (provider.toLowerCase().indexOf('dhl') > -1) {
        return 'DHL';
    }

    return provider;
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
        errorMessage: Resource.msg('label.print.generic.error', 'account', null),
        renderedTemplate: ''
    };
    var returnItemsInfo = returnObj.returnArray;
    var returnsUtil = new ReturnsUtils();
    var returnServiceValue = returnsUtil.getPreferenceValue('returnService', order.custom.customerLocale);
    if (!empty(returnServiceValue)) {
        var retServiceValue = returnServiceValue.toLowerCase();
        if (HookManager.hasHook('app.shipment.label.' + retServiceValue)) {
            var createReturnCase = require('*/cartridge/scripts/orders/CreateReturnCase');
            var returnCaseNew;
            if (retServiceValue === 'ups') {
                returnCaseNew = createReturnCase.create({
                    Order: order,
                    ReturnItemsInfo: returnItemsInfo,
                    PrintLabel: true
                });
            }
            var pdfObject = HookManager.callHook('app.shipment.label.' + retServiceValue, 'shippingLabelAndTrackingNumber', order);
            if (pdfObject && pdfObject.trackingNumber && pdfObject.shipLabel) {
                if (retServiceValue !== 'ups') {
                    returnCaseNew = createReturnCase.create({
                        Order: order,
                        ReturnItemsInfo: returnItemsInfo,
                        PrintLabel: true
                    });
                }
                var imageObj;
                if (['dhlparcel', 'fedex'].indexOf(retServiceValue) > -1) {
                    imageObj = 'data:application/pdf;base64,' + pdfObject.shipLabel;
                } else {
                    imageObj = 'data:image/png;base64,' + pdfObject.shipLabel;
                }
                var returnInstructionText = getReturnInstructionText(order);
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
                    returnCase.custom.returnShipmentProvider = modifyReturnProviderValue(returnServiceValue);
                    returnCase.custom.trackingLink = generateTrackingLink(retServiceValue, TrackingNumber, order.custom.customerLocale);

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
                    result.renderedTemplate = renderTemplateHelper.getRenderedHtml({
                        pdfObject: pdfObject,
                        authFormObject: authFormObject,
                        imageObj: imageObj,
                        returnInstructionText: returnInstructionText,
                        returnServiceValue: retServiceValue,
                        isPDF: imageObj.indexOf('application/pdf;base64') > -1
                    }, '/refund/printlabel');
                    result.errorInResponse = false;
                    result.errorMessage = '';
                }
            } else {
                var errorDesc = (pdfObject && pdfObject.errorDescription);
                Logger.error('emea/printLabelHelpers.js:' + errorDesc);
                result.errorMessage = errorDesc || Resource.msg('label.print.generic.error', 'account', null);
            }
        } else {
            Logger.error('emea/printLabelHelpers.js: Empty hook extension point');
        }
    } else {
        Logger.error('emea/printLabelHelpers.js: Site Preference not configured');
    }

    return result;
}

module.exports = {
    getReturnInstructionText: getReturnInstructionText,
    getPDF: getPDF
};
