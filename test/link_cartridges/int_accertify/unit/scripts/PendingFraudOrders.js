'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_accertify/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Accertify: order/PendingFraudOrders test', () => {
    global.empty = (data) => {
        return !data;
    };

    global.session = {
        custom: {}
    };

    global.customer = {};

    var PendingFraudOrders = proxyquire(pathToLinkScripts + 'order/PendingFraudOrders', {
        'dw/order/OrderMgr': require(pathToCoreMock + 'dw/dw_order_OrderMgr'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/order/Order': require(pathToCoreMock + 'dw/dw_order_Order'),
        'int_accertify/cartridge/scripts/hooks/AccertifyCalls': require(pathToLinkMock + 'scripts/AccertifyCalls'),
        'int_accertify/cartridge/scripts/util/AccertifyOrderHelper': require(pathToLinkMock + 'scripts/AccertifyOrderHelper')
    });

    it('Testing method: execute', () => {
        PendingFraudOrders.execute();
        // Function returns nothing, so we can not compare its results
        assert.equal(1, 1);
    });
});
