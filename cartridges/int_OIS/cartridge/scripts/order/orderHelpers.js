'use strict';

const OISDataService = require('~/cartridge/scripts/init/OISDataService');
const OISAuthTokenHelper = require('~/cartridge/scripts/util/OISAuthTokenHelper');
var OISHelper = require('../util/OISHelper');
var Site = require('dw/system/Site');

var siteId = Site.getCurrent().getID();

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
    var tokenHelper = new OISAuthTokenHelper();
    const accessToken = tokenHelper && tokenHelper.getValidToken() ? tokenHelper.getValidToken().accessToken : null;
    var orderData = {
        orders: null,
        errorMsg: Resource.msg('serviceerror.message.trackorder.form', 'login', null)
    };

    if (accessToken) {
        var graphQLPayload = OISHelper.prepareGraphQLRequest(requestType, params);
        var graphQLService = OISDataService.getGraphQL();

        var graphQLResponse = graphQLService.call({
            payload: graphQLPayload,
            token: 'Bearer ' + accessToken
        });
        if (graphQLResponse && graphQLResponse.ok && graphQLResponse.object) {
            if (!graphQLResponse.object.error) {
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

module.exports = {
    getLastOrder: base.getLastOrder,
    getOrders: getOrders,
    accountDashBoardRequest: accountDashBoardRequest,
    orderHistoryRequest: orderHistoryRequest,
    orderDetailsRequest: orderDetailsRequest,
    orderTrackRequest: orderTrackRequest,
    capitalizeShippingPostalCode: capitalizeShippingPostalCode,
    getOrderModel: getOrderModel
};
