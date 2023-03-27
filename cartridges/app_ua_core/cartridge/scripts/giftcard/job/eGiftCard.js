'use strict';

/* API Includes */

var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');

const giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * To deliver eGift Cards to respective recipients based on delivery dates through job
 *
 */
function process() {
    var queryString = 'custom.eGiftCardStatus = {0} AND (status = {1} OR status = {2})';
    var orders = OrderMgr.queryOrders(queryString, 'orderNo ASC', 'READY_FOR_PROCESSING', Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN);

    while (orders.hasNext()) {
        var order = orders.next();
        try {
            // Generate giftcard numbers from first_data if the order has any e-gift cards
            // eslint-disable-next-line no-loop-func
            Transaction.wrap(function () {
                var eGiftCardLineItems = giftCardHelper.getEGiftCardLineItems(order);
                var giftCardsResult;
                if (eGiftCardLineItems.length > 0) {
                    giftCardsResult = COHelpers.generateGiftCardNumbers(order, eGiftCardLineItems);
                    if (giftCardsResult && !giftCardsResult.error && giftCardsResult.eGiftCardsDetails) {
                        // Sending gift cards email if the order contains any eGiftCard items.
                        COHelpers.sendEGiftCardsEmail(order, giftCardsResult.eGiftCardsDetails);
                        // set custom attribute confirming eGiftCard successfully processed for the particular order.
                        order.custom.eGiftCardStatus = 'PROCESSED';
                    }
                }
            });
        } catch (e) {
            Logger.error('Error occurred while running eGift Card Process Job for Order {0}: ' + e.message, order.orderNo);
        }
    }
}

module.exports.Process = process;
