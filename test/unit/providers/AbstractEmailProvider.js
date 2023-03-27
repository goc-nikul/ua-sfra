'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/AbstractEmailProvider', function() {

    let AbstractEmailProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractEmailProvider', {
        '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });

    let provider = new AbstractEmailProvider();

    it('Testing method: init', () => {
        provider.init('test');
        assert.equal('test', provider.options);
    });

    it('Testing method: get', () => {
        let result = provider.get('test');
        assert.equal('object', typeof result);
        assert.equal('undefined', typeof result.send());
    });

    it('Testing method: send', () => {
        try {
            provider.send()
        } catch (e) {
            assert.equal('Must be implemented in extended class', e.message);
        }
    });
});
