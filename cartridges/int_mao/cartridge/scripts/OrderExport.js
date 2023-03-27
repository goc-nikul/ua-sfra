'use strict';
/* eslint-disable  spellcheck/spell-checker */
/* eslint-disable  prefer-const */
/*
 * API Includes
 */
const Logger = require('dw/system/Logger').getLogger('MaoOrderExport', 'MaoOrderExport');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const StringUtils = require('dw/util/StringUtils');
const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
const OrderExportUtils = require('~/cartridge/scripts/OrderExportUtils');
const MaoService = require('~/cartridge/scripts/services/MaoService');
const SQSQueueService = require('~/cartridge/scripts/services/SQSQueueService');
const MAOPreferences = require('~/cartridge/scripts/MaoPreferences');

/**
 * Constructs search order query
 *
 * @return {string} Formatted search order query.
 */
function getSearchOrderQuery() {
    let queryString;
    var payPal = "'PayPal'";

    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    if (isAurusEnabled) {
        queryString = 'exportStatus = {0} AND status != {1} AND status != {2} AND custom.updates = NULL AND (paymentStatus = {3} OR custom.bfxOrderId != NULL)';
    } else {
        queryString = 'exportStatus = {0} AND status != {1} AND status != {2} AND custom.updates = NULL AND (paymentStatus = {3} OR custom.paymentMethodID = {4} OR custom.bfxOrderId != NULL)';
    }

    let queryParams = [
        Order.EXPORT_STATUS_READY,
        Order.ORDER_STATUS_FAILED,
        Order.ORDER_STATUS_CANCELLED,
        Order.PAYMENT_STATUS_PAID,
        payPal
    ];

    return StringUtils.format(queryString, queryParams);
}
/**
 * Performs order search using provided search query.
 *
 * @param {string} searchQuery - Search order query.
 * @return {Iterator} Found orders
 */
function getOrders(searchQuery) {
    return OrderMgr.searchOrders(searchQuery, null);
}

/**
 * Save orders in MAO
 * @param {dw.Order.order} order object
 * @param {string} accessToken to make save order call
 * @param {Object} sqsQueueConfigs SQS queue configurations
 * @return {boolean} returns true if order saved successfully in MAO, else false
 */
function saveOrderInMAO(order, accessToken, sqsQueueConfigs) {
    let orderJSON = OrderExportUtils.getOrderJSON(order);
    let saveOrderStatus;
    if (!empty(orderJSON) && !orderJSON.error && (!empty(accessToken) || (sqsQueueConfigs && sqsQueueConfigs.isSQSEnabled))) {
        Logger.debug('Save order request JSON :: {0}', orderJSON);

        var saveOrderService;
        var response;
        try {
            var saveOrderRequest;
            if (sqsQueueConfigs && sqsQueueConfigs.isSQSEnabled) {
                var orderJSONObject = JSON.parse(orderJSON);
                orderJSONObject.MessageHeader.Organization = sqsQueueConfigs.Organization;
                orderJSONObject.MessageHeader.User = sqsQueueConfigs.User;
                orderJSONObject.MessageHeader.MSG_TYPE = sqsQueueConfigs.queue;

                var messageHdr = orderJSONObject.MessageHeader;

                delete orderJSONObject.MessageHeader;

                var messageBody = JSON.stringify(orderJSONObject);
                var url = sqsQueueConfigs.url
                    .replace('{account}', sqsQueueConfigs.account)
                    .replace('{queue}', sqsQueueConfigs.queue)
                    .replace('{region}', sqsQueueConfigs.awsRegion)
                    .replace('{service}', sqsQueueConfigs.servicename)
                    .replace('{messageBody}', encodeURIComponent(messageBody))
                    .replace('{messageHdr}', encodeURIComponent(JSON.stringify(messageHdr)));

                // Calculate Signature
                saveOrderService = SQSQueueService.saveOrderService();
                saveOrderRequest = {
                    url: url,
                    data: orderJSONObject,
                    authorization: sqsQueueConfigs.authorization,
                    queue: sqsQueueConfigs.queue,
                    account: sqsQueueConfigs.account,
                    SignatureUrl: sqsQueueConfigs.url,
                    secretKey: sqsQueueConfigs.secretKey,
                    accessKey: sqsQueueConfigs.accessKey,
                    servicename: sqsQueueConfigs.servicename,
                    awsRegion: sqsQueueConfigs.awsRegion,
                    messageHdr: messageHdr
                };
                response = saveOrderService.call(saveOrderRequest);
                Logger.error('response : {0}', response.status);
            } else {
                saveOrderService = MaoService.saveOrderService();
                saveOrderRequest = {
                    orderData: orderJSON,
                    accessToken: accessToken
                };
                response = saveOrderService.call(saveOrderRequest);
            }
        } catch (error) {
            Logger.error(JSON.stringify(error));
        }

        if (response && response.status === 'OK' && response.object && response.object.statusCode === 200) {
            // update order export status to exported.
            Transaction.wrap(function () {
                order.setExportStatus(Order.EXPORT_STATUS_EXPORTED);
                if (empty(order.custom.sapCarrierCode)) {
                    order.custom.sapCarrierCode = JSON.parse(orderJSON).OrderLine[0].Extended.sapCarrierCode; // eslint-disable-line
                }
                if (!order.custom.onHold) {
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                }
            });
            saveOrderStatus = true;
        } else {
            Logger.error('Error in mao save order service call :: errorMessage {0} :: error {1}', response.errorMessage, response.error);
            saveOrderStatus = false;
        }
    }
    return saveOrderStatus;
}
/**
 * Method to validate required site preferences
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
 * Handle failed orders
 * @param {dw.Order.order} order object
 * @return {boolean} isOrderMarkedExportFailed - returns true if order marked to "Export Failed", else false
 */
function handleFailedOrders(order) {
    let orderObject = order;
    let isOrderMarkedExportFailed = false;
    try {
        let failedCount = (!empty(orderObject.custom.maoOrderExportFailedCount) ? orderObject.custom.maoOrderExportFailedCount : 0) + 1;
        let maxAllowedFailedCount = MAOPreferences.maoMaxFailedCount || 3;
        Transaction.wrap(function () {
            // update failed count
            orderObject.custom.maoOrderExportFailedCount = failedCount;
            if (failedCount >= maxAllowedFailedCount) {
                // update order export status to "Export Failed"
                orderObject.setExportStatus(Order.EXPORT_STATUS_FAILED);
                isOrderMarkedExportFailed = true;
            }
        });
    } catch (e) {
        Logger.error('Error in OrderExport.js -> handleFailedOrders ::error {1}', e.message);
    }
    return isOrderMarkedExportFailed;
}
/**
 * Main function of the script to start order export process.
 * @param {void}
 * @return {dw.system.Status} Return "OK" if orders exported successfully, else "ERROR"
 */

module.exports.execute = function (args) {
    const MAOAuthTokenHelper = require('~/cartridge/scripts/MAOAuthTokenHelper');
    const maxLimit = args.MaxLimit && args.MaxLimit > -1 ? args.MaxLimit : null;
    var currentCount = 0; // Tracks the number of orders that has been processed.

    if (!empty(maxLimit)) {
        Logger.info('Max order limit set to {0}', maxLimit);
    }

    var failedOrderUpdate = [];
    let orders;
    try {
        let searchOrderQuery = getSearchOrderQuery();
        orders = getOrders(searchOrderQuery);
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

        var isSQSEnabled = false;
        var sqsQueueConfigs;
        try {
            var Site = require('dw/system/Site');
            var sqsQueueConfigsPreference = Site.current.getCustomPreferenceValue('sqsQueueConfigs');
            sqsQueueConfigs = sqsQueueConfigsPreference ? JSON.parse(Site.current.getCustomPreferenceValue('sqsQueueConfigs')) : '';
            isSQSEnabled = sqsQueueConfigs ? sqsQueueConfigs.isSQSEnabled : false;
        } catch (error) {
            Logger.error(JSON.stringify(error));
        }

        var accessToken;
        if (!isSQSEnabled) {
            var tokenHelper = new MAOAuthTokenHelper();
            accessToken = tokenHelper.getValidToken().accessToken;
        }

        if (isSQSEnabled || accessToken) {
            while (orders.hasNext()) {
                if (!empty(maxLimit) && currentCount >= maxLimit) {
                    Logger.info('Reached max number of orders to process. Max limit: {0}, Current Count: {1}', maxLimit, currentCount);
                    orders.close();
                    break;
                }

                let order = orders.next();
                try {
                    let saveOrderStatus = saveOrderInMAO(order, accessToken, sqsQueueConfigs);
                    if (!saveOrderStatus) {
                        let isOrderMarkedExportFailed = handleFailedOrders(order);
                        if (isOrderMarkedExportFailed) {
                            Logger.error('Order {0} marked to export failed.', order.orderNo);
                            failedOrderUpdate.push(order.orderNo);
                        }
                        Logger.error('Error while saving order in MAO {0}', order.orderNo);
                    } else {
                        Logger.info('Order {0} export completed successfully.', order.orderNo);
                    }
                } catch (e) {
                    failedOrderUpdate.push(order.orderNo);
                    Logger.error('Error while exporting order {0} :: error {1}', order.orderNo, e.message);
                }
                currentCount++;
            }
        } else {
            Logger.error('Access Token unavailable');
            orders.close(); // Close order - SeekableIterator as all elements of this iterator has not been retrieved.
            return new Status(Status.ERROR);
        }
    } catch (e) {
        Logger.error('Error in OrderExport.js :: {0}', e.message);
        if (orders && orders instanceof dw.util.SeekableIterator) {
            orders.close(); // Close order - SeekableIterator as all elements of this iterator has not been retrieved.
        }
        return new Status(Status.ERROR);
    }
    if (failedOrderUpdate.length > 0) {
        Logger.error('Error while exporting order(s) :: {0}', JSON.stringify(failedOrderUpdate));
        return new Status(Status.ERROR, 'OrderExportFailed', 'Error while exporting order(s) :: {0}', JSON.stringify(failedOrderUpdate));
    }
    return new Status(Status.OK);
};
