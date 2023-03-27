'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');

var productTile;

function BaseProductTile() {}

describe('plugin_productpersonalize/cartridge/models/product/productTile.js', () => {

    before(() => {
        mockSuperModule.create(BaseProductTile);
    });

    it('Testing Product Tile', () => {
        var ProductTileModel = proxyquire('../../../../../cartridges/plugin_productpersonalize/cartridge/models/product/productTile.js', {
            '*/cartridge/models/product/decorators/index': {
                productPersonlization: () => {}
            }
        });
        productTile = new ProductTileModel();
        assert.isNotNull(productTile, 'Product tile is null');
    });

});
