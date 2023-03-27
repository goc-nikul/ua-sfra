'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ocapi/cartridge/hooks/payment/ocapi/klarnaPaymentHelper.js', () => {

    it('Testing method: updatePaymentInstrument', () => {

        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();

        var klarnaPaymentHelper = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/payment/ocapi/klarnaPaymentHelper.js', {
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateNonGiftCertificateAmount: () => {
                    return {
                        value: 1
                    };
                }
            },
            'dw/order/BasketMgr': {
                getCurrentBasket: () => basket
            }
        });
        global.empty = (params) => !params;
        basket.createPaymentInstrument({});
        var result = klarnaPaymentHelper.updatePaymentInstrument(new (require('../../../../mocks/dw/dw_order_PaymentInstrument'))());
        assert.isFalse(result.error);
    });

});
