'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var pli = {
    orderNo: 'DEVEU-00020652',
    custom: {
        sku: '1361379-001-XS',
        refundsJson: '[{"emailSent":true,"refundDate":"2022-03-15T12:28:00.025Z","refundAmount":"230.00","refundCurrency":"PLN","refundReason":"","items":{"3023533-001-6":"1"},"itemAmounts":{"3023533-001-6":"230.00"},"returnNumber":"DEVEU-00020652-R1"}]',
        offlineRefund: ''
    }
};

var TransactionCheck = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/jobs/2C2PTransactionCheck.js',{
    'dw/system/HookMgr': require('../../../../mocks/dw/dw_system_HookMgr'),
    'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
    'dw/order/OrderMgr': {
        processOrders(field, value) {
            return field(pli);
        }
    },
    'dw/order/Order': {
        ORDER_STATUS_CREATED: true
    }
});

describe('int_2c2p/cartridge/scripts/jobs/2C2PTransactionCheck.js', function () {
    it('Test Method: ProcessRefunds job with all params', () => {
        var result = TransactionCheck.execute();
        assert.isDefined(result, 'result is defined');
    });
});
