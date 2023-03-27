'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');

function BaseFullProduct() {}

var fullproduct;

describe('plugin_productpersonalize/cartridge/models/product/fullProduct.js', () => {

    before(() => {
        mockSuperModule.create(BaseFullProduct);
    });

    it('Testing full product model if not arguments passed', () => {
        var FullProduct = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/product/fullProduct.js', {
            '*/cartridge/models/product/decorators/index': {
                productPersonlization: () => {}
            }
        });
        fullproduct = new FullProduct();
        assert.isNotNull(fullproduct, 'fullproduct object is null');
    });

});
