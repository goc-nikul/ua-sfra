'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ocapi/cartridge/hooks/shop/basket/basket_reference_hook_scripts.js', () => {

    it('Testing method: afterPOST', () => {
        var basketReferenceHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/basket_reference_hook_scripts.js', {
            './basket_hook_scripts': {
                afterPOST: () => true
            }
        });
        assert.doesNotThrow(() => basketReferenceHookScripts.afterPOST());
    });

});
