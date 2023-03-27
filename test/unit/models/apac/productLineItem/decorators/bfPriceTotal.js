'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

const BfPriceTotal = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/models/productLineItem/decorators/bfPriceTotal.js', {
    'dw/value/Money': require('../../../../../mocks/dw/dw_value_Money'),
    'dw/util/StringUtils': require('../../../../../mocks/dw/dw_util_StringUtils'),
    '*/cartridge/scripts/util/collections': require('../../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections')
});

var lineitem = {
    adjustedPrice: {
        value: 100,
        add: function (params) { return 100 + params }
    },
    optionProductLineItems: [],
    priceAdjustments: {
        getLength: function () { return 0; }
    },
    quantity: 1
};

describe('app_ua_apac/cartridge/models/productLineItem/decorators/bfPriceTotal', () => {

    it('Testing bfPrice model without price adjustment', () => {
        var obj = {};
        new BfPriceTotal(obj, lineitem);
        assert.isDefined(obj.bfPriceTotal, 'BF Price Total is not defined');
        assert.isDefined(obj.bfPriceTotal.adjustedUnitPrice, 'BF Price Total adjustedUnitPrice is not defined');
    });

    it('Testing bfPrice model with a single price adjustment', () => {
        var obj = {};
        lineitem.priceAdjustments.getLength = function () { return 1 };
        new BfPriceTotal(obj, lineitem);
        assert.isDefined(obj.bfPriceTotal, 'BF Price Total is not defined');
        assert.isDefined(obj.bfPriceTotal.adjustedUnitPrice, 'BF Price Total adjustedUnitPrice is not defined');
    });

    it('Testing bfPrice model with a multiple price adjustment', () => {
        var obj = {};
        lineitem.priceAdjustments.getLength = function () { return 2 };
        new BfPriceTotal(obj, lineitem);
        assert.isDefined(obj.bfPriceTotal, 'BF Price Total is not defined');
        assert.isDefined(obj.bfPriceTotal.adjustedUnitPrice, 'BF Price Total adjustedUnitPrice is not defined');
    });

    it('Testing bfPrice model with a optionProductLineItems price adjustment', () => {
        var obj = {};
        lineitem.priceAdjustments.getLength = function () { return 2 };
        lineitem.optionProductLineItems = [{ adjustedPrice: 10 }];
        new BfPriceTotal(obj, lineitem);
        assert.isDefined(obj.bfPriceTotal, 'BF Price Total is not defined');
        assert.isDefined(obj.bfPriceTotal.adjustedUnitPrice, 'BF Price Total adjustedUnitPrice is not defined');
    });

});
