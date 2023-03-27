/**
*
*   Cancel Abandoned Orders
*
*
*/
const Calendar = require('dw/util/Calendar');
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Status = require('dw/system/Status');
const Site = require('dw/system/Site');

function cancelAbandonedOrders(params) {
    const adyenAdditionalDataString = Site.getCurrent().getCustomPreferenceValue('adyenAdditionalData');
    const adyenAdditionalData = JSON.parse(adyenAdditionalDataString || {});
    const cutoffTimeMinutes = adyenAdditionalData.cutoffTimeMinutes || 0;

    const currentSiteTime = new Date();
    let failedOrders = [];
    let queryStart = new Calendar(currentSiteTime);
    queryStart.add(queryStart.MINUTE, '-' + cutoffTimeMinutes);
    let orders;
    try {
        // find CREATED orders older than cutoffTime which need to be failed
        const queryString = 'status = {0} AND custom.expirationDate = null AND creationDate < {1} AND custom.onHold != {2}';
        orders = OrderMgr.searchOrders(queryString, 'orderNo ASC', dw.order.Order.ORDER_STATUS_CREATED, queryStart.getTime().toISOString(), true);
        if (!orders.hasNext()) {
            return new Status(Status.OK);
        }
    } catch (e) {
        Logger.error('CancelAbandonedOrders.js failed. Search Orders error. Error:' + e);
        return new Status(Status.ERROR);
    }

    // Fail orders with matching criteria
    while (orders.hasNext()) {
        let order = orders.next();
        try {
            OrderMgr.failOrder(order,true);
            order.addNote('Order failed', 'Order failed by cancel abandoned orders job.');
        } catch (e) {
            Logger.error('CancelAbandonedOrders.js failed. Cannot fail order. OrderNo' + order.orderNo + '. Error:' + e);
        }
    }

    return new Status(Status.OK);
}

module.exports.execute = cancelAbandonedOrders;
