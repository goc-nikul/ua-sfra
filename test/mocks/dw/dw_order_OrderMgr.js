'use strict';

/* eslint-disable */

var Order = require('./dw_order_Order');
var Status = require('./dw_system_Status');

function getOrder() {
    return new Order();
}

function placeOrder(order) {
    order.status = { value: Order.ORDER_STATUS_NEW };
    return Status.OK;
}

function failOrder(order) {
    order.status = { value: Order.ORDER_STATUS_FAILED };
    return Status.OK;
}

function cancelOrder(order) {
    order.status = { value: Order.ORDER_STATUS_CANCELLED };
    return Status.OK;
}

module.exports = {
    getOrder: getOrder,
    placeOrder: placeOrder,
    failOrder: failOrder,
    cancelOrder: cancelOrder
};
