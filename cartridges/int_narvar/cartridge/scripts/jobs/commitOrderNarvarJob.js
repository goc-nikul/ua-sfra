'use strict';

var Logger = require('dw/system/Logger').getLogger('Narvar');

/**
 * Queries orders and exports them to System
 * @param {Object} params - config attributes(orderProcessLimit) for this job
 * @returns {Object} Returns the status of the job
 */
function exportOrders(params) {
    var Status = require('dw/system/Status');
    var narvarService = require('*/cartridge/scripts/init/NarvarService');
    var narvarHelper = require('*/cartridge/scripts/helpers/narvarHelper');

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
    var orderIterator = OrderMgr.searchOrders(
        'status != {0} AND exportStatus = {1} AND creationDate > {2} AND custom.narvarExportOrder = {3} ',
        'creationDate asc',
        Order.ORDER_STATUS_FAILED,
        Order.EXPORT_STATUS_EXPORTED,
        ordersProcessDayTime,
        null
    );

    Logger.info(
        'Export orders job started. Total Order count {0}, Process Limit set to {1}',
        orderIterator.count,
        orderProcessLimit
    );

    while (orderIterator.hasNext() && count++ < orderProcessLimit) {
        order = orderIterator.next();
        try {
            var exportCallToNarvar = order.custom.exportCallToNarvar ? order.custom.exportCallToNarvar : 0;
            if (exportCallToNarvar < maxCallToNarvar) {
                var narvarOrder = narvarHelper.getRequestObj(order);
                var narvarResponse = narvarService.getNarvarService.call(narvarOrder);

                Transaction.begin();
                if (narvarResponse.status === 'OK') {
                    Logger.info('Order {0} Shipment successfully committed in Narvar system', order.orderNo);
                    order.addNote('Order Status', 'Order successfully committed in Narvar system');
                    order.custom.narvarExportOrder = 'Exported';
                } else {
                    Logger.error('Order "{0}" could not committed to Narvar, errorMessage: {1}, msg: {2}, status: {3}, unavailableReason: {4}', order.orderNo, narvarResponse.errorMessage, narvarResponse.msg, narvarResponse.status, narvarResponse.unavailableReason);
                }

                order.custom.exportCallToNarvar = ++exportCallToNarvar;
                if (exportCallToNarvar >= maxCallToNarvar) {
                    order.addNote('Order Status', 'Order Export call to Narvar reached to maximum attempt. Narvar Order Export call will not be done again for this Order.');
                }
                Transaction.commit();
                successExportCount++;
            } else {
                Logger.error(
                    'Export order job, order {0} is not exported due to Max attempt to Narvar call reached',
                    order.orderNo
                );
            }
        } catch (err) {
            var error = err;
            Logger.error('commitOrderNarvarJob.js - Error while processing Order: {0}, error: {1}, stack: {2}', order.orderNo, error.message, error.stack);
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
    exportOrders: exportOrders
};
