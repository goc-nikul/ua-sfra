'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/hooks/shop/product/productHookUtils.j', () => {
    var productHookUtils = proxyquire('../../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/product/productHookUtils.js', {
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getID: function () {
                        return 'ID';
                    }
                }
            }
        },
        'dw/web/URLUtils': {
            url: function () {
                return {
                    replace: function () {
                        return {
                            replace: function () {
                                return {};
                            }
                        };
                    }
                };
            }
        }
    });

    it('Testing product getProductUrl', () => {
        global.request.getLocale = function () {
            return {
                toLowerCase: function () {
                    return {
                        replace: function () {
                            return {};
                        }
                    };
                }
            };
        };
        var productObj = {};
        var productHook = productHookUtils.getProductUrl(productObj);
        assert.isNotNull(productHook);
    });
});
