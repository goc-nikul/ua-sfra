'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../../mockModuleSuperModule');

function BaseIndex() {}

describe('plugin_productpersonalize/cartridge/models/productLineItem/decorators/index.js', () => {

    before(() => {
        mockSuperModule.create(BaseIndex);
    });

    it('Testing index model', () => {
        var IndexModel = proxyquire('../../../../../../cartridges/plugin_productpersonalize/cartridge/models/productLineItem/decorators/index.js', {
            '*/cartridge/models/productLineItem/decorators/productPersonalization' : () => {}
        });
        var index = new IndexModel();
        assert.isDefined(index, 'Index model is not defined');
        assert.isNotNull(index, 'Index model is null');
    });

});
