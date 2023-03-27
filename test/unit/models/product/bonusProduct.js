'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('app_ua_core/cartridge/models/product/bonusProduct.js', () => {

    it('Testing bonusProduct Model', () => {
        var bonusProduct = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/product/bonusProduct.js', {
            '*/cartridge/models/product/decorators/index': {
                base: function(product, apiProduct, productType) {
                    return {};
                },
                images: function() {
                    return {};
                },
                quantity: function() {
                    return {};
                },
                variationAttributes: function() {
                    return {};
                },
                attributes: function() {
                    return {};
                },
                availability: function() {
                    return {};
                },
                options: function() {
                    return {};
                },
                quantitySelector: function() {
                    return {};
                },
                readyToOrder: function() {
                    return {};
                },
                bonusUnitPrice: function() {
                    return {};
                }
            }
        });
        var apiProduct = {
            minOrderQuantity: {},
            stepQuantity: {}
        }
        var product = bonusProduct({}, apiProduct, {}, {}, {}, {});
        assert.isDefined(product, 'Product Is Defined');
    });

    it('Testing bonusProduct Model --> variationModel Exist', () => {
        var bonusProduct = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/product/bonusProduct.js', {
            '*/cartridge/models/product/decorators/index': {
                base: function(product, apiProduct, productType) {
                    return {};
                },
                images: function() {
                    return {};
                },
                quantity: function() {
                    return {};
                },
                variationAttributes: function() {
                    return {};
                },
                attributes: function() {
                    return {};
                },
                availability: function() {
                    return {};
                },
                options: function() {
                    return {};
                },
                quantitySelector: function() {
                    return {};
                },
                readyToOrder: function() {
                    return {};
                },
                bonusUnitPrice: function() {
                    return {};
                }
            }
        });
        var apiProduct = {
            minOrderQuantity: {},
            stepQuantity: {}
        }
        var options = {
            variationModel:{}
        }
        var product = bonusProduct({}, apiProduct, options, {}, {}, {});
        assert.isDefined(product, 'Product Is Defined');
    });

});
