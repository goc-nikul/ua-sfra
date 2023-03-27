'use strict';

/* eslint-disable */

var assert = require('chai').assert;

describe('app_ua_core/cartridge/models/productLineItem/decorators/priceItem', () => {
    var decorator = require('../../../cartridges/app_ua_core/cartridge/models/productLineItem/decorators/priceItem');

    it('Testing method: getPriceItem', () => {
        var pli = {
            getPrice: function() {
                return {
                    currencyCode: 'currencyCode',
                    value: 2
                };
            },
            quantity: 2
        }
        var obj = {};
        decorator(obj, pli);

        assert.deepEqual(obj, {
            priceItem: {
                currencyCode: 'currencyCode',
                value: 1
            }
        });
    });
});
