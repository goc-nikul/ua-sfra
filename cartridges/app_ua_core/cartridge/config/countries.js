'use strict';

/**
 * Replacement of the default SFRA countries.json file
 * @return {Array} allowedLocales - List of the allowed locales
 */
function getAllowedLocales() {
    var PreferencesUtil = require('~/cartridge/scripts/utils/PreferencesUtil');
    var allowedLocales = PreferencesUtil.getJsonValue('allowedLocales');

    if (!allowedLocales) {
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
