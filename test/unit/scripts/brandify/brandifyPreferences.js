'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_brandify/cartridge/scripts/BrandifyPreferences', () => {

    it('Testing BrandifyPreferences', function () {
        var brandifyPreferences = proxyquire('../../../../cartridges/int_brandify/cartridge/scripts/BrandifyPreferences.js', {
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
        assert.equal(brandifyPreferences.BrandifyAppKey, 'brandifyAppKey');
        assert.isTrue(brandifyPreferences.BrandifyEnabled);
    });

});
