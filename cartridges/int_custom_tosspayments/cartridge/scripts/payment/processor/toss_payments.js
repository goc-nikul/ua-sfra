'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
exports.processForm = (req, paymentForm, viewFormData) => {
    var viewData = viewFormData;

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    return {
        error: false,
        viewData: viewData
    };
};

/**
 * Do Handle call
 * @param {Object} currentBasket DW basket object
 * @param {Object} paymentInformation payment information
 * @param {string} paymentMethodID payment method id
 * @param {Object} req request object
 * @returns {Object} status of handle
 */
exports.Handle = (currentBasket, paymentInformation, paymentMethodID) => {
    var fieldErrors = {};
    var serverErrors = [];
    var error = false;
    try {
        Transaction.wrap(() => {
            var paymentInstruments = currentBasket.getPaymentInstruments();
            var collections = require('*/cartridge/scripts/util/collections');
            collections.forEach(paymentInstruments, (item) => {
                currentBasket.removePaymentInstrument(item);
            });
            var paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodID, currentBasket.totalGrossPrice);
            if (!paymentInstrument) throw new Error('Not able to create payment Instrument');
        });
    } catch (e) {
        var Logger = require('dw/system/Logger').getLogger('TossPayments');
        Logger.error(e.message + e.stack);
        serverErrors.push(e.mesage);
        error = true;
    }
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
};

exports.handlePayments = (order) => {
    var Site = require('dw/system/Site');
    try {
        var isTossPaymentsEnabled = Site.getCurrent().getCustomPreferenceValue('enableTossPayments');

        if (isTossPaymentsEnabled) {
            var PaymentMgr = require('dw/order/PaymentMgr');
            var URLUtils = require('dw/web/URLUtils');
            var tossPaymentConstants = require('*/cartridge/scripts/helpers/tossPaymentConstants');
            var paymentInstrument = order.getPaymentInstruments()[0];
            var paymentMethod = PaymentMgr.getPaymentMethod('TOSS_PAYMENTS_CARD');
            var paymentProcessor = paymentMethod.getPaymentProcessor();
            var tossPaymentType = tossPaymentConstants.PAYMENT_METHODS.CREDIT;

            Transaction.wrap(function () {
                paymentInstrument.paymentTransaction.transactionID = order.orderNo; // eslint-disable-line no-param-reassign
                paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor; // eslint-disable-line no-param-reassign
                order.custom.tossPaymentsType = tossPaymentType; // eslint-disable-line no-param-reassign
            });

            return {
                error: false,
                tossPaymentsRedirectUrl: URLUtils.https('TossPayments-PaymentWindow', 'orderNo', order.orderNo).toString()
            };
        }
    } catch (e) {
        var Logger = require('dw/system/Logger').getLogger('TossPayments');
        Logger.error('Toss Payments Authorization Failed ' + e.message + e.stack);
    }
    return {
        error: true
    };
};

exports.Refund = function (referenceNo, amount, currency, returnReference, order, reason) {
    var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
    var tossPaymentHelper = require('*/cartridge/scripts/helpers/tossPaymentHelpers');
    var Logger = require('dw/system/Logger').getLogger('TossPayments');
    var returnsUtils = new ReturnsUtils();
    var cancelPrice = new Number(amount);   // eslint-disable-line no-new-wrappers
    var refundReason = reason.toString();
    var paymentPrice = 0;
    var confirmPrice = 0;
    var statusCode = 200;
    var paymentInstrument;
    var alreadyRefund;
    var paymentInstruments = order.paymentInstruments;
    for (var i = 0; i < paymentInstruments.length; i++) {
        paymentInstrument = order.paymentInstruments[i];
        if (paymentInstrument.paymentMethod === 'TOSS_PAYMENTS_CARD') {
            paymentPrice += paymentInstrument.paymentTransaction.amount;
            alreadyRefund = paymentInstrument.paymentTransaction.custom.refundAmount || 0;
            confirmPrice = paymentPrice - alreadyRefund - cancelPrice;
        }
    }

    var refundableAmount = paymentPrice - alreadyRefund;

    var refundStatus = false;
    if (confirmPrice < 0) {
        Logger.error('TossPayment: Request refund error, the cancelPrice is greater than remaining amount');
        statusCode = 500;
    } else {
        refundStatus = tossPaymentHelper.cancelPayment(order, cancelPrice, refundableAmount, refundReason);
    }

    if (refundStatus) {
        returnsUtils.SetRefundsCountInfo(false, null, order);   // eslint-disable-line new-cap
        tossPaymentHelper.updateRefundAmount(order, cancelPrice);
    } else {
        returnsUtils.SetRefundsCountInfo(true, null, order);    // eslint-disable-line new-cap
        statusCode = 500;
        Logger.error('TossPayment: Refund status is : ' + refundStatus);
    }
    return {
        statusCode: statusCode // eslint-disable-line
    };
};

/**
 * Validate payment status
 * @returns {Object} returns payment status
 */
exports.validatePayment = () => {
    return {
        error: false
    };
};
