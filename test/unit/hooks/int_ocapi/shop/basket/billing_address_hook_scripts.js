'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var httpParametersStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/shop/basket/billing_address_hook_scripts.js', () => {

    var billingAddressHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/billing_address_hook_scripts.js', {
        'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
        'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
        'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
        './basket_hook_scripts': {
            beforePUT: () => true,
            afterPUT: () => ''
        },
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: () => ''
        },
        '~/cartridge/scripts/basketHelper': {
            manageKlarnaSession: () => ''
        }
    });

    it('Testing method: beforePUT', () => {
        global.empty = (params) => !params;
        global.request = {
            getHttpParameters: httpParametersStub
        };
        httpParametersStub.returns({
            containsKey: (key) => key === 'use_as_shipping',
            get: () => ['true']
        });
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        assert.doesNotThrow(() => billingAddressHookScripts.beforePUT(basket));
        httpParametersStub.throws(new Error('Test'));
        assert.doesNotThrow(() => billingAddressHookScripts.beforePUT(basket));
        httpParametersStub.returns({
            containsKey: () => false,
            get: () => ['true']
        });
        assert.doesNotThrow(() => billingAddressHookScripts.beforePUT(basket));
        httpParametersStub.resetBehavior();
    });

    it('Testing method: afterPUT', () => {
        httpParametersStub.returns({
            containsKey: (key) => true,
            get: () => ['true']
        });
        var basket = new(require('../../../../../mocks/dw/dw_order_Basket'))();
        billingAddressHookScripts.afterPUT(basket);
        httpParametersStub.throws(new Error('Test'));
        billingAddressHookScripts.afterPUT(basket);
        httpParametersStub.returns({
            containsKey: () => true,
            get: () => ['true']
        });
        billingAddressHookScripts.afterPUT(basket);
        httpParametersStub.returns({
            containsKey: () => false,
            get: () => ['true']
        });
        billingAddressHookScripts.afterPUT(basket);
        httpParametersStub.resetBehavior();
    });
});
