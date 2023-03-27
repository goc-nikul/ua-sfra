'use strict';

var URLUtils = require('dw/web/URLUtils');
var system = require('dw/system');

/**
 * Returns Atome custom and hardcoded preferences
 * @returns {Object} custom and hardcoded preferences
 */
function getPreferences() {
    var prefs = {};
    var site = system.Site.getCurrent();

    // Site custom preferences:
    prefs.isAtomeEnabled = site.getCustomPreferenceValue('atomeEnabled');
    prefs.callbackUrl = URLUtils.abs('Atome-PaymentCallbackUrl').toString();
    prefs.cancelUrl = URLUtils.abs('Atome-PaymentCancelUrl').toString();
    prefs.resultUrl = URLUtils.abs('Atome-PaymentResultUrl').toString();
    prefs.currentCurrencyCode = session.currency.currencyCode;
    return prefs;
}

module.exports = getPreferences();
