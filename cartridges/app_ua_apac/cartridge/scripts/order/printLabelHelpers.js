'use strict';

var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var HookManager = require('dw/system/HookMgr');

var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
var CreateObject = require('*/cartridge/scripts/orders/CreateObject');
var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
var base = module.superModule;

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
    var imageObj = '';
    var returnItemsInfo = returnObj.returnArray;
    var returnsUtil = new ReturnsUtils();
    var returnServiceValue = returnsUtil.getPreferenceValue('returnService', order.custom.customerLocale);
    if (returnServiceValue && !empty(returnServiceValue)) {
        var returnService = returnServiceValue;
        var createReturnCase = require('*/cartridge/scripts/orders/CreateReturnCase');
        if (HookManager.hasHook('app.shipment.label.' + returnService.toLowerCase())) {
            var pdfObject = HookManager.callHook('app.shipment.label.' + returnService.toLowerCase(), 'shippingLabelAndTrackingNumber', order);
            if (pdfObject.isReturnCase) {
                if (!empty(pdfObject.shipLabel) && returnService.toLowerCase() !== 'rntemail') {
                    if (returnServiceValue === 'aupost') {
                        imageObj = 'data:application/pdf;base64,' + pdfObject.shipLabel;
                    } else {
                        imageObj = 'data:image/png;base64,' + pdfObject.shipLabel;
                    }
                }
                var returnInstructionText = base.getReturnInstructionText(order);
                let trackingNumber = 'trackingNumber' in pdfObject && !empty(pdfObject.trackingNumber) ? pdfObject.trackingNumber : '';
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

                var returnCase = createReturnCase.create({
                    Order: order,
                    ReturnItemsInfo: returnItemsInfo,
                    PrintLabel: true,
                    TrackingNumber: trackingNumber || '',
                    ShipLabel: pdfObject.shipLabel || '',
                    ConsignmentID: pdfObject.ConsignmentID,
                    pdfLink: pdfObject.PDFLink ? pdfObject.PDFLink : ''
                });

                if (!empty(returnCase)) {
                    require('dw/system/Transaction').wrap(() => {
                        returnCase.custom.trackingNumber = trackingNumber;
                        returnCase.custom.consignmentId = pdfObject.ConsignmentID;
                        if (typeof (pdfObject.shipLabel) === 'string') {
                            returnCase.custom.shipmentLabel = pdfObject.shipLabel;
                        } else if (!empty(pdfObject.shipLabel) && typeof (pdfObject.shipLabel) === 'object') {
                            returnCase.custom.shipmentLabel = JSON.stringify(pdfObject.shipLabel);
                        } else {
                            returnCase.custom.shipmentLabel = null;
                        }
                    });

                    if (!empty(pdfObject.shipLabel) || (returnService.toLowerCase() === 'rntemail')) {
                        returnHelpers.sendReturnCreatedConfirmationEmail(order, returnCase);
                    }
                    var returnsUtils = new ReturnsUtils();
                    var enableReturnXMLs = returnsUtils.getPreferenceValue('enableReturnXMLs');
                    if (enableReturnXMLs) {
                        CreateObject.createObj(order, returnCase, pdfObject.exportStatus);
                    }

                    if (returnService.toLowerCase() === 'rntemail') {
                        var shipmentLabelHtml = renderTemplateHelper.getRenderedHtml({ order: order, orderNumber: order.currentOrderNo, ReturnCase: returnCase, orderEmail: order.getCustomerEmail(), orderBillingZip: order.getBillingAddress().getPostalCode() }, '/refund/rntPrintLabel');
                        result.renderedTemplate = renderTemplateHelper.getRenderedHtml({ isRnTEmailReturnService: true, shipLabel: shipmentLabelHtml, returnInstructionText: returnInstructionText, returnService: returnService.toLowerCase() }, '/refund/printlabel');
                    } else {
                        var authFormObject = returnHelpers.createAuthFormObj(returnCase);
                        result.renderedTemplate = renderTemplateHelper.getRenderedHtml({ pdfObject: pdfObject, authFormObject: authFormObject, imageObj: imageObj, returnInstructionText: returnInstructionText, returnService: returnService.toLowerCase() }, '/refund/printlabel');
                    }
                    result.errorInResponse = false;
                    if (pdfObject.isError) {
                        result.errorInResponse = true;
                        var ContentMgr = require('dw/content/ContentMgr');
                        var contentMessage = ContentMgr.getContent('return-label-not-available');
                        if (!empty(contentMessage)) {
                            result.errorMessage = contentMessage.custom.body.source;
                        }
                    } else {
                        result.errorMessage = '';
                    }
                }
            } else {
                Logger.error('Order.js:' + pdfObject.errorDescription);
                if (!empty(pdfObject.errorDescription)) {
                    result.errorMessage = pdfObject.errorDescription;
                }
            }
        } else {
            Logger.error('Order.js: Empty hook extension point');
        }
    } else {
        Logger.error('Order.js: Site Preference not configured');
    }

    return result;
}


/**
 * webhooks checks auth
 * @param {Object} req - request object
 * @returns {boolean} - auth status
 */
function checkWebhookAuthentication(req) {
    var Site = require('dw/system/Site').getCurrent();
    if (Site.getCurrent().status === Site.SITE_STATUS_PROTECTED) {
        // If site is protected, check is already completed on server
        return true;
    }
    var baUser = Site.getCurrent().getCustomPreferenceValue('returnWebhookBasicAuthUser');
    var baPassword = Site.getCurrent().getCustomPreferenceValue('returnWebhookBasicAuthPassword');
    var baHeader = req.httpHeaders.authorization;
    if (!(baUser && baPassword && baHeader)) {
        return false;
    }
    var basicPrefix = 'Basic';
    if (baHeader && baHeader.indexOf(basicPrefix) === 0) {
        var StringUtils = require('dw/util/StringUtils');
        // Authorization: Basic base64credentials
        var base64Credentials = baHeader.substring(basicPrefix.length).trim();
        var credentials = StringUtils.decodeBase64(base64Credentials); // credentials = username:password
        var values = credentials.split(':', 2);
        return values[0] === baUser && values[1] === baPassword;
    }
    return false;
}

module.exports = {
    getPDF: getPDF,
    getReturnInstructionText: base.getReturnInstructionText,
    checkWebhookAuthentication: checkWebhookAuthentication
};
