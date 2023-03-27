'use strict';

var Order = require('dw/order/Order');
var log = require('~/cartridge/scripts/logs/2c2p.js');

/**
 * Process order to cancel
 * @param {Object} order DW order
 */
function orderCancellation(order) {
    try {
        var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
        var returnsUtils = new ReturnsUtils();
        var toJson = returnsUtils.parseJsonSafely(order.custom.refundsJson);
        var paidAmount = (order.custom.PaymentAmount2c2) / 100;
        toJson.forEach((item) => {
            if (item.refundAmount === paidAmount) {
                if (returnsUtils.isFullOrderRefund(order, toJson[0]) && empty(order.custom.shippingJson)) {
                    require('dw/system/Transaction').wrap(() => {
                        order.setOrderStatus(Order.ORDER_STATUS_CANCELLED);
                    });
                }
            }
        });
    } catch (error) {
        log.writelog(log.LOG_TYPE.ERROR, '2C2 Order Cancellation: ' + error);
    }
}

/**
 * Executes cancel job step
 */
function execute() {
    var config = require('~/cartridge/scripts/config/2c2Prefs.js');
    var CheckDate = require('dw/system/Site').calendar;
    CheckDate.add(require('dw/util/Calendar').DAY_OF_YEAR, -(config.refundCancelMaxDays2C2));
    require('dw/order/OrderMgr').processOrders(orderCancellation, 'custom.isFullRefund = {0} AND  status != {1} AND lastModified >= {2} ', true, Order.ORDER_STATUS_CANCELLED, CheckDate.time);
}

exports.execute = execute;
