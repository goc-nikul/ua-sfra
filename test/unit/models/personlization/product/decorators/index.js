'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../../mockModuleSuperModule')

function BaseIndex() {}

describe('plugin_productpersonalize/cartridge/models/product/decorators/index.js', () => {

    before(() => {
        mockSuperModule.create(BaseIndex);
    });

    it('Testing index model', () => {
        var IndexModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/product/decorators/index.js', {
            '*/cartridge/models/product/decorators/productPersonlization': () => {}
        });
        var index = new IndexModel();
        assert.isNotNull(index, 'Index Model is null');
    });

});
