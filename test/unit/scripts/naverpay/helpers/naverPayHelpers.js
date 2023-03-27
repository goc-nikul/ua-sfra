'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var Order = require('../../../../mocks/dw/dw_order_Order');

describe('int_naverpay/cartridge/scripts/helpers/naverPayHelpers.js', () => {
    var order;
    var helperNaverPay = proxyquire('../../../../../cartridges/int_naverpay/cartridge/scripts/helpers/naverPayHelpers.js', {
        'dw/order/Order': Order,
        'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/util/UUIDUtils': require('../../../../mocks/dw/dw_util_UUIDUtils'),
        '*/cartridge/scripts/service/naverPayService': require('../../../../mocks/naverpay/naverPayService')
    });

    var result;
    order = new Order();
    order.getPaymentInstruments = function () {
        return [{
            paymentMethod: 'NAVERPAY',
            paymentTransaction: {
                custom: {
                    remainAmount: '',
                    refundAmount: ''
                },
                transactionID: '12345'
            }
        }];
    };
    it('Testing method: getPaymentApprovalUrl', () => {
        result = helperNaverPay.getPaymentApprovalUrl();
        assert.isDefined(result, 'result is defined');
        assert.equal(result, 'testMsg/NaverPayMerchantID/naverpay/payments/v2.2/apply/payment');
    });

    it('Testing method: updateOrderJSON', () => {
        var jsonToUpdate = { test: 'test' };
        order.custom = {
            returnResult: '[{"testt":"testtt1"}]'
        };
        result = helperNaverPay.updateOrderJSON(order, jsonToUpdate);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: updateRefundAmount', () => {
        var cancelPrice = 50000;
        result = helperNaverPay.updateRefundAmount(order, cancelPrice);
        assert.isUndefined(result, 'result is defined');
    });

    it('Testing method: cancelPayment', () => {
        order.custom = {
            tossPaymentsKey: 'test12345'
        };
        var cancelPrice = 5000;
        var refundableAmount = 5000;
        var reason = 'test';
        result = helperNaverPay.cancelPayment(order, cancelPrice, refundableAmount, reason);
        assert.isDefined(result);
    });
});
