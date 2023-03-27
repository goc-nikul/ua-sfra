'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/AbstractAddressTypeProvider', function() {

    let AbstractAddressTypeProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractAddressTypeProvider', {
        '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });

    let provider = new AbstractAddressTypeProvider();

    it('Testing method: init', () => {
        provider.init('test');
        assert.equal('test', provider.address);
    });

    it('Testing method: get', () => {
        let result = provider;
        assert.equal('object', typeof result);
    });

    it('Testing method: addressType', () => {
        try {
            provider.addressType()
        } catch (e) {
            assert.equal('Must be implemented in extended class', e.message);
        }
    });

    it('Testing method: get', () => {
        try {
            provider.get('test')
        } catch (e) {
            assert.equal('Must be implemented in extended class', e.message);
        }
    });
});
