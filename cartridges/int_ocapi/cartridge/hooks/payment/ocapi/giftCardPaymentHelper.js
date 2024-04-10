/* eslint-disable no-unused-vars */
'use strict';

/* eslint-disable no-param-reassign */

/**
 * Update payment request with decrypted Paymetric data
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} paymentInstrumentRequest - Updated payment Instrument Request
 */
function updatePaymentInstrument(paymentInstrumentRequest) {
    var result = { error: false };
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    var paymentInstruments = basket.getPaymentInstruments();
    if (paymentInstruments.size() > 0) {
        var paymentInstrumentsIt = paymentInstruments.iterator();
        while (paymentInstrumentsIt.hasNext()) {
            var paymentInstrument = paymentInstrumentsIt.next();
            if (!paymentInstrument.getPaymentMethod().equalsIgnoreCase('GIFT_CARD') && !paymentInstrument.getPaymentMethod().equalsIgnoreCase('Paymetric') && !paymentInstrument.getPaymentMethod().equalsIgnoreCase('CREDIT_CARD') && !paymentInstrument.getPaymentMethod().equalsIgnoreCase('AURUS_CREDIT_CARD')) {
                basket.removePaymentInstrument(paymentInstrument);
            }
        }
    }
    return result;
}


/**
 * Update payment request with decrypted Paymetric data
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} result - Updated payment Instrument Request
 */
function adjustPaymentInstrument(paymentInstrumentRequest) {
    var result = { error: false };
    const Resource = require('dw/web/Resource');
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    var BasketMgr = require('dw/order/BasketMgr');
    var gcDetails = JSON.parse(paymentInstrumentRequest.toString());
    var gcNumber = gcDetails.basket_payment_instrument_request.c_gcNumber_s;
    var basket = BasketMgr.getCurrentBasket();
    var giftCardsBalanceFirstData = giftcardHelper.updatePaymentTransaction(basket);
    if (giftCardsBalanceFirstData.error) {
        result.msg = Resource.msg('giftcards.default.error', 'giftcards', null);
        result.error = true;
        result.errorCode = 'EmptyOrInvalidGiftcard';
        return result;
    }
    if (giftCardsBalanceFirstData.giftCardsData) {
        const gcBasketPaymentInstrumentMatch = giftCardsBalanceFirstData.giftCardsData.filter(function (gc) {
            return gc.gcNumber === gcNumber;
        });
        // if gift card from response isn't applied as payment method
        if (gcBasketPaymentInstrumentMatch.length === 0) {
            result.msg = Resource.msg('giftcards.apply.insufficient.balance', 'giftcards', null);
            result.error = true;
            result.errorCode = 'EmptyOrInvalidGiftcard';
            return result;
        }
    }

    if (giftCardsBalanceFirstData.giftCardsWithZeroBalance && giftCardsBalanceFirstData.giftCardsWithZeroBalance.length > 0) {
        var invalidCard;
        giftCardsBalanceFirstData.giftCardsWithZeroBalance.forEach(function (zeroBalanceCard) {
            if (zeroBalanceCard.cardNumber === gcNumber) {
                invalidCard = zeroBalanceCard;
                return;
            }
        });
        if (invalidCard) {
            result.msg = Resource.msg('giftcards.apply.insufficient.balance', 'giftcards', null);
            result.error = true;
            result.errorCode = 'EmptyOrInvalidGiftcard';
            return result;
        }
    }
    return result;
}

/**
 * Adjust payment instrument of a basket .
 * @param {Basket} basket - Current basket
 * @param {Object} basketResponse - Basket response object
 * @param {Object} paymentInstrumentRequest - Payment instrument request
 * @returns {Status} - Status
 */
function modifyPaymentResponse(basket, basketResponse, paymentInstrumentRequest) {
    var result = { error: false };
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    var response = basketResponse;
    response.c_remainingBalance = giftcardHelper.getRemainingBalance(basket);
    return result;
}

exports.updatePaymentInstrument = updatePaymentInstrument;
exports.adjustPaymentInstrument = adjustPaymentInstrument;
exports.modifyPaymentResponse = modifyPaymentResponse;
