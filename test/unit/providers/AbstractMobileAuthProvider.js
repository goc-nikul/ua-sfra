'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/AbstractMobileAuthProvider', function () {

    let AbstractMobileAuthProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractMobileAuthProvider', {
        '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });

    let provider = new AbstractMobileAuthProvider();

    it('Testing method: init', () => {
        let result = provider.init();
        assert.equal('object', typeof result);
    });

    it('Testing method: get', () => {
        let result = provider.get();
        assert.equal('object', typeof result);
    });

    it('Testing method: init', () => {
        AbstractMobileAuthProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/AbstractMobileAuthProvider', {
            '../scripts/utils/Class': require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getCustomPreferenceValue: function () {
                            return false;
                        }
                    };
                }
            }
        });
        provider = new AbstractMobileAuthProvider();
        let result = provider.init();
        assert.equal('object', typeof result);
    });
});
