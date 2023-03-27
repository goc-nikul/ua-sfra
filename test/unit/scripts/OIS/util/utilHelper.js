'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('cartridges/int_OIS/cartridge/scripts/util/utilHelper', () => {
    var utilHelper = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/util/utilHelper', {
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
    });

    it('Testing method: orderStatusModel', () => {
        var orderStatusModel = utilHelper.orderStatusModel();
        var expectedOrderStatusModel = {
            CANCELED: 'testMsg',
            CANCELLED: 'testMsg',
            DELIVERED: 'testMsg', 
            IN_PROGRESS: 'testMsg',
            NEW: 'testMsg',
            PARTIAL_PICKUP: 'testMsg',
            PARTIAL_SHIPPED: 'testMsg',
            PENDING_SHIPMENT: 'testMsg',
            PICKED_UP: 'testMsg',
            PICKUP_READY: 'testMsg',
            RETURNED: 'testMsg',
            RETURNING: 'testMsg',
            SHIPPED: 'testMsg',
            UNFULFILLED: 'testMsg'
        };

        assert.deepEqual(expectedOrderStatusModel, orderStatusModel, 'Order Status Model not matched');
    });

    it('Testing method: fulfillmentStatus', () => {
        var fulfillmentStatus = utilHelper.fulfillmentStatus();
        var expectedFulfillmentStatus = {
            UNFULFILLED: 'testMsg',
            SHIPPMENT: 'testMsg',
            BOPIS: 'testMsg',
            VIRTUAL: 'testMsg',
            CANCELED: 'testMsg',
            BOPIS_CANCELED: 'testMsg',
            RETURNED: 'testMsg',
            PICKUP_READY: 'testMsg',
            PARTIAL_PICKUP: 'testMsg',
            PICKED_UP: 'testMsg',
            INITIAL: 'testMsg',
            SHIPPED: 'testMsg',
            CANCELLED: 'testMsg',
            RETURNING: 'testMsg'
        };

        assert.deepEqual(expectedFulfillmentStatus, fulfillmentStatus, 'Fulfillment Status not matched');
    });

    it('Testing method: orderReturnReasonModel', () => {
        var orderReturnReasonModel = utilHelper.orderReturnReasonModel();
        var expectedOrderReturnReasonModel = {
            SIZE_TOO_BIG: 'testMsg',
            SIZE_TOO_SMALL: 'testMsg',
            DURABILITY_OVER_TIME: 'testMsg',
            QUALITY: 'testMsg',
            FUNCTIONALITY: 'testMsg',
            NOT_AS_PICTURED: 'testMsg',
            DO_NOT_LIKE_OR_CHANGED_MIND: 'testMsg',
            SHIPPING_ISSUE_DAMAGED: 'testMsg',
            SHIPPING_ISSUE_LATE: 'testMsg',
            WRONG_ITEM_SHIPPED: 'testMsg',
            OTHER: 'testMsg'
        };

        assert.deepEqual(expectedOrderReturnReasonModel, orderReturnReasonModel, 'Order Return Reason Model not matched');
    });

    it('Testing method: rmaStatusModel', () => {
        var rmaStatusModel = utilHelper.rmaStatusModel();
        var expectedRmaStatusModel = {
            ABANDONED: 'testMsg',
            INBOUND: 'testMsg',
            NEW: 'testMsg',
            PROCESSED: 'testMsg',
            RECEIVED: 'testMsg'
        };

        assert.deepEqual(expectedRmaStatusModel, rmaStatusModel, 'RMA Status Model not matched');
    });

    it('Testing method: bopisOrderStatus', () => {
        var bopisOrderStatus = utilHelper.bopisOrderStatus();
        var expectedBopisOrderStatus = {
            CANCELED: 'testMsg',
            INITIAL: 'testMsg',
            PICKED_UP: 'testMsg',
            PICKUP_READY: 'testMsg',
            UNFULFILLED: 'testMsg'
        };

        assert.deepEqual(expectedBopisOrderStatus, bopisOrderStatus, 'BOPIS Order Status not matched');
    });
});
