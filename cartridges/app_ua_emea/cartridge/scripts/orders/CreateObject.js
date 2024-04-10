'use strict';

let CustomObjectMgr = require('dw/object/CustomObjectMgr');
let Logger = require('dw/system/Logger');
let ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
let Transaction = require('dw/system/Transaction');

/**
 * Get Transaction Reference
 * @param {dw.order.Order} order - Order Object
 * @returns {Object} Transaction Reference
 */
function getTransactionReference(order) {
    let eaPaymentMethodType = null;
    let eaPaymentInstruments = null;
    let eaPaymentInstrument = null;
    let transactionReference = order.getCustom().Adyen_pspReference;
    let orderChannelType = !empty(order.channelType) ? order.channelType.value : null;

    if (orderChannelType !== order.CHANNEL_TYPE_DSS) {
        return transactionReference;
    }

    eaPaymentMethodType = require('configuration').getValue('eaCreditCardPaymentMethod');
    eaPaymentInstruments = order.getPaymentInstruments(eaPaymentMethodType);
    eaPaymentInstrument = eaPaymentInstruments.length ? eaPaymentInstruments[0] : null;

    if (!empty(eaPaymentInstrument)) {
        if (eaPaymentInstrument.custom.eaBanamexTransactionID) {
            transactionReference = eaPaymentInstrument.custom.eaBanamexTransactionID;
        }
        if (eaPaymentInstrument.custom.eaTransbankVerificationCode) {
            transactionReference = eaPaymentInstrument.custom.eaTransbankVerificationCode;
        }
        if (!transactionReference) {
            transactionReference = '';
        }
    }

    return transactionReference;
}

/**
 * This function creates ReturnXML custom Object
 * @param {Object} order - Order Object
 * @param {Object} retCase - returnItems data
 * @param {Object} retObj - return data
 */
function returnDetailsSavedToNotes(order, retCase, retObj) {
    var returnID = retCase.getReturnCaseNumber();
    var returnSkusJson = retObj.custom.returnSkusJson;
    var trackingNumber = retObj.custom.trackingNumber;
    var transactionReference = retObj.custom.transactionReference;
    var currencyCode = retObj.custom.currencyCode;
    Transaction.wrap(function () {
        var returnNote = 'Returns Item details  /n returnID :' + returnID + '\n returnSkus:' + returnSkusJson + '\n trackingNumber:' + trackingNumber + '\n currencyCode:' + currencyCode + '\n transactionReference :' + transactionReference;
        order.addNote('Return Details', returnNote);
    });
}

/**
 * This function creates ReturnXML custom Object
 * @param {Object} order - Order Object
 * @param {Object} retCase - returnItems data
 * @param {boolean|null} exportStatus - opional custom object's exportStatus
 */
function createObj(order, retCase, exportStatus) {
    let returnsUtils = new ReturnsUtils();
    let holdExport = returnsUtils.getPreferenceValue('holdExport', order.custom.customerLocale);
    try {
        // Create ReturnXML object
        Transaction.begin();
        var retObj = CustomObjectMgr.createCustomObject('ReturnXML', retCase.getReturnCaseNumber());
        retObj.custom.dwOrderNo = order.getOrderNo();
        retObj.custom.trackingNumber = retCase.custom.trackingNumber;
        retObj.custom.consignmentId = retCase.custom.consignmentId;
        retObj.custom.returnShipmentProvider = retCase.custom.returnShipmentProvider;
        retObj.custom.trackingLink = retCase.custom.trackingLink;
        if (!holdExport) {
            retObj.custom.readyToExport = true;
        }
        // retObj.custom.customerSapId = 'customerSAP_ID' in order.getCustom() ? order.getCustom().customerSAP_ID : '';
        // retObj.custom.invoiceSapId = 'invoiceSAP_ID' in order.getCustom() ? order.getCustom().invoiceSAP_ID : '';
        retObj.custom.transactionReference = getTransactionReference(order);
        retObj.custom.currencyCode = order.getCurrencyCode();
        var jsonItems = {};
        var retItems = retCase.getItems();
        for (let i = 0; i < retItems.length; i++) {
            let item = retItems[i];
            let productLineItem = item.getLineItem();
            jsonItems[productLineItem.getCustom().sku] = {
                sku: productLineItem.getCustom().sku,
                qty: item.getAuthorizedQuantity().value,
                reasonCode: item.getReasonCode().value,
                upc: productLineItem.productID
            };
            if (item.getNote()) {
                jsonItems[productLineItem.getCustom().sku].comments = item.getNote();
            }
        }
        retObj.custom.returnSkusJson = JSON.stringify(jsonItems);
        returnDetailsSavedToNotes(order, retCase, retObj);
        if (typeof exportStatus !== 'undefined') retObj.custom.readyToExport = exportStatus;
        Transaction.commit();
    } catch (e) {
        Transaction.rollback();
        Logger.error(e);
    }
}

exports.createObj = createObj;
