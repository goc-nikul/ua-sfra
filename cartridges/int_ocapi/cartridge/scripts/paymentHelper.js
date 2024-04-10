'use strict';

var HookMgr = require('dw/system/HookMgr');
var Status = require('dw/system/Status');
const LoggerHelper = require('*/cartridge/scripts/util/loggerHelper');
const LOG_TYPE = 'paymentHelper';

/* eslint-disable no-param-reassign */

/**
 * Update Payment Instrument
 * @param {Object} paymentRequest - Payment instrument Request
 * @returns {void}
 */
function updatePaymentInstrument(paymentRequest) {
    var paymentMethodId = paymentRequest.paymentMethodId;
    var hookName = 'app.ocapi.modifyPayment.' + paymentMethodId.toLowerCase();

    if (HookMgr.hasHook(hookName)) {
        var result = HookMgr.callHook(hookName, 'updatePaymentInstrument', paymentRequest);
        var errorCode = 'ERROR';
        if (result.error) {
            if (result.errorCode) {
                errorCode = 'INVALID-ADDRESS';
            }
            return new Status(Status.ERROR, errorCode, result.msg);
        }
    }

    var basket;

    try {
        // Recalculating the basket
        // In case getCurrentBasket() fails when basket object is locked.
        var BasketMgr = require('dw/order/BasketMgr');
        basket = BasketMgr.getCurrentBasket();
        HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    } catch (e) {
        let errorMsg = 'Calculate Failure - Basket ID ' + (basket ? basket.UUID : 'BASKET ID NOT FOUND');
        LoggerHelper.logException(LOG_TYPE, errorMsg, e);
        return new Status(Status.ERROR, 'HOOK_FAILURE');
    }

    return new Status(Status.OK);
}

/**
 * This method is used to adjust the payment instruments automatically based on order total
 * @param {Object} paymentRequest - Payment instrument Request
 * @returns {void}
 */
function adjustPaymentInstrument(paymentRequest) {
    var paymentMethodId = paymentRequest.paymentMethodId;
    var hookName = 'app.ocapi.adjustPayment.' + paymentMethodId.toLowerCase();
    // Recalculating the basket
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    if (HookMgr.hasHook(hookName)) {
        var result = HookMgr.callHook(hookName, 'adjustPaymentInstrument', paymentRequest);

        if (result.error) {
            if (!empty(result.errorCode)) {
                return new Status(Status.ERROR, result.errorCode, result.msg);
            }
            return new Status(Status.ERROR, 'ERROR', result.msg);
        }
    }
    return new Status(Status.OK);
}

/**
 * This method is used to adjust the payment instruments automatically based on order total
 * @param {dw.order.Basket} basket - currentBasket
 * @param {Object} basketResponse - basket response to ocapi call
 * @param {Object} paymentInstrumentRequest - paymentInstrument request object
*  @returns {void}
 */
function modifyPaymentResponse(basket, basketResponse, paymentInstrumentRequest) {
    var paymentMethodId = paymentInstrumentRequest.paymentMethodId;
    var hookName = 'app.ocapi.modifyPaymentResponse.' + paymentMethodId.toLowerCase();

    if (HookMgr.hasHook(hookName)) {
        var result = HookMgr.callHook(hookName, 'modifyPaymentResponse', basket, basketResponse, paymentInstrumentRequest);
        if (result.error) {
            return new Status(Status.ERROR, 'ERROR', result.msg);
        }
    }

    return new Status(Status.OK);
}

/**
 * This method automatically adjusts the GiftCard and VIP payments if there is any change in the basket total if these payment instruments already available in basket
 * @param {dw.order.Basket} basket - The account model for the current customer
 * @param {Object} customer - Current customer
 * @returns {void}
 */
function autoAdjustBasketPaymentInstruments(basket) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    var Transaction = require('dw/system/Transaction');
    if (giftcardHelper.basketHasGCPaymentInstrument(basket)) {
        giftcardHelper.updatePaymentTransaction(basket);
    }

    var nonGiftCertificateAmount = COHelpers.calculateNonGiftCertificateAmount(basket);
    if (!empty(basket)) {
        var paymentInstruments = basket.getPaymentInstruments();
        if (paymentInstruments.size() > 0) {
            var paymentInstrumentsIt = paymentInstruments.iterator();
            Transaction.wrap(function () {
                while (paymentInstrumentsIt.hasNext()) {
                    var paymentInstrument = paymentInstrumentsIt.next();
                    let paymentMethod = paymentInstrument.getPaymentMethod();
                    if (paymentMethod.equalsIgnoreCase('Paymetric') || paymentMethod.equalsIgnoreCase('CREDIT_CARD') || paymentMethod.equalsIgnoreCase('AURUS_CREDIT_CARD') || paymentMethod.equalsIgnoreCase('PayPal') || paymentMethod.equalsIgnoreCase('KLARNA_PAYMENTS')) {
                        if (nonGiftCertificateAmount.value <= 0) {
                            require('dw/system/Logger').error('Removing PI with payment method {0} from basket id {1}', paymentMethod, basket.UUID);
                            basket.removePaymentInstrument(paymentInstrument);
                        } else {
                            paymentInstrument.paymentTransaction.setAmount(nonGiftCertificateAmount);
                            break;
                        }
                    }
                }
            });
        }
    }
}


/**
 * This method updates the remaining balance of the basket which is not covered by VIP or GiftCard payments
 * @param {Basket} basket - Current basket
 * @param {Object} basketResponse - Basket response object
 * @returns {void}
 */
function updateRemainingBalance(basket, basketResponse) {
    var response = basketResponse;
    var giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    if (giftcardHelper.basketHasGCPaymentInstrument(basket)) {
        response.c_remainingBalance = giftcardHelper.getRemainingBalance(basket);
    }
}

/**
 * patch the payment request with paymetric payment
 * @param {Object} basket - Current basket
 * @param {Object} paymentInstrument - Payment Instrument
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} result - result
 */
function patchPaymentInstrument(basket, paymentInstrument, paymentInstrumentRequest) {
    var paymentMethodId = paymentInstrumentRequest.paymentMethodId;
    var hookName = 'app.ocapi.patchPaymentInstrument.' + paymentMethodId.toLowerCase();
    HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    if (HookMgr.hasHook(hookName)) {
        var result = HookMgr.callHook(hookName, 'patchPaymentInstrument', basket, paymentInstrument, paymentInstrumentRequest);
        if (result.error) {
            return new Status(Status.ERROR, 'ERROR', result.msg);
        }
    }
    return new Status(Status.OK);
}

module.exports = {
    updatePaymentInstrument: updatePaymentInstrument,
    adjustPaymentInstrument: adjustPaymentInstrument,
    modifyPaymentResponse: modifyPaymentResponse,
    autoAdjustBasketPaymentInstruments: autoAdjustBasketPaymentInstruments,
    updateRemainingBalance: updateRemainingBalance,
    patchPaymentInstrument: patchPaymentInstrument
};
