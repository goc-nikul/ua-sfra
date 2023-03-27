/* eslint-disable no-unused-vars */
'use strict';

/* eslint-disable no-param-reassign */

/**
 * Update payment request with vip payment
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} paymentInstrumentRequest - Updated payment Instrument Request
 */
function updatePaymentInstrument(paymentInstrumentRequest) {
    var currentCustomer = customer;
    const Resource = require('dw/web/Resource');
    const Site = require('dw/system/Site');
    var result = { error: false };
    var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
    if (!isVIP) {
        result.msg = Resource.msg('vip.invalid.customer', 'checkout', null);
        result.error = true;
        return result;
    }
    return result;
}

/**
 * adjust the payment request with vip payment
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} paymentInstrumentRequest - Updated payment Instrument Request
 */
function adjustPaymentInstrument(paymentInstrumentRequest) {
    const Resource = require('dw/web/Resource');
    var result = { error: false };
    var BasketMgr = require('dw/order/BasketMgr');
    const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
    var basket = BasketMgr.getCurrentBasket();
    result = vipDataHelpers.handleVIPPayment(customer, basket);
    if (!result.error && result.vipPromotionEnabled) {
        result.msg = Resource.msg('vip.apply.insufficient.balance', 'checkout', null);
        result.error = true;
        return result;
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
    const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
    var response = basketResponse;
    response.c_remainingBalance = vipDataHelpers.getRemainingBalance(basket);
    return result;
}

exports.updatePaymentInstrument = updatePaymentInstrument;
exports.adjustPaymentInstrument = adjustPaymentInstrument;
exports.modifyPaymentResponse = modifyPaymentResponse;
