'use strict';

/**
 * Process Pending Fraud Orders
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.accertify');

/**
 * Get hold Orders with accertifyRecCode 'Error' (We got 'Error' status if Accertify service unavailable)
 * @returns {Iterator} orders
 */
function getOrders() {
    var orders;
    try {
        orders = OrderMgr.queryOrders('custom.accertifyRecCode != NULL AND custom.accertifyRecCode = {0} AND status != {1}', 'creationDate DESC', 'Error', Order.ORDER_STATUS_FAILED);
    } catch (e) {
        Log.error('PendingFraudOrders.js failed. Query Orders error. Error: {0}', e);
        return null;
    }

    return orders;
}

/**
 * Update orders based on Accertify Fraud Service data
 */
function pendingFraudOrders() {
    var orders = getOrders();
    if (orders && orders.count > 0) {
        var AccertifyServices = require('int_accertify/cartridge/scripts/hooks/AccertifyCalls');
        var AccertifyOrderHelper = require('int_accertify/cartridge/scripts/util/AccertifyOrderHelper');
        var accertifyOrderHelper = new AccertifyOrderHelper();

        while (orders.hasNext()) {
            var order = orders.next();
            try {
                var fraudNotification = AccertifyServices.accertifyCall(order);
                if (fraudNotification && fraudNotification !== 'SERVER_UNAVAILABLE') {
                    var keys = Object.keys(fraudNotification);
                    if (keys.length) {
                        accertifyOrderHelper.addNotificationData(order, fraudNotification);
                        accertifyOrderHelper.changeOrderStatus(order);
                    }
                }
            } catch (e) {
                Log.error('PendingFraudOrders.js failed. Process Orders error. Error: {0}', e);
            }
        }
    }
}

module.exports.execute = pendingFraudOrders;
