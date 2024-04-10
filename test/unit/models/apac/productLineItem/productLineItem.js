'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');

function BaseFullProduct() { }

var fullproduct;

describe('app_ua_apac/cartridge/models/productLineItem/productLineItem.js', () => {
    before(() => {
        mockSuperModule.create(BaseFullProduct);
    });

    it('Testing full product model if not arguments passed', () => {
        var FullProduct = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/models/productLineItem/productLineItem.js', {
            '*/cartridge/models/productLineItem/decorators/index': {
                memberPricing: () => { }
            }
        });
        fullproduct = new FullProduct();
        assert.isNotNull(fullproduct, 'fullproduct object is null');
    });
});
