'use strict';

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
                return 'US';
            },
            getDefaultCurrency() {
                return 'USA';
            }
        };
    }
};

describe('app_ua_core/cartridge/config/countries.js', () => {
    it('Testing allowedLocales: Countries method to return allowed locales from preferences', () => {
        var result = proxyquire('../../../cartridges/app_ua_core/cartridge/config/countries.js', {
            '~/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: function () {
                    return 'allowedLocales';
                }
            },
            'dw/system/Site': Site,
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger')
        });
        assert.equal(result, 'allowedLocales');
        assert.isNotNull(result, 'allowedLocales shouldn\'t be null');
        assert.isDefined(result, 'allowedLocales should defined');
    });

    it('Testing allowedLocales: Countries method to return Default locale and currency when preference unavailable ', () => {
        var result = proxyquire('../../../cartridges/app_ua_core/cartridge/config/countries.js', {
            '~/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: () => null
            },
            'dw/system/Site': Site,
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger')
        });
        assert.isNotNull(result, 'allowedLocales shouldn\'t be null');
        assert.isDefined(result, 'allowedLocales should defined');
    });
});
