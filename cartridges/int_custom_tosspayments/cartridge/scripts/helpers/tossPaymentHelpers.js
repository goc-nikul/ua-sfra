'use strict';

/* API Includes */
var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger').getLogger('TossPayments');

exports.confirmOrder = function (order) {
    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
};

exports.updateOrderJSON = function (order, jsonToUpdate) {
    var arr = [];
    if (empty(order.custom.tossPaymentsTransaction)) {
        arr.push(jsonToUpdate);
    } else {
        arr = JSON.parse(order.custom.tossPaymentsTransaction);
        arr.push(jsonToUpdate);
    }
    order.custom.tossPaymentsTransaction = JSON.stringify(arr); // eslint-disable-line no-param-reassign
};

exports.saveTransactionID = function (order, paymentKey) {
    var paymentInstrument = order.getPaymentInstruments('TOSS_PAYMENTS_CARD')[0];
    if (empty(paymentInstrument)) {
        Logger.error('TossPayment: No payment instrument in Order');
        throw new Error('TossPayment: No payment instrument in Order');
    }
    paymentInstrument.paymentTransaction.transactionID = paymentKey;
};

/**
 * Function to get the cancellation API request body
 * @param {Object} order - Order object
 * @param {string} reason - reason to cancel order
 * @param {string} cancelPrice - cancel price amount
 * @param {string} refundableAmount - refundable price amount
 * @returns {Object} - return request body
 */
function getCancellationAPIRequestBody(order, reason, cancelPrice, refundableAmount) {
    var requestBody = {
        cancelReason: reason,
        cancelAmount: cancelPrice,
        refundableAmount: refundableAmount
    };
    return JSON.stringify(requestBody);
}

exports.cancelPayment = function (order, cancelPrice, refundableAmount, reason) {
    var Resource = require('dw/web/Resource');
    var paymentKey = order.custom.tossPaymentsKey;
    if (!empty(paymentKey)) {
        if (reason === '') {
            reason = Resource.msg('return.reason.default', 'forms', '');    // eslint-disable-line no-param-reassign
        }

        var requestBody = getCancellationAPIRequestBody(order, reason, cancelPrice, refundableAmount);
        // call Payment Cancelation API
        var tossCancellationService = require('*/cartridge/scripts/service/tossPaymentService').cancelService.call({
            paymentKey: paymentKey,
            body: requestBody
        });
        if (tossCancellationService.status === 'OK') {
            var responseObject = tossCancellationService.object;
            var Transaction = require('dw/system/Transaction');
            var responseTextObject = JSON.parse(responseObject.getText());
            Transaction.begin();
            order.custom.tossPaymentsRefundDetails = responseObject.getText();  // eslint-disable-line no-param-reassign
            order.custom.tossPaymentsRefundStatus = responseTextObject.status;  // eslint-disable-line no-param-reassign
            order.custom.tossPaymentsStatus = responseTextObject.status;    // eslint-disable-line no-param-reassign
            Transaction.commit();
        } else {
            Logger.error('TossPayment: Refund failed : ' + tossCancellationService.errorMessage + ' : ' + tossCancellationService.error);
            return false;
        }
    }
    return true;
};

exports.updateRefundAmount = function (order, cancelPrice) {
    var paymentPrice = 0;
    var paymentInstrument;
    var alreadyRefund;
    var refundAmount;
    var remainAmount;
    var paymentInstruments = order.paymentInstruments;
    for (var i = 0; i < paymentInstruments.length; i++) {
        paymentInstrument = order.paymentInstruments[i];
        if (paymentInstrument.paymentMethod === 'TOSS_PAYMENTS_CARD') {
            paymentPrice += paymentInstrument.paymentTransaction.amount;
            alreadyRefund = paymentInstrument.paymentTransaction.custom.refundAmount || 0;
            refundAmount = alreadyRefund + cancelPrice;
            remainAmount = paymentPrice - refundAmount;
            paymentInstrument.paymentTransaction.custom.refundAmount = refundAmount;
            paymentInstrument.paymentTransaction.custom.remainAmount = remainAmount;
        }
    }
};
