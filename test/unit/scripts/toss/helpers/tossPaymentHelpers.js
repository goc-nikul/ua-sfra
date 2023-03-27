'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var Order = require('../../../../mocks/dw/dw_order_Order');

describe('int_custom_tosspayments/cartridge/scripts/helpers/tossPaymentHelpers.js', () => {
    var order;
    var helperToss = proxyquire('../../../../../cartridges/int_custom_tosspayments/cartridge/scripts/helpers/tossPaymentHelpers.js', {
        'dw/order/Order': Order,
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/service/tossPaymentService': require('../../../../mocks/toss/tossPaymentService')
    });

    var result;
    order = new Order();
    it('Testing method: confirmOrder', () => {
        result = helperToss.confirmOrder(order);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: updateOrderJSON with empty tossPaymentsTransaction customAttribute', () => {
        var jsonToUpdate = { test: 'test' };
        result = helperToss.updateOrderJSON(order, jsonToUpdate);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: updateOrderJSON', () => {
        var jsonToUpdate = { test: 'test' };
        order.custom = {
            tossPaymentsTransaction: '[{"testt":"testtt1"}]'
        };
        result = helperToss.updateOrderJSON(order, jsonToUpdate);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: saveTransactionID', () => {
        order.getPaymentInstruments = function (paymentMathod) {
            return [{
                paymentMethod: paymentMathod,
                paymentTransaction: {
                    transactionID: ''
                }
            }];
        };
        var paymentKey = 'test1234';
        result = helperToss.saveTransactionID(order, paymentKey);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: saveTransactionID with empty paymentInstrument', () => {
        order.getPaymentInstruments = function (paymentMathod) {
            return [];
        };
        var paymentKey = 'test1234';
        try {
            result = helperToss.saveTransactionID(order, paymentKey);
        } catch (e) {
            assert.equal('TossPayment: No payment instrument in Order', e.message);
        }
    });

    it('Testing method: updateRefundAmount', () => {
        order.paymentInstruments =
        [{
            paymentMethod: 'TOSS_PAYMENTS_CARD',
            paymentTransaction: {
                custom: {
                    remainAmount: '',
                    refundAmount: ''
                },
                transactionID: ''
            }
        }];
        var cancelPrice = 50000;
        result = helperToss.updateRefundAmount(order, cancelPrice);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: cancelPayment', () => {
        order.custom = {
            tossPaymentsKey: 'test12345'
        };
        var cancelPrice = 5000;
        var refundableAmount = 5000;
        var reason = 'test';
        result = helperToss.cancelPayment(order, cancelPrice, refundableAmount, reason);
        assert.isDefined(result);
    });
});
