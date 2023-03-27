'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var hookStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/shop/basket/basket_coupon_hook_scripts.js', () => {

    var basketCouponHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/basket_coupon_hook_scripts.js', {
        'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
        'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/errorLogHelper': {
            handleOcapiHookErrorStatus: () => ''
        },
        '~/cartridge/scripts/paymentHelper': {
            autoAdjustBasketPaymentInstruments: () => true
        },
        '*/cartridge/scripts/utils/PreferencesUtil': {
            getValue: () => true
        },
        '*/cartridge/scripts/helpers/loyaltyHelper': {
            estimate: () => true
        },
        'dw/system/HookMgr': {
            callHook: hookStub
        },
        
    });

    it('Testing method: afterPOST', () => {
        global.customer = {
            isMemberOfCustomerGroup: () => true
        };
        hookStub.returns(true);
        basketCouponHookScripts.afterPOST();
        hookStub.throws(new Error('Test'));
        assert.doesNotThrow(() => basketCouponHookScripts.afterPOST());
        hookStub.resetBehavior();
    });

    it('Testing method: afterPOST --> coupon custom fields', () => {
        global.customer = {
            isMemberOfCustomerGroup: () => true
        };
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        assert.doesNotThrow(() => basketCouponHookScripts.afterPOST(basket));
    });

    it('Testing method: afterDELETE', () => {
        assert.doesNotThrow(() => basketCouponHookScripts.afterDELETE());
    });

});
