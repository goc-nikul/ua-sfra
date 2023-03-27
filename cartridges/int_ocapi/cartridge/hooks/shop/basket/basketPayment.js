'use strict';

/* eslint-disable no-unused-vars */

/* API Includes */
var Status = require('dw/system/Status');

/* Script modules */
var paymentHelper = require('~/cartridge/scripts/paymentHelper');
var basketHelper = require('*/cartridge/scripts/basketHelper');

/**
 * Adds a payment instrument to a basket.
 * @param {Basket} basket - Current basket
 * @param {BasketPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @returns {Status} - Status
 */
exports.beforePOST = function (basket, paymentInstrumentRequest) {
    if (basketHelper.isCCPaymentInstrumentRequest(paymentInstrumentRequest)) {
        basketHelper.removeCCPaymentInstruments(basket); // remove any existing cc pi before adding a new one.
    }

    var paymentUpdateStatus = paymentHelper.updatePaymentInstrument(paymentInstrumentRequest);
    return paymentUpdateStatus;
};

/**
 * Updates a payment instrument of a basket.
 * @param {Basket} basket - Current basket
 * @param {OrderPaymentInstrument} paymentInstrument - Basket Payment Instrument
 * @param {BasketPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @returns {Status} - Status
 */
exports.beforePATCH = function (basket, paymentInstrument, paymentInstrumentRequest) {
    var paymentUpdateStatus = paymentHelper.patchPaymentInstrument(basket, paymentInstrument, paymentInstrumentRequest);
    return paymentUpdateStatus;
};

/**
 * Adjust a payment instrument to a basket mainly giftcard and vip payments.
 * @param {Basket} basket - Current basket
 * @param {BasketPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @returns {Status} - Status
 */
exports.afterPOST = function (basket, paymentInstrumentRequest) {
    basketHelper.manageKlarnaSession(basket);
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    var creditCardToken = 'credit_card_token' in paymentInstrumentRequest && paymentInstrumentRequest['credit_card_token'] ? paymentInstrumentRequest['credit_card_token'] : ''; // eslint-disable-line
    if (isAurusEnabled && !creditCardToken) {
        var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
        var authorizationResult = aurusPayHelper.setAurusCreditAttributes(basket, paymentInstrumentRequest);
        if (authorizationResult.error) {
            return new Status(Status.ERROR, 'ERROR', JSON.stringify(authorizationResult.errorMessage));
        }
    }
    var paymentUpdateStatus = paymentHelper.adjustPaymentInstrument(paymentInstrumentRequest);
    return paymentUpdateStatus;
};

/**
 * Adjust payment instrument of a basket .
 * @param {Basket} basket - Current basket
 * @param {OrderPaymentInstrument} paymentInstrument - Basket Payment Instrument
 * @param {BasketPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @returns {Status} - Status
 */
exports.afterPATCH = function (basket, paymentInstrument, paymentInstrumentRequest) {
	// TODO: Can be used this method in future based on scenario's
    return new Status(Status.OK);
};

exports.modifyPOSTResponse = function (basket, basketResponse, paymentInstrumentRequest) {
    paymentHelper.modifyPaymentResponse(basket, basketResponse, paymentInstrumentRequest);
    return basketHelper.updateResponse(basketResponse);
};
