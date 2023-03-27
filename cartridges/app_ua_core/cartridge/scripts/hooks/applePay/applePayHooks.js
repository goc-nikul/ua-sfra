'use strict';

/**
 * Verifies if entered point information is a valid.
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an status object
 */
function handle(basket, paymentInformation) { // eslint-disable-line no-unused-vars
    var result = {
        error: false
    };
    return result;
}

/**
 * Authorizes a payment using a Apple pay.
 * @param {string} orderNo - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @return {Object} returns an status object
 */
function authorize(orderNo, paymentInstrument) {
    var Logger = require('dw/system/Logger');
    var ApplePayLogger = Logger.getLogger('ApplePay', 'Applepay');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var applePayHelper = require('*/cartridge/scripts/helpers/applePayHelper');
    var result = {
        error: true
    };
    var order = OrderMgr.getOrder(orderNo);
    var authResult = applePayHelper.authorize(order);
    if (!authResult.ok && authResult.status !== 'OK') {
        result.errorMessage = authResult.errorMessage;
        return result;
    }
    if (authResult.ok && authResult.status === 'OK') {
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
        var authResponse = (authResult.object.statusCode === 200) ? JSON.parse(authResult.object.text) : null;
        // Return error response if the card is not Authorized
        // eslint-disable-next-line spellcheck/spell-checker
        if (authResponse.resultCode !== 'Authorised' && authResponse.status !== 'authorized') {
            result.errorMessage = authResponse.refusalReason;
            result.errorCode = authResponse.refusalReasonCode;
            result.resultCode = authResponse.resultCode || authResponse.status;
            ApplePayLogger.error('Error while authorizing the order :: ' + order.orderNo + ' ErrorMessage:: ' + authResponse.refusalReason + ' ErrorCode:: ' + authResponse.refusalReasonCode);
            return result;
        }
        Transaction.wrap(function () {
            var paymentTransaction = paymentInstrument.paymentTransaction;
            // eslint-disable-next-line spellcheck/spell-checker
            paymentTransaction.transactionID = authResponse.pspReference ? authResponse.pspReference : authResponse.transaction_id;
            paymentTransaction.paymentProcessor = paymentProcessor;
            // eslint-disable-next-line no-param-reassign
            paymentInstrument.custom.paymentData = '';
            // eslint-disable-next-line no-undef
            order.custom.customerLocale = request.locale;
            // eslint-disable-next-line no-undef
            order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
        });
        return authResult;
    }
    return result;
}

exports.Handle = handle;
exports.Authorize = authorize;
