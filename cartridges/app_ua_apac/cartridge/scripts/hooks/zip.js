'use strict';
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Initialize refund process
 * @param {string} referenceNo order Number
 * @param {number} amount order amount
 * @param {string} currency currency code
 * @param {string} returnReference return references
 * @param {Object} order DW Order object
 * @param {string} reason return reason
 * @param {Object} newReturn DW return object
 * @returns {Object} returns status code
 */
function refund(referenceNo, amount, currency, returnReference, order, reason, newReturn) {
    if (!amount || !currency || !order || !order.orderNo || !reason || !newReturn) return { statusCode: 500 };
    var refundStatus = require('*/cartridge/scripts/zip/helpers/orderProcess').Refund(order.orderNo, amount, reason).success; // eslint-disable-line
    var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
    var returnsUtils = new ReturnsUtils();
    if (refundStatus) {
        var Money = require('dw/value/Money');
        returnsUtils.processReturnToBeRefunded(order, newReturn, true, new Money(amount, currency));
        // eslint-disable-next-line new-cap
        returnsUtils.SetRefundsCountInfo(false, null, order);
    } else {
        // eslint-disable-next-line new-cap
        returnsUtils.SetRefundsCountInfo(true, null, order);
    }
    return {
        statusCode: refundStatus ? 200 : 500 // eslint-disable-line
    };
}

/**
 * Get zippay customer payment wallet info
 * @param {Object} paymentInstrument payment instrument model
 * @returns {Object} returns payment instrument data
 */
function getCustomerPaymentInstruments(paymentInstrument) {
    var rawPaymentInstrument = paymentInstrument.raw;
    return {
        hasZipToken: (!empty(rawPaymentInstrument.custom.ZipToken)),
        paymentMethod: rawPaymentInstrument.paymentMethod,
        UUID: paymentInstrument.UUID
    };
}

/**
 * Handle payment
 * @param {Object} order DW order
 * @returns {Object} handles payment
 */
function handlePayments(order) {
    var result = {};
    var orderNumber = order.orderNo;

    if (order.totalNetPrice !== 0.0) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).paymentProcessor;
                var authorizationResult = void 0; // eslint-disable-line

                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.'.concat(paymentProcessor.ID.toLowerCase()))) {
                        authorizationResult = HookMgr.callHook('app.payment.processor.'.concat(paymentProcessor.ID.toLowerCase()), 'Authorize', orderNumber, paymentInstrument, paymentProcessor);
                    } else {
                        authorizationResult = HookMgr.callHook('app.payment.processor.default', 'Authorize');
                    }

                    result = authorizationResult;

                    if (authorizationResult.error) {
                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order, true);
                        });
                        result.error = true;
                        break;
                    }
                }
            }
        }
    }
    return result;
}

/**
 * Validate payment status
 * @returns {Object} returns payment status
 */
function validatePayment() {
    return {
        error: false
    };
}

module.exports = {
    Refund: refund,
    getCustomerPaymentInstruments: getCustomerPaymentInstruments,
    handlePayments: handlePayments,
    validatePayment: validatePayment
};
