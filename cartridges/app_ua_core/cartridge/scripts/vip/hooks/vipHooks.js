'use strict';

// To Do - write logic to handle below hooks
const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');

/**
 * Verifies if entered vip point information is a valid.
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
 * Authorizes a payment using a VIP Points..
 * @param {string} orderNo - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @return {Object} returns an status object
 */
function authorize(orderNo, paymentInstrument) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Order = require('dw/order/Order');

    var result = {
        error: true
    };
    var order = OrderMgr.getOrder(orderNo);
    var amount = paymentInstrument.paymentTransaction.amount.value;
    var accountNumber = paymentInstrument.custom.vipAccountId;
    // Check VIP Balance
    var vipPoints = vipDataHelpers.checkBalance(accountNumber);
    if (amount && vipPoints && vipPoints.success && vipPoints.response && vipPoints.response.availableBalance && vipPoints.response.availableBalance >= amount) {
        result = vipDataHelpers.authorize(accountNumber, amount);
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
        Transaction.wrap(function () {
            if (result && result.success && result.response && result.response.id) {
                var paymentTransaction = paymentInstrument.paymentTransaction;
                paymentTransaction.transactionID = result.response.id;
                paymentTransaction.paymentProcessor = paymentProcessor;
                order.custom.orderReasonFMS = (result.response.contract && result.response.contract.costCenter && result.response.contract.costCenter.orderReasonFMS) ? result.response.contract.costCenter.orderReasonFMS : null;
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            }
            // eslint-disable-next-line no-undef
            order.custom.customerLocale = request.locale;
            // eslint-disable-next-line no-undef
            order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
        });
    }

    return result;
}
/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) { // eslint-disable-line no-unused-vars
    var viewData = viewFormData;
    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Reverse the vip points.
 * @param {dw.order.Basket} currentBasket Current users's basket
 * @return {Object} returns an status object
 */
function reverseVipPoints(currentBasket) {
    var results = {
        success: false
    };
    var authorizationId = vipDataHelpers.getVipAuthorizationId(currentBasket);
    if (authorizationId) {
        results = vipDataHelpers.voidAuthorization(authorizationId);
    }

    return results;
}

exports.Handle = handle;
exports.Authorize = authorize;
exports.processForm = processForm;
exports.reverseVipPoints = reverseVipPoints;
