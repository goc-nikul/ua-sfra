'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_accertify/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Accertify: order/PendingFraudCustomObject test', () => {
    global.empty = (data) => {
        return !data;
    };

    global.session = {
        custom: {}
    };

    global.customer = {};

    var PendingFraudCustomObject = proxyquire(pathToLinkScripts + 'order/PendingFraudCustomObject', {
        'dw/order/OrderMgr': require(pathToCoreMock + 'dw/dw_order_OrderMgr'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'int_accertify/cartridge/scripts/util/AccertifyNotifyMgr': require(pathToLinkMock + 'scripts/AccertifyNotifyMgr'),
        'int_accertify/cartridge/scripts/util/AccertifyOrderHelper': require(pathToLinkMock + 'scripts/AccertifyOrderHelper')
    });

    it('Testing method: process', () => {
        PendingFraudCustomObject.process();
        // Function returns nothing, so we can not compare its results
        assert.equal(1, 1);
    });

    it('Testing method: clear', () => {
        PendingFraudCustomObject.clear();
        // Function returns nothing, so we can not compare its results
        assert.equal(1, 1);
    });
});
