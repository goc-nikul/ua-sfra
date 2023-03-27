'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/config/preferences', () => {
    const preferences = proxyquire('../../../cartridges/app_ua_core/cartridge/config/preferences', {
        'app_storefront_base/cartridge/config/preferences': {}
    });

    it('Testing config preferences properties', () => {
        assert.equal(preferences.plpBackButtonOn, false);
    });
});
