'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseDefaultModelMock = require('../baseModel');
var DefaultModel;

var preferencesUtil = {
    isCountryEnabled: function () {
        return true;
    }
};

var afterPayHelper = {
    getAfterPayInstallmentPrice: function (price) { return '$ ' + price; }
};

describe('app_ua_apac/cartridge/models/price/default', () => {

    before(function () {
        mockSuperModule.create(baseDefaultModelMock);
    });

    it('Test default price when isAfterPayEnabled is not enabled', () => {
        DefaultModel = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/price/default.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return false }
            },
            '*/cartridge/scripts/helpers/afterPayHelper': afterPayHelper
        });
        var defaultModel = new DefaultModel();
        assert.isUndefined(defaultModel.afterPaypdpPrice, 'After pay should be not exists on disabling');
    });

    it('Test default price when isAfterPayEnabled is enabled and salesPrice exists', () => {
        DefaultModel = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/price/default.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': preferencesUtil,
            '*/cartridge/scripts/helpers/afterPayHelper': afterPayHelper
        });
        var defaultModel = new DefaultModel(100);
        assert.isDefined(defaultModel.afterPaypdpPrice, 'afterPaypdpPrice not exists');
    });

    it('Test default price when isAfterPayEnabled is enabled and list exists', () => {
        DefaultModel = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/price/default.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': preferencesUtil,
            '*/cartridge/scripts/helpers/afterPayHelper': afterPayHelper
        });
        var defaultModel = new DefaultModel(null, 101);
        assert.isDefined(defaultModel.afterPaypdpPrice, 'afterPaypdpPrice not exists');
    });

    it('Test default price when isAfterPayEnabled is enabled and priceBookSalesPrice exists', () => {
        DefaultModel = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/price/default.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': preferencesUtil,
            '*/cartridge/scripts/helpers/afterPayHelper': afterPayHelper
        });
        var defaultModel = new DefaultModel(null, null, 100);
        assert.isUndefined(defaultModel.afterPaypdpPrice, 'afterPaypdpPrice not exists');
    });

    it('Test default price when isAfterPayEnabled is enabled and actualListPrice exists', () => {
        DefaultModel = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/price/default.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': preferencesUtil,
            '*/cartridge/scripts/helpers/afterPayHelper': afterPayHelper
        });
        var defaultModel = new DefaultModel(null, null, null, 100);
        assert.isDefined(defaultModel.afterPaypdpPrice, 'afterPaypdpPrice not exists');
    });

});
