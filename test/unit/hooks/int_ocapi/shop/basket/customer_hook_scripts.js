'use strict';

const { assert } = require('chai');

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ocapi/cartridge/hooks/shop/basket/customer_hook_scripts.js', () => {

    it('Testing method: afterPUT', () => {
        var customerHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/customer_hook_scripts.js', {
            'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => ''
            }
        });
        assert.doesNotThrow(() => customerHookScripts.afterPUT());
    });

    it('Testing method: afterPATCH', () => {
        var customerHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/customer_hook_scripts.js', {
            'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
            '~/cartridge/scripts/basketHelper': {
                manageKlarnaSession: () => ''
            }
        });
        assert.doesNotThrow(() => customerHookScripts.afterPUT());
    });

});
