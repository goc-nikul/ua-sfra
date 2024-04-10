'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_klarna_payments_custom/cartridge/scripts/checkout/checkoutHelpers.js file test cases', () => {
    let checkoutHelpers = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/checkout/checkoutHelpers.js', {
        'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Status': require('../../../mocks/dw/dw_system_Status'),
        'dw/order/Order': require('../../../mocks/dw/dw_order_Order'),
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/util/klarnaPaymentsConstants': {},
        '*/cartridge/scripts/util/klarnaHelper': {
            getPaymentMethod: function () {
                return 'KLARNA_PAYMENTS';
            }
        }
    });
    it('Test findKlarnaPaymentTransaction method with non Klarna payment instrument', function () {
        let order = require('../../../mocks/dw/dw_order_OrderMgr').getOrder();
        var klarnaPaymentTransaction = checkoutHelpers.findKlarnaPaymentTransaction(order);
        assert.equal(klarnaPaymentTransaction, null);
    });
    it('Test findKlarnaPaymentTransaction method with Klarna payment instrument ', function () {
        let order = require('../../../mocks/dw/dw_order_OrderMgr').getOrder();
        order.createPaymentInstrument('KLARNA_PAYMENTS', 100);
        var paymentTransaction = checkoutHelpers.findKlarnaPaymentTransaction(order);
        assert.equal(100, paymentTransaction.amount);
    });
});
