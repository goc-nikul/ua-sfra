/* eslint spellcheck/spell-checker: 0 */

/**
* Returns site language from locale.
* @param {Object} locale // { id: 'en_US', currency: { ... } }
* @returns {string} language // en
*/
function siteLanguage(locale) {
    return locale && locale.id && locale.id.split('_')[0];
}

function getShipTo(locale) {
    try {
        var Site = require('dw/system/Site');
        const localeId = locale && locale.id && locale.id.toLowerCase();
        const shipTo = !empty(session.custom.currentCountry) ? session.custom.currentCountry.toLowerCase() : localeId.split('_').pop();
        var borderFreeCountries = 'tealiumBorderFreeCountries' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('tealiumBorderFreeCountries');
        borderFreeCountries = JSON.parse(borderFreeCountries);
        return  borderFreeCountries[shipTo];
    } catch (e) {
        return  undefined;
    }
}

/**
* Returns site country code from locale.
* @param {Object} locale // { id: 'en_US', currency: { ... } }
* @returns {string} country code // US
*/
function getSiteCountryCode(locale) {
  const localeId = locale && locale.id && locale.id.toUpperCase();
  return localeId.split('_').pop();
}

/**
* Returns site currency from locale.currency
* @param {Object} currencyObj // { currencyCode: 'USD', defaultFractionDigits: 2, name: 'US Dollar', symbol: '$' }
* @returns {string} currencyCode // USD
*/
function siteCurrency(currencyObj) {
    return currencyObj && currencyObj.currencyCode;
}
module.exports = function siteLogic(logicArgs) {
    const locale = logicArgs.locale;
    const currency = logicArgs.locale && logicArgs.locale.currency || {};
    const siteSection = logicArgs.siteSection;

    return {
        site_currency: siteCurrency(currency), // s.currencyCode
        site_language: siteLanguage(locale), // s.eVar60
        site_section: siteSection, // s.channel
        site_shipto_country: getShipTo(locale), // s.eVar38 replacing borderfree
        site_country_code: getSiteCountryCode(locale)
    }
};
