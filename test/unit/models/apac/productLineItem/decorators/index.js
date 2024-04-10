'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var mockSuperModule = require('../../../../../mockModuleSuperModule');

function OrgIndex() { }

describe('app_ua_apac/cartridge/models/productLineItem/decorators/index.js', () => {
    before(() => {
        mockSuperModule.create(OrgIndex);
    });

    it('Testing index.js', () => {
        var Index = proxyquire('../../../../../../cartridges/app_ua_apac/cartridge/models/productLineItem/decorators/index.js', {
            '*/cartridge/models/product/decorators/memberPricing.js': {}
        });
        assert.isNotNull(new Index(), 'index object is null');
    });
});
