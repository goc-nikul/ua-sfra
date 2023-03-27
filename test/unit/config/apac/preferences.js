'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');

var preferences;

function Base() { }

describe('app_ua_apac/cartridge/config/preferences', () => {

    var Site = {
        current: {
            preferences: {
                custom: {}
            }
        }
    };

    var Locale = {
        getLocale: function () {
            return { country: 'AU' }
        }
    };

    before(function () {
        mockSuperModule.create(Base);
        preferences = proxyquire('../../../../cartridges/app_ua_apac/cartridge/config/preferences.js', {
            'dw/system/Site': Site,
            'dw/util/Locale': Locale
        });
    });

    it('Testing for QAS Valid countries', () => {
        assert.isNull(preferences.qasValidCountries, 'qasValidCountries is null');
        // validate when QAS
        Site.current.preferences.custom = {
            qasValidCountries: {
                AU: 'AUS',
                NZ: 'NZL',
                SG: 'SGP',
                MY: 'MYS'
            }
        };
        preferences = proxyquire('../../../../cartridges/app_ua_apac/cartridge/config/preferences.js', {
            'dw/system/Site': Site,
            'dw/util/Locale': Locale
        });
        assert.isDefined(preferences.qasValidCountries, 'qasValidCountries should not be undefined');
        assert.isNotNull(preferences.qasValidCountries, 'qasValidCountries should not null');
        delete Site.current.preferences.custom.qasValidCountries;
    });

    it('Testing for businessTypeAddressEnabled', () => {
        assert.isNull(preferences.businessTypeAddressEnabled, 'businessTypeAddressEnabled is null');
        Site.current.preferences.custom = {
            businessTypeAddressEnabled: 'AUS'
        };
        preferences = proxyquire('../../../../cartridges/app_ua_apac/cartridge/config/preferences.js', {
            'dw/system/Site': Site,
            'dw/util/Locale': Locale
        });
        assert.isDefined(preferences.businessTypeAddressEnabled, 'businessTypeAddressEnabled should not be undefined');
        assert.isNotNull(preferences.businessTypeAddressEnabled, 'businessTypeAddressEnabled should not null');
        delete Site.current.preferences.custom.businessTypeAddressEnabled;
    });

    it('Testing for isPersonalizationEnable', () => {
        assert.isFalse(preferences.isPersonalizationEnable, 'isPersonalizationEnable is true');

        Site.current.preferences.custom = {
            enablePersonalization: true
        };
        preferences = proxyquire('../../../../cartridges/app_ua_apac/cartridge/config/preferences.js', {
            'dw/system/Site': Site,
            'dw/util/Locale': Locale
        });
        assert.isDefined(preferences.isPersonalizationEnable, 'isPersonalizationEnable should not be undefined');
        assert.isTrue(preferences.isPersonalizationEnable, 'isPersonalizationEnable should not null');

        Site.current.preferences.custom = {
            enablePersonalization: false
        };
        preferences = proxyquire('../../../../cartridges/app_ua_apac/cartridge/config/preferences.js', {
            'dw/system/Site': Site,
            'dw/util/Locale': Locale
        });
        assert.isDefined(preferences.isPersonalizationEnable, 'isPersonalizationEnable should not be undefined');
        assert.isFalse(preferences.isPersonalizationEnable, 'isPersonalizationEnable should not null');

        delete Site.current.preferences.custom.enablePersonalization;
    });

    it('Testing for isZipPayEnabled', () => {
        assert.isFalse(preferences.isZipPayEnabled, 'isPersonalizationEnable is true');

        Site.current.preferences.custom = {
            enableZippay: ['AU']
        };
        preferences = proxyquire('../../../../cartridges/app_ua_apac/cartridge/config/preferences.js', {
            'dw/system/Site': Site,
            'dw/util/Locale': Locale
        });
        assert.isDefined(preferences.isZipPayEnabled, 'isZipPayEnabled should not be undefined');
        assert.isTrue(preferences.isZipPayEnabled, 'isZipPayEnabled should not null');

        Site.current.preferences.custom = {
            enableZippay: ['NZ']
        };
        preferences = proxyquire('../../../../cartridges/app_ua_apac/cartridge/config/preferences.js', {
            'dw/system/Site': Site,
            'dw/util/Locale': Locale
        });
        assert.isDefined(preferences.isZipPayEnabled, 'isZipPayEnabled should not be undefined');
        assert.isFalse(preferences.isZipPayEnabled, 'isZipPayEnabled should not null');

        delete Site.current.preferences.custom.enableZippay;
    });

});
