'use strict';

var Site = require('dw/system/Site');
var siteId = Site.getCurrent().getID();
var Logger = require('dw/system/Logger');

/* Script modules */
var base = require('app_storefront_base/cartridge/scripts/order/orderHelpers');

/**
 * Main function of the script to start order export process.
 * @param {string} requestType - mention about the type of request to be process
 * @param {Object} params - retrieve respective order info
 * @return {Object} Return orders data
 */
function getOrders(requestType, params) {
    var Resource = require('dw/web/Resource');
    var orderData = {
        orders: null,
        errorMsg: Resource.msg('serviceerror.message.trackorder.form', 'login', null)
    };

    const UACAPIAuthTokenHelper = require('~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper');
    const UACAPIDataService = require('~/cartridge/scripts/UACAPI/services/UACAPIDataService');

    var tokenHelper = new UACAPIAuthTokenHelper();
    const accessToken = tokenHelper && tokenHelper.getValidToken() ? tokenHelper.getValidToken().accessToken : null;

    if (accessToken) {
        var UACAPIHelper = require('../util/UACAPIHelper');
        var graphQLPayload = UACAPIHelper.prepareGraphQLRequest(requestType, params);
        var graphQLService = UACAPIDataService.getGraphQL(requestType);

        var graphQLResponse = graphQLService.call({
            payload: graphQLPayload,
            token: 'Bearer ' + accessToken
        });
        if (graphQLResponse && graphQLResponse.ok && graphQLResponse.object) {
            if (!graphQLResponse.object.error && graphQLResponse.object.orders) {
                orderData.orders = graphQLResponse.object.orders;
                orderData.errorMsg = null;
            } else if (graphQLResponse.object.errorMessage === 'No matching order found') {
                orderData.errorMsg = Resource.msg('error.message.trackorder.form', 'login', null);
            }
        }
    }
    return orderData;
}

/**
 * Function of the script to construct the requestParams for account dashBoard
 * @param {Object} customerNo - customer number
 * @return {Object} Return request object
 */
function accountDashBoardRequest(customerNo) {
    var params = {};
    params.first = 2;
    params.after = '';
    params.input = {};
    params.input.siteId = siteId;
    params.input.customerNo = customerNo;

    return JSON.stringify(params);
}

/**
 * Function of the script to construct the requestParams for account dashBoard
 * @param {Object} customerNo - customer number
 * @param {string} pageCursor - next page reference
 * @return {Object} Return request object
 */
function orderHistoryRequest(customerNo, pageCursor) {
    var params = {};
    params.first = 10;
    params.after = pageCursor || '';
    params.input = {};
    params.input.siteId = siteId;
    params.input.customerNo = customerNo;

    return JSON.stringify(params);
}

/**
 * Function of the script to construct the requestParams for account dashBoard
 * @param {Object} customerNo - customer number
 * @param {string} orderID - retrieve the details of this order
 * @return {Object} Return request object
 */
function orderDetailsRequest(customerNo, orderID) {
    var params = {};
    params.input = {};
    params.input.siteId = siteId;
    params.input.orderNumber = orderID;
    params.input.customerNo = customerNo;
    params.input.options = {};
    params.input.options.includeReturnInfo = true;

    return JSON.stringify(params);
}

/**
 * Function of the script to construct the requestParams for account dashBoard
 * @param {string} orderID - retrieve the details of this order
 * @param {string} email - retrieve the details of this order
 * @return {Object} Return request object
 */
function orderTrackRequest(orderID, email) {
    var params = {};
    params.input = {};
    params.input.siteId = siteId;
    params.input.orderNumber = orderID;
    params.input.email = email;
    params.input.options = {};
    params.input.options.includeReturnInfo = true;

    return JSON.stringify(params);
}

/**
 * Capitalize order's shipping address postal code
 * @param {dw.order.Order} order dw order
 * @returns {dw.order.Order} processed dw order
 */
function capitalizeShippingPostalCode(order) {
    var Transaction = require('dw/system/Transaction');
    var resultOrder = order;
    var shippingAddress = resultOrder.getDefaultShipment().getShippingAddress();
    var postalCode = shippingAddress ? shippingAddress.getPostalCode().toUpperCase() : null;
    if (postalCode) {
        Transaction.wrap(function () {
            resultOrder.getDefaultShipment().getShippingAddress().setPostalCode(postalCode);
        });
    }

    return resultOrder;
}

/**
 * Provides Order model
 * @param {Object} req Request model
 * @returns {Object} returs order Model
 */
function getOrderModel(req) {
    var customerNo = req.currentCustomer.profile.customerNo;
    var params = accountDashBoardRequest(customerNo, null);
    var customerOrders = getOrders('dashboard', params).orders;
    var orderModel = null;
    if (customerOrders) {
        var OrderModel = require('*/cartridge/models/OIS/order');
        orderModel = new OrderModel(customerOrders);
    }
    return orderModel;
}

/**
 * Get Cancel Reasons from custom preferences
 * @returns {Object} cancelReasons - Cancel Reasons from custom preferences
 */
function getCancelReasons() {
    var cancelReasons = {};
    try {
        cancelReasons = JSON.parse(Site.current.getCustomPreferenceValue('cancelOrderReason')).cancelReasons;
    } catch (error) {
        Logger.error(JSON.stringify(error));
    }
    return cancelReasons;
}

/**
 * Cancel customer's order
 * @param {Object} order - order
 * @param {string} cancelReasons - reason of cancelling the order
 * @param {string} note - additional note
 * @return {Object} response - if the order is cancelled successfully
 */
function cancelOrder(order, cancelReasons, note) {
    var returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');
    var Order = require('dw/order/Order');
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');

    var response = {
        success: false
    };

    try {
        if (order) {
            // Check if order is cancellable
            var IsOrderCancellableRequestParams = returnHelpers.getIsOrderCancellableRequestBody(order.orderNo, order.customerEmail);
            var IsOrderCancellableQueryResponse = returnHelpers.createRmaMutation('guestOrder', IsOrderCancellableRequestParams);
            var isOrderCancellable = IsOrderCancellableQueryResponse && IsOrderCancellableQueryResponse.orders && IsOrderCancellableQueryResponse.orders.isCancellable ? IsOrderCancellableQueryResponse.orders.isCancellable : false;
            if (isOrderCancellable) {
                // Cancel Order status from SFCC and MAO
                var cancelOrderRequestParams = returnHelpers.getCancelOrderRequestBody(order.orderNo, cancelReasons, note);
                var cancelOrderResponse = returnHelpers.createRmaMutation('cancelOrder', cancelOrderRequestParams);
                var isResponseSuccess = cancelOrderResponse && cancelOrderResponse.orderCount && cancelOrderResponse.orderCount > 0;
                if (isResponseSuccess) {
                    Transaction.wrap(function () {
                        if (order.getStatus().getValue() !== Order.ORDER_STATUS_CREATED) {
                            order.setStatus(Order.ORDER_STATUS_CANCELLED);
                        } else {
                            OrderMgr.failOrder(order, false);
                        }
                    });
                    response.success = true;
                }
            }
        }
    } catch (error) {
        Logger.error(JSON.stringify(error));
    }

    return response;
}

module.exports = {
    getLastOrder: base.getLastOrder,
    getOrders: getOrders,
    accountDashBoardRequest: accountDashBoardRequest,
    orderHistoryRequest: orderHistoryRequest,
    orderDetailsRequest: orderDetailsRequest,
    orderTrackRequest: orderTrackRequest,
    capitalizeShippingPostalCode: capitalizeShippingPostalCode,
    getOrderModel: getOrderModel,
    getCancelReasons: getCancelReasons,
    cancelOrder: cancelOrder
};
