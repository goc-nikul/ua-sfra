'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Order = require('../../../mocks/dw/dw_order_Order');

describe('int_klarna_payments_custom/cartridge/scripts/hooks/payment/processor/klarna_payments.js file test cases', () => {
    let klarnaPayment = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/hooks/payment/processor/klarna_payments.js', {
        '*/cartridge/scripts/payments/processor': proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/processor.js', {
            '*/cartridge/scripts/util/klarnaPaymentsConstants': proxyquire('../../../../cartridges/int_klarna_payments_sfra/cartridge/scripts/util/klarnaPaymentsConstants.js',{}),
            '*/cartridge/scripts/util/klarnaHelper': {
                getPaymentMethod: function () {
                    return 'KLARNA_PAYMENTS';
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/system/HookMgr': require('../../../mocks/dw/dw_system_HookMgr'),
            'dw/order/PaymentTransaction': {},
            '*/cartridge/scripts/common/klarnaSessionManager': proxyquire('../../../../cartridges/int_klarna_payments_sfra/cartridge/scripts/common/klarnaSessionManager.js',{
                'dw/order/BasketMgr': require('../../../mocks/dw/dw_order_BasketMgr'),
                'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
                'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
                'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
                '*/cartridge/scripts/util/klarnaHelper': {
                    getPaymentMethod: function () {
                        return 'KLARNA_PAYMENTS';
                    }
                },
                '*/cartridge/scripts/locale/klarnaPaymentsGetLocale': {
                    getLocaleObject: function () {
                        return {
                            success: true,
                            localeObject: {},
                            countryCode: 'US'
                        }
                    }
                }
            }),
            '*/cartridge/scripts/order/klarnaPaymentsCreateOrder': {
                createOrder: function () {
                    return {
                        success: true,
                        order_id: '12345',
                        redirect_url: '',
                        fraud_status: '',
                        response: {}
                    };
                }
            }
        }),
        'dw/order/OrderMgr': require('../../../mocks/dw/dw_order_OrderMgr')
    });
    it('Test klarna authorize method', function () {
        var order = new Order();
        order.createPaymentInstrument('KLARNA_PAYMENTS', 100);
        var paymentInstrument = order.getPaymentInstruments()[0];
        var result = klarnaPayment.Authorize(order.orderNo, paymentInstrument, 'KLARNA_PAYMENTS', '');
        assert.equal(true, result.authorized);
    });
    it('Test klarna authorize method for OCAPI', function () {
        var order = new Order();
        order.createPaymentInstrument('KLARNA_PAYMENTS', 100);
        var paymentInstrument = order.getPaymentInstruments()[0];
        var result = klarnaPayment.Authorize(order.orderNo, paymentInstrument, 'KLARNA_PAYMENTS', 'OCAPI');
        assert.equal(true, result.authorized);
    });
});
