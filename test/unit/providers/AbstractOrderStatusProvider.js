'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/AbstractOrderStatusProvider', function() {

    let AbstractOrderStatusProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractOrderStatusProvider', {
        '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });

    let provider = new AbstractOrderStatusProvider();

    it('Testing method: init', () => {
        provider.init('testOrder');
        assert.equal('testOrder', provider.order);
    });

    it('Testing method: get', () => {
        let result = provider.get('testOrder');
        assert.equal('object', typeof result);
        assert.equal('undefined', typeof result.handleReadyForExport());
    });

    it('Testing method: handleReadyForExport', () => {
        try {
            provider.handleReadyForExport()
        } catch (e) {
            assert.equal('Must be implemented in extended class', e.message);
        }
    });
});
