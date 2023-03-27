'use strict';

/**
 * Order status class that represents the current order
 * @return {Object} Return orders status model
 */
function orderStatusModel() {
    var Resource = require('dw/web/Resource');
    return {
        NEW: Resource.msg('order.status.new', 'account', null),
        IN_PROGRESS: Resource.msg('order.status.inprogress', 'account', null),
        PENDING_SHIPMENT: Resource.msg('order.status.pending.shipment', 'account', null),
        SHIPPED: Resource.msg('order.status.shipped', 'account', null),
        DELIVERED: Resource.msg('order.status.delivered', 'account', null),
        CANCELED: Resource.msg('order.status.cancelled', 'account', null),
        RETURNED: Resource.msg('order.status.returned', 'account', null),
        PARTIAL_SHIPPED: Resource.msg('order.status.partial.shipped', 'account', null),
        UNFULFILLED: Resource.msg('order.status.inprogress', 'account', null),
        CANCELLED: Resource.msg('order.status.cancelled', 'account', null),
        PARTIAL_PICKUP: Resource.msg('order.status.partially.picked.up', 'account', null),
        PICKUP_READY: Resource.msg('order.status.ready.for.pickup', 'account', null),
        PICKED_UP: Resource.msg('order.status.picked.up', 'account', null),
        RETURNING: Resource.msg('order.status.returning', 'account', null)
    };
}

/**
 * FulfillmentStatus status class that represents the current order
 * @return {Object} Return fulfillmentStatus status model
 */
function fulfillmentStatus() {
    var Resource = require('dw/web/Resource');
    return {
        UNFULFILLED: Resource.msg('order.status.unfulfilled', 'account', null),
        SHIPPMENT: Resource.msg('order.status.shipment', 'account', null),
        BOPIS: Resource.msg('order.status.bopis', 'account', null), // eslint-disable-line spellcheck/spell-checker
        VIRTUAL: Resource.msg('order.status.virtual', 'account', null),
        CANCELED: Resource.msg('order.status.cancelled', 'account', null),
        BOPIS_CANCELED: Resource.msg('order.status.bopis.canceled', 'account', null), // eslint-disable-line spellcheck/spell-checker
        RETURNED: Resource.msg('order.status.returned', 'account', null),
        PICKUP_READY: Resource.msg('order.status.ready.for.pickup', 'account', null),
        PARTIAL_PICKUP: Resource.msg('order.status.partially.picked.up', 'account', null),
        PICKED_UP: Resource.msg('order.status.picked.up', 'account', null),
        INITIAL: Resource.msg('order.status.initial', 'account', null),
        SHIPPED: Resource.msg('order.status.shipped', 'account', null),
        CANCELLED: Resource.msg('order.status.cancelled', 'account', null),
        RETURNING: Resource.msg('order.status.returning', 'account', null)
    };
}

/**
 * Order Return Reason that represents the current order
 * @return {Object} Return orders Reason model
 */
function orderReturnReasonModel() {
    var Resource = require('dw/web/Resource');
    return {
        SIZE_TOO_BIG: Resource.msg('option.return.reason.toobig', 'account', null),
        SIZE_TOO_SMALL: Resource.msg('option.return.reason.toosmall', 'account', null),
        DURABILITY_OVER_TIME: Resource.msg('option.return.reason.durability', 'account', null),
        QUALITY: Resource.msg('option.return.reason.quality', 'account', null),
        FUNCTIONALITY: Resource.msg('option.return.reason.functionality', 'account', null),
        NOT_AS_PICTURED: Resource.msg('option.return.reason.notaspictured', 'account', null),
        DO_NOT_LIKE_OR_CHANGED_MIND: Resource.msg('option.return.reason.donotlike', 'account', null),
        SHIPPING_ISSUE_DAMAGED: Resource.msg('option.return.reason.shippingissue', 'account', null),
        SHIPPING_ISSUE_LATE: Resource.msg('option.return.reason.shippingissuelate', 'account', null),
        WRONG_ITEM_SHIPPED: Resource.msg('option.return.reason.wrongitemshipped', 'account', null),
        OTHER: Resource.msg('option.return.reason.other', 'account', null)
    };
}

/**
 * RMA status class that represents the current order
 * @return {Object} Return orders status model
 */
function rmaStatusModel() {
    var Resource = require('dw/web/Resource');
    return {
        NEW: Resource.msg('order.status.new', 'account', null),
        ABANDONED: Resource.msg('order.status.abandoned', 'account', null),
        INBOUND: Resource.msg('order.status.inbound', 'account', null),
        RECEIVED: Resource.msg('order.status.received', 'account', null),
        PROCESSED: Resource.msg('order.status.processed', 'account', null)
    };
}

/**
 * BOPIS order status that represents the current order
 * @return {Object} Return BOPIS order status model
 */
function bopisOrderStatus() {
    var Resource = require('dw/web/Resource');
    return {
        INITIAL: Resource.msg('label.orderdetail.placed', 'account', null),
        UNFULFILLED: Resource.msg('order.status.bopis.prepare.order', 'account', null),
        PICKUP_READY: Resource.msg('order.status.ready.for.pickup', 'account', null),
        PICKED_UP: Resource.msg('order.status.picked.up', 'account', null),
        CANCELED: Resource.msg('label.cancelled', 'account', null)
    };
}
module.exports = {
    orderStatusModel: orderStatusModel,
    fulfillmentStatus: fulfillmentStatus,
    rmaStatusModel: rmaStatusModel,
    orderReturnReasonModel: orderReturnReasonModel,
    bopisOrderStatus: bopisOrderStatus
};
