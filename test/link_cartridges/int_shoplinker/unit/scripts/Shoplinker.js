'use strict';

/* eslint-disable no-extend-native */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_shoplinker/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';

describe('Shoplinker: Shoplinker test', () => {
    global.empty = (data) => {
        return !data;
    };

    var Shoplinker = proxyquire(pathToLinkScripts + 'Shoplinker', {
        'dw/object/CustomObjectMgr': require(pathToCoreMock + 'dw/dw_object_CustomObjectMgr'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/web/URLUtils': require(pathToCoreMock + 'dw/dw_web_URLUtils')
    });

    var products = ['886450928978', '886450929067', '888376015091'];

    it('Testing method: callG7', () => {
        var result = Shoplinker.callG7('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG2', () => {
        var result = Shoplinker.callG2('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG3', () => {
        var result = Shoplinker.callG3(products);
        assert.equal(true, result);
    });

    it('Testing method: callG4', () => {
        var result = Shoplinker.callG4('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG5', () => {
        var result = Shoplinker.callG5('1234237');
        assert.equal(true, result);
    });

    it('Testing method: callG6', () => {
        var result = Shoplinker.callG6('1234237');
        assert.equal(true, result);
    });
});
