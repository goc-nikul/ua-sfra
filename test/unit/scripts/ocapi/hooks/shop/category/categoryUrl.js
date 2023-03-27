'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/hooks/shop/category/categoryUrl.js', () => {
    var categoryUrl = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/category/categoryUrl.js', {
        'dw/system/Status': function () {},
        'dw/web/URLUtils': {
            url: function () {
                return {
                    replace: function () {
                        return {
                            replace: function () {
                                return 'url';
                            }
                        };
                    }
                };
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getID: function () {
                        return 'MX';
                    }
                };
            }
        },
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getValue: function () {
                return {};
            }
        }
    });

    it('Testing modifyGETResponse', () => {
        global.request.getLocale = function () {
            return 'es_MX';
        };
        global.customer.isMemberOfCustomerGroup = function () {
            return true;
        };
        var categoryInstance = {
            getTemplate: function () {
                return {};
            },
            custom: {
                loyalty: 'loyalty'
            },
            categories: [{}]
        };
        var category = {
            id: 'root1',
            categories: [{
                categories: [{}]
            }],
            custom: {
                loyalty: 'loyalty'
            }
        };
        var result = categoryUrl.modifyGETResponse(categoryInstance, category);
        assert.isNotNull(result);
    });

    it('Testing modifyGETResponse --> isLoyaltyEnabled', () => {
        global.request.getLocale = function () {
            return 'es_MX';
        };
        global.customer.isMemberOfCustomerGroup = function () {
            return false;
        };
        var categoryInstance = {
            getTemplate: function () {
                return {};
            },
            custom: {
                loyalty: 'loyalty'
            },
            categories: [{}]
        };
        var category = {
            id: 'root1',
            categories: [{
                categories: [{}]
            }],
            custom: {
                loyalty: 'loyalty'
            }
        };
        var result = categoryUrl.modifyGETResponse(categoryInstance, category);
        assert.isNotNull(result);
    });
});
