/* eslint-disable  spellcheck/spell-checker */
/* eslint-disable  prefer-const */
/*
 * API Includes
 */
const Logger = require('dw/system/Logger').getLogger('MaoOrderExport', 'MaoOrderExport');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const Status = require('dw/system/Status');
const StringUtils = require('dw/util/StringUtils');
const Transaction = require('dw/system/Transaction');
const OrderExportUtils = require('~/cartridge/scripts/OrderExportUtils');
const MaoService = require('~/cartridge/scripts/services/MaoService');
const MAOPreferences = require('~/cartridge/scripts/MaoPreferences');
const MAOProcessed = 'MAOProcessed';
/**
 * Performs order search and returns orders for which updates custom attribute is not null.
 *
 * @return {Iterator} Found orders
 */
function getOrders() {
    let maxAllowedFailedCount = MAOPreferences.maoMaxFailedCount || 3;
    let queryString = 'status != {0} AND custom.updates != NULL AND custom.updates != {1} AND (custom.maoStatusUpdateFailedCount = NULL OR custom.maoStatusUpdateFailedCount < {2})';
    let queryParams = [
        Order.ORDER_STATUS_CREATED,
        "'" + MAOProcessed + "'",
        maxAllowedFailedCount
    ];
    let formattedQueryString = StringUtils.format(queryString, queryParams);
    /*
    Using “queryOrders” instead of “searchOrders” here because we are not getting orders updated in previous flow in the same job run.
    Scenario - We added a new sequential flow - “MaoSendStatusUpdate” in the “Process on hold orders” job to send order updates to MAO.
    But we are not getting updated orders in “MaoSendStatusUpdate” flow using “OrderMgr.searchOrders(formattedQueryString, null)” API.
    Please find the job flow below :
      1. TokenExchange  - Paymetric job to process orders having internal tokens.
      2. Process Accertify custom objects – At this step “updates” order custom attribute is updated based on custom object data for particular order.
      3. MaoSendStatusUpdate – Here we extract the orders, updated at the second step by “updates” order custom attribute value. But not getting expected
         results in the same job run. If we are running the job again we are getting the orders updated in the first job run.
    Workaround - Updated the code to use "queryOrders" instead of "searchOrders" API to get the orders.
    */
    return OrderMgr.queryOrders(formattedQueryString, null);
}
/**
 * Main function of the script to start order export process.
 * @param {void} void - No params required.
 * @return {boolean} true if all required site Preferences are set, else false
 */
function validateRequiredSitePreferences() {
    if (empty(MAOPreferences.MaoDomTokenChildOrgUsername) || empty(MAOPreferences.MaoDomTokenChildOrgPassword) || empty(MAOPreferences.MaoDomSaveOrderEndpointUrl)) {
        return false;
    }
    return true;
}

/**
 * Update orders in MAO
 * @param {dw.Order.order} order object
 * @param {string} accessToken to make save order call
 * @return {boolean} returns true if order data updated successfully in MAO, else false
 */
function updateOrderDataInMao(order, accessToken) {
    let orderStatus = order.status.value;
    let orderJSON;
    if (orderStatus === Order.ORDER_STATUS_FAILED) {
        // Cancel request to MAO if order status is failed
        orderJSON = OrderExportUtils.getOrderCancelRequestJSON(order);
    } else if ((orderStatus === Order.ORDER_STATUS_NEW || orderStatus === Order.ORDER_STATUS_OPEN) && !empty(order.custom.updates) && order.custom.updates.indexOf('paymentDetailsUpdate') !== -1) {
        // Updated payment details request if order status is placed and "Updates" custom attribute contains "paymentDetails"
        orderJSON = OrderExportUtils.getUpdatePaymentRequestJSON(order);
    } else if ((orderStatus === Order.ORDER_STATUS_NEW || orderStatus === Order.ORDER_STATUS_OPEN) && !empty(order.custom.updates) && order.custom.updates.indexOf('fraudCheck') !== -1 && !order.custom.onHold) {
        // confirm order request if order status is placed and "Updates" custom attribute contains "fraudCheck" and "onHold" custom attribute is not "TRUE"
        orderJSON = OrderExportUtils.getConfirmOrderRequestJSON(order);
    }
    let updateOrderStatus;
    if (!empty(orderJSON) && !orderJSON.error && !empty(accessToken)) {
        Logger.debug('Update order request JSON :: {0}', orderJSON);
        let saveOrderService = MaoService.saveOrderService();
        let saveOrderRequest = {
            orderData: orderJSON,
            accessToken: accessToken
        };
        let response = saveOrderService.call(saveOrderRequest);
        if (response && response.status === 'OK' && response.object && response.object.statusCode === 200) {
            // Remove "paymentDetails" and "fraudCheck" from "Updates" order custom attribute.
            Transaction.wrap(function () {
                order.custom.updates = [MAOProcessed]; // eslint-disable-line no-param-reassign
                if (!order.custom.onHold) {
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                }
            });
            updateOrderStatus = true;
        } else {
            Logger.error('Error in mao update order service call :: errorMessage {0} :: error {1}', response.errorMessage, response.error);
            updateOrderStatus = false;
        }
    }
    return updateOrderStatus;
}
/**
 * Handle failed orders
 * @param {dw.Order.order} order object
 * @return {boolean} isMaxFailedCountLimitReached - returns true if order has reached to max failed count limit, else false
 */
function handleFailedOrders(order) {
    let orderObject = order;
    let isMaxFailedCountLimitReached = false;
    try {
        let failedCount = (!empty(orderObject.custom.maoStatusUpdateFailedCount) ? orderObject.custom.maoStatusUpdateFailedCount : 0) + 1;
        let maxAllowedFailedCount = MAOPreferences.maoMaxFailedCount || 3;
        Transaction.wrap(function () {
            // update failed count
            orderObject.custom.maoStatusUpdateFailedCount = failedCount;
            if (failedCount >= maxAllowedFailedCount) {
                isMaxFailedCountLimitReached = true;
            }
        });
    } catch (e) {
        Logger.error('Error in MaoSendStatusUpdate.js -> handleFailedOrders ::error {1}', e.message);
    }
    return isMaxFailedCountLimitReached;
}
/**
 * Main function of the script to start order export process.
 * @return {dw.system.Status} Return "OK" if orders exported successfully, else "ERROR"
 */
module.exports.execute = function () {
    const MAOAuthTokenHelper = require('~/cartridge/scripts/MAOAuthTokenHelper');
    var failedOrderUpdate = [];
    let orders;
    try {
        orders = getOrders();
        if (!orders.count) {
            return new Status(Status.OK);
        }
        if (!validateRequiredSitePreferences()) {
            orders.close(); // Close order - SeekableIterator as all elements of this iterator has not been retrieved.
            return new Status(Status.ERROR);
        }
        /* Get the existing access token if not expired else make a service call to get new
         * token and save it in a custom object. This logic has been implemented in
         * MAOAuthTokenHelper.js of getValidToken() function.
         */
        var tokenHelper = new MAOAuthTokenHelper();
        var accessToken = tokenHelper.getValidToken().accessToken;

        if (accessToken) {
            while (orders.hasNext()) {
                let order = orders.next();
                try {
                    let updateOrderData = updateOrderDataInMao(order, accessToken);
                    if (!updateOrderData) {
                        Logger.error('Error while updating order in MAO {0}', order.orderNo);
                        let isMaxFailedCountLimitReached = handleFailedOrders(order);
                        if (isMaxFailedCountLimitReached) {
                            failedOrderUpdate.push(order.orderNo);
                        }
                    } else {
                        Logger.debug('Order {0} data updated successfully.', order.orderNo);
                    }
                } catch (e) {
                    failedOrderUpdate.push(order.orderNo);
                    Logger.error('Error while updating order {0} :: error {1}', order.orderNo, e.message);
                }
            }
        } else {
            Logger.error('Access Token unavailable');
            orders.close(); // Close order - SeekableIterator as all elements of this iterator has not been retrieved.
            return new Status(Status.ERROR);
        }
    } catch (e) {
        Logger.error('Error in MaoSendStatusUpdate.js :: {0}', e.message);
        if (orders && orders instanceof dw.util.SeekableIterator) {
            orders.close(); // Close order - SeekableIterator as all elements of this iterator has not been retrieved.
        }
        return new Status(Status.ERROR);
    }
    if (failedOrderUpdate.length > 0) {
        Logger.error('Error while sending order update request to MAO {0}', JSON.stringify(failedOrderUpdate));
        return new Status(Status.ERROR, 'OrderSendStatusUpdateFailed', 'Error while sending order update request to MAO for order(s) :: {0}', JSON.stringify(failedOrderUpdate));
    }
    return new Status(Status.OK);
};
