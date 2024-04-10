'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var hookStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/shop/basket/basket_coupon_hook_scripts.js', () => {
    var Status = require('../../../../../mocks/dw/dw_system_Status');
    var basketCouponHookScripts = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/basket_coupon_hook_scripts.js', {
        'dw/system/Status': Status,
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
            estimate: () => true,
            canApplyLoyaltyCoupon: () => true
        },
        'dw/system/HookMgr': {
            callHook: hookStub
        },
        'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
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

    it('Testing method: beforePOST --> adding a valid coupon', () => {
        global.customer = {
            isMemberOfCustomerGroup: () => true
        };
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();

        var numCoupons = basket.couponLineItems.length;
        var status = basketCouponHookScripts.beforePOST(basket, { code: 'VALIDCOUPONCODE' });
        assert.equal(status.status, Status.OK);
        assert.equal(basket.couponLineItems.length, numCoupons);
    });

    it('Testing method: beforePOST --> adding an invalid coupon', () => {
        var invalidCouponCode = 'INVALIDCOUPONCODE';
        var invalidCouponCodeErrorCode = 'COUPON_CODE_UNKNOWN';

        global.customer = {
            isMemberOfCustomerGroup: () => true
        };
        var basket = new (require('../../../../../mocks/dw/dw_order_Basket'))();
        basket.createCouponLineItem = function () {
            var error = new Error();
            error.errorCode = invalidCouponCodeErrorCode;
            throw error;
        };

        var numCoupons = basket.couponLineItems.length;
        var status = basketCouponHookScripts.beforePOST(basket, { code: invalidCouponCode });
        assert.deepEqual(status, {
            status: Status.ERROR,
            code: 'CREATE_COUPON_LINE_ITEM_ERROR',
            message: 'testMsg', // from Resource mock
            details: {
                couponCode: invalidCouponCode,
                errorCode: invalidCouponCodeErrorCode
            }
        });
        assert.equal(basket.couponLineItems.length, numCoupons);
    });
});
