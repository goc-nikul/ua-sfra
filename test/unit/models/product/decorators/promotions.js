'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
let Collection = require('../../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections');
describe('app_ua_core/cartridge/models/product/decorators/promotions.js', () => {
    let Obj = proxyquire('../../../../../cartridges/app_ua_core/cartridge/models/product/decorators/promotions.js', {
        '*/cartridge/scripts/util/collections': Collection
    });


    it('Testing for promotions', () => {
        var promotions = [
            {
                campaign: {}
            }];
        var object = {};
        new Obj(object, promotions);
        assert.equal(object.promotions.length, 1);
    });

    it('Testing for promotions --> promo has calloutMsg and details', () => {
        var promotions = [
            {
                campaign: {},
                calloutMsg: 'calloutMsg',
                details: {
                    markup: 'markup'
                }
            }];
        var object = {};
        new Obj(object, promotions);
        assert.equal(object.promotions.length, 1);
    });

    it('Testing for promotions --> there is no promotions', () => {
        var promotions = [];
        var object = {};
        new Obj(object, promotions);
        assert.isNull(object.promotions);
    });
});
