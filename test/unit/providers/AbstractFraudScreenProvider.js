'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/AbstractFraudScreenProvider', function() {

    let AbstractFraudScreenProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractFraudScreenProvider', {
        '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });

    let provider = new AbstractFraudScreenProvider();

    it('Testing method: init', () => {
        provider.init('testOrder');
        assert.equal('testOrder', provider.order);
    });

    it('Testing method: get', () => {
        let result = provider.get('testOrder');
        assert.equal('object', typeof result);
        assert.equal('accept', result.validate());
    });

    it('Testing method: validate', () => {
        try {
            provider.validate()
        } catch (e) {
            assert.equal('Must be implemented in extended class', e.message);
        }
    });
});
