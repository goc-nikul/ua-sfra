'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_ocapi/cartridge/hooks/shop/order/orderPayment.js', () => {
    var orderPayment = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/shop/order/orderPayment', {
        'dw/system/Status': function () {},
        '~/cartridge/scripts/paymentHelper': {
            updatePaymentInstrument: (parmas) => {
                return 'paymentMethodId';
            }
        }
    });

    it('Testing beforePOST', () => {
        var paymentInstrumentRequest = {
            paymentMethodId: 'beforePOST'
        };
        var result = orderPayment.beforePOST({}, paymentInstrumentRequest);
        assert.equal(result, 'paymentMethodId');
        assert.isNotNull(result);
    });

    it('Testing beforePATCH', () => {
        var paymentInstrumentRequest = {
            paymentMethodId: 'beforePATCH'
        };
        var result = orderPayment.beforePATCH({}, {}, paymentInstrumentRequest);
        assert.equal(result, 'paymentMethodId');
        assert.isNotNull(result);
    });
});
