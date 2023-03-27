'use strict';

/* eslint-disable no-extend-native */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_accertify/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../../../mocks/';

describe('Accertify: util/AccertifyNotifyMgr test', () => {
    global.empty = (data) => {
        return !data;
    };

    var AccertifyNotifyMgr = proxyquire(pathToLinkScripts + 'util/AccertifyNotifyMgr', {
        'dw/object/CustomObjectMgr': require(pathToCoreMock + 'dw/dw_object_CustomObjectMgr'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction')
    });

    it('Testing method: createAccertifyProcessRequest', () => {
        var result = AccertifyNotifyMgr.saveNotifyCO('test', 'test');
        assert.equal(true, result);
    });

    it('Testing method: getNotifyCO', () => {
        var result = AccertifyNotifyMgr.getNotifyCO('test', 'test');
        assert.deepEqual(result, {
            id: 'test',
            custom: {
                orderNo: 'test',
                notifyData: '[{"test": "test"}]',
                isProcessed: false
            }
        });
    });

    it('Testing method: getAllNotifyCO', () => {
        var result = AccertifyNotifyMgr.getAllNotifyCO();
        var item = result.next();
        assert.deepEqual(item, {
            id: 'test',
            custom: {
                orderNo: 'test',
                notifyData: '[{"test": "test"}]',
                isProcessed: false
            }
        });
    });

    it('Testing method: deleteNotifyCO', () => {
        var result = AccertifyNotifyMgr.deleteNotifyCO();
        // Function returns nothing, so we can not compare its results
        assert.equal(result, undefined);
    });

    it('Testing method: updateNotifyStatus', () => {
        var result = AccertifyNotifyMgr.updateNotifyStatus();
        // Function returns nothing, so we can not compare its results
        assert.equal(result, undefined);
    });
});
