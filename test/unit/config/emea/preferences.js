'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockModuleSuperModule = require('../../../mockModuleSuperModule');
var base = {
    qasProvinceMapping: ''
};
mockModuleSuperModule.create(base);
describe('app_ua_core/cartridge/config/preferences', () => {
    const preferences = proxyquire('../../../../cartridges/app_ua_emea/cartridge/config/preferences', {
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
    });

    it('Testing config preferences properties', () => {
        assert.equal(preferences.qasProvinceMapping, true);
    });
});
