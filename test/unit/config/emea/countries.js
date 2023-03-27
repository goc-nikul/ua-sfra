'use strict';
/* eslint-disable */
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Site = {
    current: {
        preferences: {
            custom: {}
        }
    },
    getCurrent() {
        return {
            getDefaultLocale() {
                return 'AT';
            },
            getDefaultCurrency() {
                return 'EURO';
            }
        };
    }
};
var countriesJSON = [{"countryCode":"SG","locales":["en_SG"],"currencyCode":"SGD","hostname":"development-ap01.ecm.underarmour.com.sg","priceBooks":["SGD-list","SGD-sale"],"countryDialingCode":"+65","regexp":"^[0-9]{8}$"},{"countryCode":"AU","locales":["en_AU"],"currencyCode":"AUD","hostname":"development-ap01.ecm.underarmour.com.au","priceBooks":["AUD-list","AUD-sale"]}];

describe('app_ua_emea/cartridge/config/countries.js', () => {
    it('Testing allowedLocales: Countries method to return allowed locales from preferences', () => {
        var result = proxyquire('../../../../cartridges/app_ua_emea/cartridge/config/countries.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: function () {
                    return countriesJSON;
                }
            },
            'dw/system/Site': Site,
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
        });
        assert.equal(result[0].currencyCode, 'SGD');
        assert.equal(result[0].id, 'en_SG');
        assert.isNotNull(result, 'allowedLocales shouldn\'t be null');
        assert.isDefined(result, 'allowedLocales should defined');
    });

    it('Testing allowedLocales: Countries method to return Default locale and currency when preference unavailable ', () => {
        var result = proxyquire('../../../../cartridges/app_ua_emea/cartridge/config/countries.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: () => null
            },
            'dw/system/Site': Site,
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
        });
        assert.isNotNull(result, 'allowedLocales shouldn\'t be null');
        assert.isDefined(result, 'allowedLocales should defined');
    });
});
