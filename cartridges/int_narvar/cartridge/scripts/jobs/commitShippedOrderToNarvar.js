'use strict';

var Logger = require('dw/system/Logger').getLogger('Narvar');

/**
 *
 * @param {string} jsonString - JSON string to be parsed
 * @returns {Object} - parsed json object
 */
function parseJsonSafely(jsonString) {
    var jsonObject = null;
    try {
        jsonObject = JSON.parse(jsonString);
    } catch (e) {
        Logger.error('commitShippedOrderToNarvar.js JSON parse error:' + e.message);
    }

    return jsonObject;
}

/**
 * Queries orders and exports them to System
 * @param {Object} params - config attributes(orderProcessLimit) for this job
 * @returns {Object} Returns the status of the job
 */
function exportShippedOrders(params) {
    var Status = require('dw/system/Status');
    var narvarService = require('*/cartridge/scripts/init/NarvarService');
    var narvarShippingHelper = require('*/cartridge/scripts/helpers/narvarShippingHelper');
    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var Site = require('dw/system/Site');
    var Calendar = require('dw/util/Calendar');
    var Transaction = require('dw/system/Transaction');
    var successExportCount = 0;
    var maxCallToNarvar = Site.current.getCustomPreferenceValue('maxCallToNarvar');

    var orderProcessLimit = params.orderProcessLimit || 1000; // limits the number of orders that can be processed in a single job run. By default it can process 1000 orders.
    var count = 0;
    var order;

    var orderPastDaysLimit = params.orderPastDaysLimit || 1; // Limits the number of orders in the past by days
    var ordersProcessStartDate = Site.getCalendar();
    ordersProcessStartDate.add(Calendar.DAY_OF_YEAR, -1 * orderPastDaysLimit);

    var ordersProcessDayTime = ordersProcessStartDate.getTime();
    // Queries orders for which Order Confirmation Status = Confirmed AND Order Status != Failed AND (Export Status = EXPORT FAILED OR EXPORT READY)
    var orderIterator = OrderMgr.searchOrders(
        'status != {0} AND shippingStatus = {1} AND exportStatus = {2} AND creationDate > {3} AND (custom.narvarExportOrder = {4}  OR custom.narvarExportOrder = {5})',
        'creationDate asc',
        Order.ORDER_STATUS_FAILED,
        Order.SHIPPING_STATUS_SHIPPED,
        Order.EXPORT_STATUS_EXPORTED,
        ordersProcessDayTime,
        'Exported',
        'PartiallyShipped'
    );

    Logger.info(
        'Export orders job started. Total Order count {0}, Process Limit set to {1}',
        orderIterator.count,
        orderProcessLimit
    );

    var carrierMapping = Site.getCurrent().getCustomPreferenceValue('narvarCarrierMapping');
    // 'Default Value' is not an option for text area attributes, setting variable to {} if current value is null
    carrierMapping = carrierMapping ? parseJsonSafely(carrierMapping) : {};

    while (orderIterator.hasNext() && count++ < orderProcessLimit) {
        order = orderIterator.next();
        try {
            var shippedCallToNarvar = order.custom.shippedCallToNarvar ? order.custom.shippedCallToNarvar : 0;
            var failedShipmentAttempts = order.custom.failedShipmentAttempts ? order.custom.failedShipmentAttempts : 0;
            if (order.custom.shippingJson && shippedCallToNarvar < maxCallToNarvar && failedShipmentAttempts < maxCallToNarvar) {
                var shippingJson = JSON.parse(order.custom.shippingJson);
                var totalShippedItems = 0;
                for (var j = 0; j < shippingJson.length; j++) {
                    var shipmentItemJSON = shippingJson[j];
                    var itemKeys = Object.keys(shipmentItemJSON.items);
                    for (let k = 0; k < itemKeys.length; k++) {
                        var itemKey = itemKeys[k];
                        totalShippedItems += parseInt(shipmentItemJSON.items[itemKey], 10);
                    }
                }
                var totalOrderedItems = parseInt(order.productQuantityTotal, 10);
                var shippedItemsToNarvar = order.custom.shippedItemsToNarvar ? order.custom.shippedItemsToNarvar : 0;

                if (shippedItemsToNarvar < totalShippedItems) {
                    var result = narvarShippingHelper.getShippedOrderObj(order, carrierMapping);
                    var narvarShippedOrder = result.orderObject;
                    if (!result.success) {
                        Transaction.begin();
                        order.custom.failedShipmentAttempts = ++failedShipmentAttempts;
                        Transaction.commit();
                        Logger.error('Order {0} will not be committed to Narvar, errorMessage: {1}', order.orderNo, result.errorMessage);
                    } else {
                        var narvarResponse = narvarService.getNarvarService.call(narvarShippedOrder);

                        Transaction.begin();
                        if (narvarResponse.status === 'OK') {
                            order.addNote('Order Status', 'Order Shipment successfully committed in Narvar system');
                            Logger.info('Order {0} Shipment successfully committed in Narvar system', order.orderNo);
                            if (totalShippedItems === totalOrderedItems) {
                                order.custom.narvarExportOrder = 'Shipped';
                            } else {
                                order.custom.narvarExportOrder = 'PartiallyShipped';
                            }
                            order.custom.shippedItemsToNarvar = totalShippedItems;
                            order.custom.shippedCallToNarvar = ++shippedCallToNarvar;
                            successExportCount++;
                        } else {
                            order.custom.failedShipmentAttempts = ++failedShipmentAttempts;
                            Logger.error('Order "{0}" could not committed to Narvar, errorMessage: {1}, msg: {2}, status: {3}, unavailableReason: {4}', order.orderNo, narvarResponse.errorMessage, narvarResponse.msg, narvarResponse.status, narvarResponse.unavailableReason);
                        }
                        Transaction.commit();
                    }
                    if (shippedCallToNarvar >= maxCallToNarvar) {
                        Transaction.begin();
                        order.custom.narvarExportOrder = 'Failed';
                        order.addNote('Order Status', 'Order Shipment call to Narvar reached to maximum attempt. This order will not be sent to Narvar again for Order Shipment.');
                        Transaction.commit();
                    }
                    if (failedShipmentAttempts >= maxCallToNarvar) {
                        Transaction.begin();
                        order.custom.narvarExportOrder = 'Failed';
                        order.addNote('Order Status', 'Order Failed Shipment call to Narvar reached to maximum attempt. This order will not be sent to Narvar again for Order Shipment.');
                        Transaction.commit();
                    }
                }
            } else {
                Logger.error(
                    'Export shipped order job, order {0} is not exported due to empty Shipping Json or Max attempt to Narvar call reached',
                    order.orderNo
                );
                Transaction.begin();
                order.custom.narvarExportOrder = 'Failed';
                Transaction.commit();
            }
        } catch (err) {
            Logger.error('Error while processing Order: {0}, error: {1}, stack: {2}', order.orderNo, err.message, err.stack);
        }
    }
    Logger.info(
        'Export order job, processed order count - {0}, successfully exported order count {1}, process limit {2}',
        orderIterator.count,
        successExportCount,
        orderProcessLimit
    );
    return new Status(Status.OK);
}

module.exports = {
    exportShippedOrders: exportShippedOrders
};
