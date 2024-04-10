'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Order = require('../../../mocks/dw/dw_order_Order');

describe('int_klarna_payments_custom/cartridge/scripts/payments/processor.js file test cases', () => {
    var order = new Order();
    var orderNo = order.orderNo;
    let processor = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/payments/processor.js', {
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/order/PaymentMgr': require('../../../mocks/dw/dw_order_PaymentMgr'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/system/HookMgr': require('../../../mocks/dw/dw_system_HookMgr'),
        'dw/order/PaymentTransaction': {},
        '*/cartridge/scripts/util/klarnaPaymentsConstants': proxyquire('../../../../cartridges/int_klarna_payments_sfra/cartridge/scripts/util/klarnaPaymentsConstants.js',{}),
        '*/cartridge/scripts/util/klarnaHelper': {
            getPaymentMethod: function () {
                return 'KLARNA_PAYMENTS';
            }
        },
        '*/cartridge/scripts/order/klarnaPaymentsCreateOrder': {
            createOrder: function () {
                return {
                    success: true,
                    order_id: orderNo,
                    redirect_url: 'redirect_url',
                    fraud_status: {
                        ACCEPTED: 'ACCEPTED'
                    },
                    response: {
                        success: true,
                        order_id: orderNo,
                        redirect_url: 'redirect_url',
                        fraud_status: {
                            ACCEPTED: 'ACCEPTED'
                        }
                    }
                };
            }
        },
        '*/cartridge/scripts/common/klarnaSessionManager': proxyquire('../../../../cartridges/int_klarna_payments_sfra/cartridge/scripts/common/klarnaSessionManager.js', {
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
                        localeObject: {
                            custom: {
                                country: 'US',
                                klarnaLocale: 'en_us'
                            }
                        },
                        countryCode: 'us'
                    };
                }
            }
        })
    });
    order.createPaymentInstrument('KLARNA_PAYMENTS', 100);
    var paymentInstrument = order.getPaymentInstruments()[0];
    it('Test klarna authorize method', function () {
        global.session.privacy = {};
        global.session.privacy.KlarnaPaymentsAuthorizationToken = '122335938';
        var result = processor.authorize(order, orderNo, paymentInstrument, '');
        assert.equal(true, result.authorized);
    });
    it('Test klarna authorize method for OCAPI', function () {
        paymentInstrument.custom.klarnaPaymentsAuthorizationToken = '113198643';
        var result = processor.authorize(order, orderNo, paymentInstrument, 'OCAPI');
        assert.equal(true, result.authorized);
    });
});
