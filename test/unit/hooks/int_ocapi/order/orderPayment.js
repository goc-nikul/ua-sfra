'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_ocapi/cartridge/hooks/shop/order/orderPayment.js', () => {

    var orderPayment = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/orderPayment.js', {
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        '~/cartridge/scripts/paymentHelper': {
            updatePaymentInstrument: () => true
        }
    });

    it('Testing method: beforePOST', () => {
        assert.isTrue(orderPayment.beforePOST());
    });

    it('Testing method: beforePATCH', () => {
        assert.isTrue(orderPayment.beforePATCH());
    });

});
