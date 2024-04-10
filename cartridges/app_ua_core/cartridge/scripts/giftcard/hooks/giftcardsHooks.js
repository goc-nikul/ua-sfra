'use strict';

// To Do - write logic to handle below hooks
const firstDataHelper = require('int_first_data/cartridge/scripts/firstDataHelper');
const errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');

/**
 * Verifies if entered gift cards information is a valid.
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
 * Authorizes a payment using a gift card..
 * @param {string} orderNo - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @return {Object} returns an status object
 */
function authorize(orderNo, paymentInstrument) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var result = {
        error: true
    };
    var order = OrderMgr.getOrder(orderNo);
    var gcNumber = paymentInstrument.custom.gcNumber;
    var gcPin = paymentInstrument.custom.gcPin;
    var amount = paymentInstrument.paymentTransaction.amount.value;
    const gcBalanceResponse = firstDataHelper.checkBalance(gcNumber, gcPin);
    if (gcNumber && gcPin && amount && gcBalanceResponse && gcBalanceResponse.success && gcBalanceResponse.giftCardData && gcBalanceResponse.giftCardData.currentBalance && gcBalanceResponse.giftCardData.currentBalance >= amount) {
        result = firstDataHelper.authorizeGiftCard(gcNumber, gcPin, amount, order.orderNo, order.customerEmail);
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
        Transaction.wrap(function () {
            if (result && result.success && result.giftCardData && result.giftCardData.transactionNumber) {
                var paymentTransaction = paymentInstrument.paymentTransaction;
                paymentTransaction.transactionID = result.giftCardData.transactionNumber;
                paymentTransaction.paymentProcessor = paymentProcessor;
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
 * Reverse the gift card amount.
 * @param {dw.order.Basket} currentBasket Current users's basket
 * @return {Object} returns an status object
 */
function reverseGiftCardsAmount(currentBasket) {
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    var results = {
        success: false
    };
    var appliedGCList = giftcardHelper.getAppliedGiftCards(currentBasket, true);
    errorLogger.error('appliedGCList {0}', appliedGCList);
    if (appliedGCList && appliedGCList.length > 0) {
        results = firstDataHelper.reverseGiftCardsAmount(appliedGCList);
        errorLogger.error('appliedGCList results {0}', JSON.stringify(results));
    }

    return results;
}

exports.Handle = handle;
exports.Authorize = authorize;
exports.processForm = processForm;
exports.reverseGiftCardsAmount = reverseGiftCardsAmount;
