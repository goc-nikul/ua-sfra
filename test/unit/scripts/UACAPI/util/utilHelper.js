'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_mao/cartridge/scripts/UACAPI/helpers/util/utilHelper test', () => {
    var utilHelper = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/util/utilHelper', {
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
    });

    it('Testing method: orderStatusModel', () => {
        var orderStatusModel = utilHelper.orderStatusModel();
        var expectedOrderStatusModel = {
            OPEN: 'testMsg',
            IN_PROGRESS: 'testMsg',
            PENDING_SHIPMENT: 'testMsg',
            SHIPPED: 'testMsg',
            DELIVERED: 'testMsg',
            PARTIAL_DELIVERED: 'testMsg',
            CANCELED: 'testMsg',
            RETURNED: 'testMsg',
            PARTIAL_SHIPPED: 'testMsg',
            UNFULFILLED: 'testMsg',
            CANCELLED: 'testMsg',
            PARTIAL_PICKUP: 'testMsg',
            PICKUP_READY: 'testMsg',
            PICKED_UP: 'testMsg',
            RETURNING: 'testMsg',
            PARTIAL_RETURN: 'testMsg',
            PARTIAL_RECEIVED: 'testMsg'
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
                RETURNING: 'testMsg',
                RETURNED: 'testMsg',
                CANCELED: 'testMsg',
                'RETURN RECEIVED': 'testMsg',
                DELIVERED: 'testMsg',
                IN_PROGRESS: 'testMsg',
                PARTIAL_RETURN: 'testMsg',
                PARTIAL_RECEIVED: 'testMsg'
            };

        assert.deepEqual(expectedRmaStatusModel, rmaStatusModel, 'RMA Status Model not matched');
    });

    it('Testing method: bopisOrderStatus', () => {
        var bopisOrderStatus = utilHelper.bopisOrderStatus();
        var expectedBopisOrderStatus = {
                OPEN: 'testMsg',
                INITIAL: 'testMsg',
                UNFULFILLED: 'testMsg',
                PICKUP_READY: 'testMsg',
                PICKED_UP: 'testMsg',
                CANCELED: 'testMsg',
                RETURNED: 'testMsg',
                DELIVERED: 'testMsg',
                PARTIAL_DELIVERED: 'testMsg',
                PARTIAL_RETURN: 'testMsg',
                PARTIAL_RECEIVED: 'testMsg'
        };

        assert.deepEqual(expectedBopisOrderStatus, bopisOrderStatus, 'BOPIS Order Status not matched');
    });

    it('Testing method: orderStatusMapping', () => {
        var orderStatusMapping = utilHelper.orderStatusMapping();
        var expectedOrderStatusMapping = {
            Open: 'OPEN',
            Allocated: 'IN_PROGRESS',
            Released: 'IN_PROGRESS',
            Picked: 'IN_PROGRESS',
            Packed: 'IN_PROGRESS',
            Fulfilled: 'SHIPPED',
            Delivered: 'DELIVERED',
            Returned: 'RETURNED',
            Canceled: 'CANCELED',
            'Pending Return': 'DELIVERED',
            'Back Ordered': 'IN_PROGRESS',
            'In Process': 'IN_PROGRESS',
            'Partially Released': 'IN_PROGRESS',
            'Partially Fulfilled': 'PARTIAL_SHIPPED',
            'Partially Delivered': 'PARTIAL_DELIVERED',
            'Partially Allocated': 'IN_PROGRESS',
            'Partially Back Ordered': 'IN_PROGRESS',
            'Partially Picked': 'IN_PROGRESS',
            'Partially Packed': 'IN_PROGRESS',
            'Partially Returned': 'PARTIAL_RETURN',
            'Partially Pending Return': 'DELIVERED',
            'Partially Received': 'PARTIAL_RECEIVED'
        };

        assert.deepEqual(expectedOrderStatusMapping, orderStatusMapping, 'Order Status Mapping not matched');
    });

    it('Testing method: rmaStatusMapping', () => {
        var rmaStatusMapping = utilHelper.rmaStatusMapping();
        var expectedRmaStatusMapping = {
            Received: 'RETURN RECEIVED',
            Returned: 'RETURNED',
            Canceled: 'CANCELED',
            'Pending Return': 'RETURNING',
            'Pending Approval': 'RETURNING',
            'In Transit - Non ROFS': 'RETURNING',
            'In Transit - ROFS': 'RETURNED',
            'Partially Pending Return': 'DELIVERED',
            'Partially Returned': 'PARTIAL_RETURN',
            'Partially Received': 'PARTIAL_RECEIVED',
            'Back Ordered': 'IN_PROGRESS'
        };

        assert.deepEqual(expectedRmaStatusMapping, rmaStatusMapping, 'RMA Status Mapping not matched');
    });

    it('Testing method: bopisStatusMapping', () => {
        var bopisStatusMapping = utilHelper.bopisStatusMapping();
        var expectedBopisStatusMapping = {
            Open: 'OPEN',
            Allocated: 'UNFULFILLED',
            Released: 'UNFULFILLED',
            Picked: 'PICKUP_READY',
            Fulfilled: 'PICKED_UP',
            Returned: 'RETURNED',
            Canceled: 'CANCELED',
            'Pending Return': 'DELIVERED',
            'Back Ordered': 'UNFULFILLED',
            'In Process': 'UNFULFILLED',
            'Partially Released': 'UNFULFILLED',
            'Partially Fulfilled': 'UNFULFILLED',
            'Partially Allocated': 'UNFULFILLED',
            'Partially Picked': 'UNFULFILLED',
            'Partially Returned': 'PARTIAL_RETURN',
            'Partially Pending Return': 'DELIVERED',
            'Partially Received': 'PARTIAL_RECEIVED'
        };

        assert.deepEqual(expectedBopisStatusMapping, bopisStatusMapping, 'BOPIS Status Mapping not matched');
    });
});
