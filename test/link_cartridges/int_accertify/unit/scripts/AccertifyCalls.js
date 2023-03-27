'use strict';

/* eslint-disable no-extend-native */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_accertify/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';
var pathToLinkMock = '../../mock/';

describe('Accertify: hooks/AccertifyCalls test', () => {
    global.empty = (data) => {
        return !data;
    };

    global.session = {
        custom: {}
    };

    global.customer = {};

    var AccertifyCalls = proxyquire(pathToLinkScripts + 'hooks/AccertifyCalls', {
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'int_accertify/cartridge/scripts/util/AccertifyOrderHelper': require(pathToLinkMock + 'scripts/AccertifyOrderHelper'),
        'int_accertify/cartridge/scripts/init/AccertifyService': require(pathToLinkMock + 'scripts/AccertifyService'),
        'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': require(pathToCoreMock + 'scripts/checkout/checkoutHelpers')
    });

    it('Testing method: accertifyCall', () => {
        var Order = require(pathToCoreMock + 'dw/dw_order_Order');
        var order = new Order();
        var result = AccertifyCalls.accertifyCall(order);
        assert.equal(200, result.statusCode);
        assert.equal('Success', result.statusMessage);
    });

    it('Testing method: getNotification', () => {
        var Order = require(pathToCoreMock + 'dw/dw_order_Order');
        var order = new Order();
        var result = AccertifyCalls.getNotification(order);
        assert.equal('test', order.custom.accertifyRecCode);
        assert.equal('accertify.accertifyRecCode.test', result);
    });
});
