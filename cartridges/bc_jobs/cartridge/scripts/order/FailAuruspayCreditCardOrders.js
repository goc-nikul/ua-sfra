'use strict';

/*
 * Update order level custom attributes related to BOPIS for existing orders.
 */

var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

function failAurusPayCreditCardOrders(params) {
    try {
        // querying orders for Auruspay credit cards if Payment Status is not paid and order is in New or Open state with the startDate and endDate.
        var startDate = params.startDate;
        var aurusCredit = 'AURUS_CREDIT_CARD';
        var queryString = '((status = {0} OR status = {1}) AND creationDate >= {2} AND paymentStatus = {3} AND custom.paymentMethodID = {4})';
        var orders = OrderMgr.queryOrders(queryString, 'orderNo ASC', Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN, startDate, Order.PAYMENT_STATUS_NOTPAID, aurusCredit);
        if (!empty(orders)) {
            while (orders.hasNext()) {
                var order = orders.next();
                Transaction.wrap(function () {
                    order.setStatus(Order.ORDER_STATUS_CANCELLED);
                });
            }
        }
        Logger.info('FailAurusPayCreditCardOrders.js: Number of orders processed from ' + startDate + ' to ' + endDate + 'is ' + orders.count + '.');
    } catch (e) {
        Logger.error('FailAurusPayCreditCardOrders.js: failAurusPayCreditCardOrders() - error while executing this function : {0}', e.message);
    }
}

/* Exported methods */
module.exports = {
    failAurusPayCreditCardOrders: failAurusPayCreditCardOrders
}