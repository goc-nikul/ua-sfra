'use strict';

/* eslint-disable */

var assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/models/product/decorators/badges', () => {

    class Test {
        constructor(product) {
            this.product = product;
        }
    }

    var decorator = proxyquire('../../../cartridges/app_ua_core/cartridge/models/product/decorators/images', {
        '~/cartridge/models/product/productImages': Test
    });

    it('Testing method: images', () => {
        var obj = {};
        decorator(obj, 'test');
        assert.equal(obj.images.product, 'test');
    });
});
