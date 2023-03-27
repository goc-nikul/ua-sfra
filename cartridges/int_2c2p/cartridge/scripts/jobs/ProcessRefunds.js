'use strict';

var log = require('~/cartridge/scripts/logs/2c2p.js');

/**
 * Get encrypted merchant signature
 * @param {string} orderNo DW order number
 * @param {Obejct} amount refund amount
 * @returns {Object} encrypted data
 */
function getMerchantSignature(orderNo, amount) {
    var config = require('~/cartridge/scripts/config/2c2Prefs.js');
    var stringToHash = config.returnVersion + config.merchantID + 'R' + orderNo + amount;
    var WeakMac = require('dw/crypto/WeakMac');
    var mac = new WeakMac(WeakMac.HMAC_SHA_1);
    return require('dw/crypto/Encoding').toHex(mac.digest(stringToHash, config.secret)).toUpperCase();
}

/**
 * Build input data
 * @param {string} orderNo invoice number
 * @param {Object} amount refund amount
 * @returns {string} returns request payload
 */
function formData(orderNo, amount) {
    var config = require('~/cartridge/scripts/config/2c2Prefs.js');
    return '<PaymentProcessRequest>' +
        '<version>' + config.returnVersion + '</version>'
        + '<merchantID>' + config.merchantID + '</merchantID>'
        + '<processType>R</processType>'
        + '<invoiceNo>' + orderNo + '</invoiceNo>'
        + '<actionAmount>' + amount + '</actionAmount>'
        + '<hashValue>' + getMerchantSignature(orderNo, amount) + '</hashValue>'
        + '</PaymentProcessRequest>';
}

/**
 * Calculate refund amount
 * @param {string} refundJson JSON formatted refund
 * @returns {Object} returns refund object
 */
function getRefundAmount(refundJson) {
    var refundAmount = 0.0;
    try {
        var refundObj = JSON.parse(refundJson);
        refundObj.forEach((item) => {
            if (!item.refunded) refundAmount += parseFloat(item.refundAmount);// eslint-disable-line
        });
    } catch (e) {
        refundAmount = 0;
        log.writelog(log.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
    }
    return refundAmount;
}

/**
 * Update DW order's refund json
 * @param {Object} order DW order object
 */
function updateRefundAttributes(order) {
    // Exception handled is done in calling method to rollback for any exceptions
    var refundObj = JSON.parse(order.custom.refundsJson);
    refundObj.forEach((item) => {
        item.refunded = true;// eslint-disable-line
    });
    order.custom.refundsJson = JSON.stringify(refundObj);// eslint-disable-line
}

/**
 * Process order to initiate refund
 * @param {Object} order DW order
 */
function processOrderRefund(order) {
    try {
        var amount = getRefundAmount(order.custom.refundsJson);
        if (!amount) throw new Error('Invalid Refund amount: ' + amount);
        var base64Text = require('dw/util/StringUtils').encodeBase64(formData(order.orderNo, amount));
        var refundResponse = require('~/cartridge/scripts/helpers/serviceHelper').refund(encodeURI(base64Text));
        if (!refundResponse) throw new Error('Invalid refund status for orderID: ' + order.orderNo);
        var xmlObj = new XML(refundResponse);// eslint-disable-line
        if (xmlObj.respCode.toString() !== '00') throw new Error('Invalid response code: ' + xmlObj.respCode);
        require('dw/system/Transaction').wrap(() => {
            order.custom.offlineRefund = false;// eslint-disable-line
            updateRefundAttributes(order);
        });
    } catch (error) {
        log.writelog(log.LOG_TYPE.ERROR, 'Payment Refund 2C2 Payment: ' + error);
    }
}

/**
* File is used for Refund process for credit card payments
*/
function execute() {
    var config = require('~/cartridge/scripts/config/2c2Prefs.js');
    var CheckDate = require('dw/system/Site').calendar;
    CheckDate.add(require('dw/util/Calendar').DAY_OF_YEAR, -(config.refundCancelMaxDays2C2));
    require('dw/order/OrderMgr').processOrders(processOrderRefund, 'custom.PaymentAmount2c2 != NULL AND custom.offlineRefund = {0} AND lastModified >= {1}', true, CheckDate.time);
}

exports.execute = execute;
