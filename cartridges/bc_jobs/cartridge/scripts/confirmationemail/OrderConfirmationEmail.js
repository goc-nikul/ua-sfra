'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

function isAdyenOrderNotificationsProcessed(order) {
    var collections = require('*/cartridge/scripts/util/collections');
    var isNotificationsProcessed = true;
    if (order && order.paymentInstruments) {
        var adyenPaymentMethod = collections.find(order.paymentInstruments, (paymentInstrument) => {
            return paymentInstrument.paymentMethod === 'AdyenComponent';
        });
        if (adyenPaymentMethod && (empty(order.custom.Adyen_paymentMethod) || empty(order.custom.Adyen_pspReference)
            || empty(order.custom.Adyen_eventCode) || empty(order.custom.Adyen_value))) {
            isNotificationsProcessed = false;
        }
    }
    return isNotificationsProcessed;
}

function execute() {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    try {
        var ordersIterator = OrderMgr.searchOrders('status != {0} AND status != {1} AND custom.orderConfirmationEmailStatus = {2}', null, Order.ORDER_STATUS_FAILED, Order.ORDER_STATUS_CANCELLED, 'READY_FOR_PROCESSING');
        if (!empty(ordersIterator)) {
            while (ordersIterator.hasNext()) {
                var order = ordersIterator.next();
                // Skip the adyen order if it is not processed by Adyen notification
                if (!isAdyenOrderNotificationsProcessed(order)) {
                    continue;
                }
                try {
                    Transaction.wrap(function () {
                        order.custom.orderConfirmationEmailStatus = "PROCESSED";
                    });
                    COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
                } catch (e) {
                    Logger.error("Error while updating the order custom attribute orderConfirmationEmailStatus while sending confirmation email, orderNo:{0}, stackTrace:{1}, err:" + e, order.orderNo, e.stack);
                }
            }
        }
        return new Status(Status.OK);
    } catch (e) {
        Logger.error("error while sending email though job in OrderConfirmationEmail.js, stackTrace:{0}, err:" + e, e.stack);
        return new Status(Status.ERROR);
    }
}
module.exports.execute = execute;