/* globals empty */

'use strict';

var superModule = module.superModule;

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var log = Logger.getLogger('KlarnaPayments');
var Site = require('dw/system/Site');

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

module.exports = superModule;
