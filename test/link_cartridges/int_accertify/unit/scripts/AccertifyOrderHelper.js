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

describe('Accertify: util/AccertifyOrderHelper test', () => {
    global.empty = (data) => {
        return !data;
    };

    global.XML = require(pathToCoreMock + 'dw/XML');

    var Order = require(pathToCoreMock + 'dw/dw_order_Order');
    var order = new Order();
    var eGiftCardOrder = new Order();

    var AccertifyOrderHelper = proxyquire(pathToLinkScripts + 'util/AccertifyOrderHelper', {
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource'),
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/system/Transaction': require(pathToCoreMock + 'dw/dw_system_Transaction'),
        'dw/system/Site': require(pathToCoreMock + 'dw/dw_system_Site'),
        'int_accertify/cartridge/scripts/util/AccertifyNotifyMgr': require(pathToLinkMock + 'scripts/AccertifyNotifyMgr'),
        'app_ua_core/cartridge/scripts/checkout/checkoutHelpers': require(pathToCoreMock + 'scripts/checkout/checkoutHelpers'),
        '*/cartridge/scripts/giftcard/giftcardHelper': require(pathToCoreMock + 'scripts/giftcard/giftcardHelper').giftCardHelper
    });

    function getEgiftCardOrder() {
        var egcOrder = new Order();
        var lineItem1 = egcOrder.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, egcOrder.getDefaultShipment());
        var lineItem2 = egcOrder.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, egcOrder.getDefaultShipment());
    
        return egcOrder;
    }

    it('Testing method: addNotificationData', () => {
        var co = {
            test: true
        };
        new AccertifyOrderHelper().addNotificationData(order, co);
        // console.log(order);
        assert.equal(true, order.custom.test);
    });

    it('Testing method: addNotificationData', () => {
        var co = {
            test: true
        };
        new AccertifyOrderHelper().addNotificationData(order, co);
        // console.log(order);
        assert.equal(true, order.custom.test);
    });

    it('Testing method: addCONotificationData', () => {
        var co = {
            accertifyActionType: 'test'
        };
        var result = new AccertifyOrderHelper().addCONotificationData(order, co);
        assert.equal(true, result);
        assert.equal('test', order.custom.accertifyRecCode);
    });

    it('Testing method: parseAccertifyNotification', () => {
        var result = new AccertifyOrderHelper().parseAccertifyNotification('<test></test>');
        assert.deepEqual(result, {
            accertifyTransactionID: 'transaction-id',
            accertifyRules: 'rules-tripped',
            accertifyScore: 'total-score',
            accertifyRecCode: 'recommendation-code',
            remarks: 'remarks',
            accertifyActionType: 'action-type'
        });
    });

    it('Testing method: createCustomObject', () => {
        var data = {
            accertifyTransactionID: 'test'
        };
        var result = new AccertifyOrderHelper().createCustomObject(data);
        // Function returns nothing, so we can not compare its results
        assert.equal(result, undefined);
    });

    it('Testing method: changeOrderStatus', () => {
        var result = new AccertifyOrderHelper().changeOrderStatus(order);
        // Function returns nothing, so we can not compare its results
        assert.equal(result, undefined);
    });


    it('Should process an unprocessed e-gift card order', () => {
        var order = new getEgiftCardOrder();
        var co = {
            accertifyActionType: 'accept',
            accertifyRecCode: 'accept'
        };
        var aoh = new AccertifyOrderHelper();
        var result = aoh.addCONotificationData(order, co);
        aoh.changeOrderStatus(order);
        // Function returns nothing, so we can not compare its results
        assert.isTrue(result);
        assert.equal(order.custom.eGiftCardStatus, 'READY_FOR_PROCESSING');
    });
    
    it('Should not reprocess an already processed e-gift card order', () => {
        var eGiftCardOrder = new getEgiftCardOrder();
        eGiftCardOrder.setEGiftCardStatus('PROCESSED');
        var co = {
            accertifyActionType: 'accept',
            accertifyRecCode: 'accept'
        };
        var aoh = new AccertifyOrderHelper();
        var result = aoh.addCONotificationData(eGiftCardOrder, co);
        aoh.changeOrderStatus(eGiftCardOrder);
        // Function returns nothing, so we can not compare its results
        assert.isTrue(result);
        assert.equal(eGiftCardOrder.custom.eGiftCardStatus, 'PROCESSED');
    });
});
