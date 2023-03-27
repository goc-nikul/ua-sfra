'use strict';
/* eslint-disable */

// This file contains unit test scripts for util/SetOrderStatus, util/loggerHelper, util/PriceHelper

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_accertify/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../mocks/';
var pathToLinkMock = '../../link_cartridges/int_accertify/mock/';
const eGiftCard = 'EGIFT_CARD';

describe('int_accertify/cartridge/scripts/util/AccertifyOrderHelper test', () => {
    global.empty = (data) => {
        return !data;
    };
    
    global.XML = require(pathToCoreMock + 'dw/XML');

    var Order = require(pathToCoreMock + 'dw/dw_order_Order');

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
        var order = new Order();
        var lineItem1 = order.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, order.getDefaultShipment());
        var lineItem2 = order.createProductLineItem({
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: eGiftCard
                }
            },
            ID: '883814258849',
            name: 'test'
        }, order.getDefaultShipment());
    
        return order;
    }

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
