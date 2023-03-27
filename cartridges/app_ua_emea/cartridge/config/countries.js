'use strict';

/**
 * Replacement of the default SFRA countries.json file
 * @return {Array} allowedLocales - List of the allowed locales
 */
function getAllowedLocales() {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var countries = PreferencesUtil.getJsonValue('countriesJSON');
    var allowedLocales = [];
    var allLocales = [];
    if (countries) {
        countries.forEach(function (country) {
            country.locales.forEach(function (locale) {
                if (allLocales.indexOf(locale) === -1) {
                    allLocales.push(locale);
                    allowedLocales.push(
                        {
                            id: locale,
                            currencyCode: country.currencyCode
                        }
                    );
                }
            });
        });
    }
    if (!allowedLocales.length) {
        var CurrentSite = require('dw/system/Site').getCurrent();
        var Logger = require('dw/system/Logger');

        allowedLocales = [{
            id: CurrentSite.getDefaultLocale(),
            currencyCode: CurrentSite.getDefaultCurrency()
        }];

        Logger.error('Site Preference "allowedLocales" missed. Allowed locales list is not available');
    }

    return allowedLocales;
}

module.exports = getAllowedLocales();
