/**
*
*   Cancel unpaid PayU order on 6th day after creating
*
*
*/

const OrderMgr = require('dw/order/OrderMgr');
const Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const Site = require('dw/system/Site');
const Order = require('dw/order/Order');

function getCashOrders() {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    const failedOrders = getFailedOrders();

    for (var index = 0; index < failedOrders.length; index++) {
        var order = failedOrders[index];
        if (!empty(order) && !empty(order.customerEmail)) {
            order.cancelDescription = 'failedPayment';
            COHelpers.sendFraudNotificationEmail(order, 'failedPayment');
        }
    }
    return new Status(Status.OK);
}

function getFailedOrders() {
    const currentSiteTime = new Date();
    let failedOrders = [];
    let orders;
    try {
        // find CREATED orders with expired custom.experationDate
        const queryString = "(status = {0} OR status = {1} OR status = {2}) AND custom.expirationDate < {3}";
        orders = OrderMgr.searchOrders(queryString, "orderNo ASC", Order.ORDER_STATUS_CREATED, Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN, currentSiteTime);
        if (!orders.hasNext()) {
            Logger.info("CancelUnpaidOrders.js: Orders have not been found for these requirements.");
            return failedOrders;
        }
    } catch (e) {
        Logger.error("CancelUnpaidOrders.js failed. Search Orders error. Error:" + e);
        return failedOrders;
    }

    // Get payment methods for orders failing
    const cashPaymentMethodsString = Site.getCurrent().getCustomPreferenceValue('cashPaymentMethods');
    if (empty(cashPaymentMethodsString)) {
        Logger.error("CancelUnpaidOrders.js failed. Cannot find payment methods for orders failing.");
        return failedOrders;
    }
    const cashPaymentMethods = cashPaymentMethodsString.split(',');

    // Fail orders with defined payment methods
    while (orders.hasNext()) {
        let order = orders.next();
        try {
            if ('Adyen_paymentMethod' in order.custom && !empty(order.custom.Adyen_paymentMethod) && cashPaymentMethods.indexOf(order.custom.Adyen_paymentMethod) >= 0 && order.paymentStatus.value === Order.PAYMENT_STATUS_NOTPAID) {
                if (order.status.value === Order.ORDER_STATUS_CREATED) {
                    OrderMgr.failOrder(order);
                    order.addNote('Order failed', 'Order failed by cancel unpaid orders job.');
                } else {
                    OrderMgr.cancelOrder(order);
                    order.addNote('Order cancelled', 'Order cancelled by cancel unpaid orders job.');
                }
                failedOrders.push(order);
            }
        } catch (e) {
            Logger.error("CancelUnpaidOrders.js failed. Cannot fail order. OrderNo" + order.orderNo + ". Error:" + e);
        }
    }

    return failedOrders;
}

module.exports.execute = getCashOrders;