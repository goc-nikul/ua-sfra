'use strict';

/* API Includes */
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger').getLogger('NAVERPAY');

/**
 * Function to get the naverpay url domain for development and live environment
 * @returns {string} domain
 */
function getDomain() {
    var Resource = require('dw/web/Resource');
    var mode = Site.getCurrent().getCustomPreferenceValue('NaverPayMode');
    return Resource.msg('domain.' + mode.value.toLowerCase(), 'naverpay', null);
}

/**
 * Function to get the naverpay cancellation url
 * @returns {string} cancellation api url
 */
function getCancelUrl() {
    var merchantID = Site.getCurrent().getCustomPreferenceValue('NaverPayMerchantID');
    return getDomain() + '/' + merchantID + '/naverpay/payments/v1/cancel';
}

/**
 * Function to get the transactionID from the order payment instrument
 * @param {dw.order.Order} order order object
 * @returns {string} transaction ID
 */
function getTransactionID(order) {
    var paymentInstrument = order.getPaymentInstruments('NAVERPAY')[0];
    return paymentInstrument.paymentTransaction.transactionID;
}

/**
 * Function to update refund API response in order
 * @param {dw.order.Order} order order object
 * @param {string} jsonToUpdate response
 */
function updateRefundsJSON(order, jsonToUpdate) {
    var Transaction = require('dw/system/Transaction');
    Transaction.begin();
    var arr = [];
    if (empty(order.custom.naverPay_refundResultJson)) {
        arr.push(jsonToUpdate);
    } else {
        arr = JSON.parse(order.custom.naverPay_refundResultJson);
        arr.push(jsonToUpdate);
    }
    order.custom.naverPay_refundResultJson = JSON.stringify(arr); // eslint-disable-line no-param-reassign
    Transaction.commit();
}

exports.getPaymentApprovalUrl = () => {
    var merchantID = Site.getCurrent().getCustomPreferenceValue('NaverPayMerchantID');
    return getDomain() + '/' + merchantID + '/naverpay/payments/v2.2/apply/payment';
};

exports.updateOrderJSON = (order, jsonToUpdate) => {
    var arr = [];
    if (empty(order.custom.returnResult)) {
        arr.push(jsonToUpdate);
    } else {
        arr = JSON.parse(order.custom.returnResult);
        arr.push(jsonToUpdate);
    }
    order.custom.returnResult = JSON.stringify(arr); // eslint-disable-line no-param-reassign
};

exports.cancelPayment = function (order, cancelPrice, refundableAmount, reason) {
    var Resource = require('dw/web/Resource');
    var UUIDUtils = require('dw/util/UUIDUtils');

    var paymentId = getTransactionID(order);
    if (!empty(paymentId)) {
        if (reason === '') {
            reason = Resource.msg('return.reason.default', 'forms', '');    // eslint-disable-line no-param-reassign
        }
        // call Payment Cancelation API
        var naverPayService = require('*/cartridge/scripts/service/naverPayService').cancelService.call({
            idempotencyKey: UUIDUtils.createUUID(),
            url: getCancelUrl(),
            paymentId: paymentId,
            cancelAmount: cancelPrice,
            cancelReason: reason
        });
        if (naverPayService.status === 'OK') {
            var responseObject = naverPayService.object;
            updateRefundsJSON(order, responseObject.getText());  // eslint-disable-line no-param-reassign
            return true;
        }
        Logger.error('NaverPay: Refund failed : ' + naverPayService.errorMessage + ' : ' + naverPayService.error);
    } else {
        Logger.error('NaverPay: Refund failed : Payment ID not found');
    }
    return false;
};

exports.updateRefundAmount = function (order, cancelPrice) {
    var paymentPrice = 0;
    var alreadyRefund;
    var refundAmount;
    var remainAmount;
    var paymentInstrument = order.getPaymentInstruments('NAVERPAY')[0];
    paymentPrice += paymentInstrument.paymentTransaction.amount;
    alreadyRefund = paymentInstrument.paymentTransaction.custom.refundAmount || 0;
    refundAmount = alreadyRefund + cancelPrice;
    remainAmount = paymentPrice - refundAmount;
    paymentInstrument.paymentTransaction.custom.refundAmount = refundAmount;
    paymentInstrument.paymentTransaction.custom.remainAmount = remainAmount;
};
