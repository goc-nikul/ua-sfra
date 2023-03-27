'use strict';

/**
 * Get all Product description
 * @param {Object} order DW Order
 * @returns {string} returns comma seperated product IDs
 */
function getDescription(order) {
    var collections = require('*/cartridge/scripts/util/collections');
    var description = [];
    collections.forEach(order.productLineItems, (productLineItem) => {
        description.push(productLineItem.productID);
    });
    return description.join(',');
}

/**
 * Converts DW array object to model array
 * @param {Object} dwArray DW Array
 * @returns {Object} returns array
 */
function toPlainArray(dwArray) {
    var plainArray = [];
    dwArray.forEach((item) => {
        plainArray.push(item);
    });
    return plainArray;
}

/**
 * Format URL according to current environment and locale
 * @param {string} urlAction URL action
 * @returns {string} formatted URL according to current environment
 */
function formatURL(urlAction) {
    return urlAction ? require('dw/web/URLUtils').abs(urlAction).toString() : '';
}

/**
 * Model for payment token request
 * @param {Object} order DW Order
 */
function paymentToken(order) {
    var c2pPref = require('*/cartridge/scripts/config/2c2Prefs');
    this.merchantID = c2pPref.merchantID;
    this.invoiceNo = order.orderNo;
    this.description = getDescription(order);
    this.amount = order.totalGrossPrice.value;
    this.currencyCode = order.currencyCode;
    if (c2pPref.request3DS) this.request3DS = c2pPref.request3DS;
    this.frontendReturnUrl = formatURL(c2pPref.frontendReturnUrl || '2C2PAYMENT-HandleReturnResponse');
    if (c2pPref.backendReturnUrl) this.backendReturnUrl = formatURL(c2pPref.backendReturnUrl);
    if (c2pPref.paymentChannel) this.paymentChannel = toPlainArray(c2pPref.paymentChannel);
}

module.exports = paymentToken;
