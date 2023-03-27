'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var handleVIPPaymentStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/payment/ocapi/vipPaymentHelper.js', () => {

    var vipPaymentHelper = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/payment/ocapi/vipPaymentHelper.js', {
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/order/BasketMgr': require('../../../../mocks/dw/dw_order_BasketMgr'),
        '*/cartridge/scripts/vipDataHelpers': {
            handleVIPPayment: handleVIPPaymentStub,
            getRemainingBalance: () => 10
        }
    });

    it('Testing method: updatePaymentInstrument', () => {
        global.empty = (params) => !params;
        global.customer = {
            profile: {
                custom: {
                    vipAccountId: '1234'
                }
            }
        };
        var result = vipPaymentHelper.updatePaymentInstrument();
        delete global.customer.profile.custom.vipAccountId;
        var result2 = vipPaymentHelper.updatePaymentInstrument();
        assert.isFalse(result.error);
        assert.isTrue(result2.error);
    });

    it('Testing method: adjustPaymentInstrument with error', () => {
        handleVIPPaymentStub.returns({
            error: true
        });
        var result = vipPaymentHelper.adjustPaymentInstrument();
        assert.isTrue(result.error);
        handleVIPPaymentStub.resetBehavior();
    });

    it('Testing method: adjustPaymentInstrument without error', () => {
        handleVIPPaymentStub.returns({
            error: false,
            vipPromotionEnabled: true
        });
        var result = vipPaymentHelper.adjustPaymentInstrument();
        assert.isTrue(result.error);
        handleVIPPaymentStub.resetBehavior();
    });

    it('Testing method: modifyPaymentResponse', () => {
        var result = vipPaymentHelper.modifyPaymentResponse(null, {});
        assert.isFalse(result.error);
    });

});
