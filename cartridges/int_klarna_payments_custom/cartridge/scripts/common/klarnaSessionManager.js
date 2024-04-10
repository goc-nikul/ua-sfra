/* globals empty */

'use strict';

var superModule = module.superModule;

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var log = Logger.getLogger('KlarnaPayments');
var Site = require('dw/system/Site');
var isKlarnaEnabled = 'isKlarnaEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isKlarnaEnabled');

/**
 * Get Klarna Session
 * @param {dw.order.Basket} basket cart object
 * @param {Object} localeObject Klarna locale object
 * @returns {boolean} true, if klarna session exists
 */
superModule.prototype.getSession = function (basket, localeObject) {
    var getSessionHelper = require('*/cartridge/scripts/session/klarnaPaymentsGetSession');
    var kpSessionId = basket.custom && 'kpSessionId' in basket.custom && basket.custom.kpSessionId ? basket.custom.kpSessionId : null;
    if (empty(kpSessionId)) {
        return true;
    }
    var getSessionResponse = getSessionHelper.getSession(kpSessionId, basket, localeObject);
    if (Site.getCurrent().getCustomPreferenceValue('kpCreateNewSessionWhenExpires') && !getSessionResponse.success) {
        log.error('Klarna Session Update Or Klarna Session expiration: {0}', kpSessionId);
        return true;
    } else if (!getSessionResponse.success) {
        log.error('Klarna Session Update Or Klarna Session expiration: {0}', kpSessionId);
        return false;
    }
    return true;
};

/**
 * Validates Klarna Session.
 *
 * @returns {boolean} true, if the session is valid.
 */
superModule.prototype.hasValidSession = function () {
    var basket = BasketMgr.getCurrentBasket();
    var localeObject = this.getLocale();
    if (empty(basket)) {
        return false;
    }
    this.getSession(basket, localeObject);
    var localesMatch = (localeObject.custom.klarnaLocale === session.privacy.KlarnaLocale);
    return ((basket.custom && 'kpSessionId' in basket.custom && !empty(basket.custom.kpSessionId)) && localesMatch);
};

/**
 * Adding Create Or Update Session for Ocapi in Klarna Session
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {Object} Last API call's response; on error - null
 */
superModule.prototype.createOrUpdateSessionOCAPI = function (basket) { // eslint-disable-line
    try {
        log.info('createOrUpdateSessionOCAPI');
        if (basket && basket.getPaymentInstruments('KLARNA_PAYMENTS').length > 0) {
            var klarnaPaymentInstrument = basket.getPaymentInstruments('KLARNA_PAYMENTS')[0];
            // Klarna session creation/updation call
            if (klarnaPaymentInstrument.custom.KlarnaPaymentsSessionID) {
                log.info('KlarnaPaymentsSessionID: {0}', klarnaPaymentInstrument.custom.KlarnaPaymentsSessionID);
                // refresh klarna session
                return this.refreshSessionOCAPI(klarnaPaymentInstrument, 'OCAPI');
            }
            // create klarna session
            return this.createSessionOCAPI(klarnaPaymentInstrument, 'OCAPI');
        }
    } catch (e) {
        log.error('Error in handling Klarna Payments Session OCAPI: {0}', e.message + e.stack);
        return null;
    }
};

/**
 * Refresh an existing Klarna Session.
 *
 * The current session is updated by using the REST Klarna interface.
 * Then, another GET call is made to retrieve session information and
 * update DW user session.
 *
 * @returns {Object} Response from the GET call.
 */
superModule.prototype.refreshSession = function () {
    var basket = BasketMgr.getCurrentBasket();
    if (empty(basket) || !isKlarnaEnabled) {
        return null;
    }

    var localeObject = this.getLocale();
    var updateSessionHelper = require('*/cartridge/scripts/session/klarnaPaymentsUpdateSession');
    var updateSessionResponse = updateSessionHelper.updateSession(basket.custom.kpSessionId, basket, localeObject);
    return updateSessionResponse.response;
};

/**
 * Create a new Klarna session.
 *
 * Parts of the Klarna API call's response are saved into
 * the DW user session for later use.
 *
 * @returns {Object} Klarna API call response.
 */
superModule.prototype.createSession = function () {
    var basket = BasketMgr.getCurrentBasket();
    if (empty(basket) || !isKlarnaEnabled) {
        return null;
    }

    var localeObject = this.getLocale();
    var createSessionHelper = require('*/cartridge/scripts/session/klarnaPaymentsCreateSession');
    var createSessionResponse = createSessionHelper.createSession(basket, localeObject);
    return createSessionResponse.response;
};

module.exports = superModule;
