'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var mockSuperModule = require('../../../mockModuleSuperModule');
var baseTotalModelMock = require('./baseModel');

var lineItemContainer = {
    totalGrossPrice: {
        value: 99
    },
    getTotalGrossPrice: function () {
        return 100;
    }
};

describe('app_ua_apac/cartridge/models/totals', () => {

    before(function () {
        mockSuperModule.create(baseTotalModelMock);
    });

    it('Testing totals when atomeEnabled is disabled and afterpay disabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return false; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return false; }
                    }
                }
            },
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isUndefined(total.installmentGrandTotal, 'atomeEnabled is disabled and it should not define installmentGrandTotal property');
        assert.isUndefined(total.afterPayCartPrice, 'afterpay is disabled and it should not define afterPayCartPrice property');
    });

    it('Testing totals when atomeEnabled is enabled and afterpay disabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return false; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    }
                }
            },
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isDefined(total.installmentGrandTotal, 'property installmentGrandTotal is not defined in total model');
        assert.equal(total.installmentGrandTotal, '$33.00');
        assert.isUndefined(total.afterPayCartPrice, 'afterpay is disabled and it should not define afterPayCartPrice property');
    });

    it('Testing totals when atomeEnabled is disabled and afterpay enabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return true; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return false; }
                    }
                }
            },
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
            '*/cartridge/scripts/helpers/afterPayHelper': {
                getAfterPayInstallmentPrice: function (price) {
                    return '$' + price / 4;
                }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isUndefined(total.installmentGrandTotal, 'atomeEnabled is disabled and it should not define installmentGrandTotal property');
        assert.isDefined(total.afterPayCartPrice, 'property afterPayCartPrice is not defined');
        assert.equal(total.afterPayCartPrice, '$25');
    });


    it('Testing totals when atomeEnabled is enabled and afterpay enabled', () => {
        session.currency = {
            symbol: '$'
        };
        var TotalModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/totals.js', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                isCountryEnabled: function () { return true; }
            },
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () { return true; }
                    }
                }
            },
            '*/cartridge/scripts/atome/helpers/atomeHelpers': {
                toFixed: function (installmentGrossPrice) { return installmentGrossPrice.toFixed(2) }
            },
            '*/cartridge/scripts/helpers/afterPayHelper': {
                getAfterPayInstallmentPrice: function (price) {
                    return '$' + price / 4;
                }
            }
        });
        var total = new TotalModel(lineItemContainer);
        assert.isDefined(total.installmentGrandTotal, 'installmentGrandTotal should be defined');
        assert.isDefined(total.afterPayCartPrice, 'afterPayCartPrice should be defined');
        assert.equal(total.installmentGrandTotal, '$33.00');
        assert.equal(total.afterPayCartPrice, '$25');
    });

});
