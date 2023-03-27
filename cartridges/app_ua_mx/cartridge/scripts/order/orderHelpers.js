'use strict';

var OrderMgr = require('dw/order/OrderMgr');
var Locale = require('dw/util/Locale');
var Site = require('dw/system/Site');

var OrderModel = require('*/cartridge/models/order');
var ReturnModel = require('*/cartridge/models/returnOrder');

var base = require('app_storefront_base/cartridge/scripts/order/orderHelpers');
var siteId = Site.getCurrent().getID();
/**
* Returns a list of orders for the current customer
* @param {Object} currentCustomer - object with customer properties
* @param {Object} querystring - querystring properties
* @param {string} locale - the current request's locale id
* @returns {Object} - orderModel of the current dw order object
* */
function getOrders(currentCustomer, querystring, locale) {
    var Order = require('dw/order/Order');
    // get all orders for this user
    var customerNo = currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND status!={1} AND status!={2} AND (status!={3} OR custom.accertifyRecCode = {4})',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED,
        Order.ORDER_STATUS_FAILED,
        Order.ORDER_STATUS_CREATED,
        'HOLD'
    );

    var orders = [];
    var orderModel;
    var currentLocale = Locale.getLocale(locale);

    while (customerOrders.hasNext()) {
        var customerOrder = customerOrders.next();
        var config = {
            numberOfLineItems: 'single'
        };

        orderModel = new OrderModel(
        customerOrder,
            { config: config, countryCode: currentLocale.country }
        );
        orders.push(orderModel);
    }

    return {
        orders: orders
    };
}

/**
 * Provides Order Model object
 * @param {dwOrder} dwOrder DW Order object
 * @returns {count} count returns total number of items shipped in current order
 */
function getShippedItemCount(dwOrder) {
    var count = [];
    if ('shippingJson' in dwOrder.custom && dwOrder.custom.shippingJson) {
        var shippingJson = dwOrder.custom.shippingJson;
        var shippedData = JSON.parse(shippingJson);
        if (shippedData && shippedData.length > 0) {
            for (let i = 0; i < shippedData.length; i++) {
                var data = shippedData[i];
                var items = data.items;
                var itemKeys = Object.keys(items);
                for (let j = 0; j < itemKeys.length; j++) {
                    var itemKey = itemKeys[j];
                    if (count.indexOf(itemKey) < 0) {
                        count.push(itemKey);
                    }
                }
            }
        }
    }
    return count.length;
}

/**
 * Provides Order Model object
 * @param {string} orderID DW Order number
 * @param {string} localeID request's locale ID
 * @param {boolean} handleMultipleShipments - handle the multiple shipments
 * @returns {Object} returns order Model
 */
function getOrderDetailsModel(orderID, localeID, handleMultipleShipments) {
    var order = OrderMgr.getOrder(orderID);
    if (!order) return null;
    var config = {
        numberOfLineItems: '*'
    };
    var currentLocale = Locale.getLocale(localeID);
    var shippedItemCount = getShippedItemCount(order) ? getShippedItemCount(order) : null;
    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'orderDetails', handleMultipleShipments: handleMultipleShipments }
    );
    orderModel.shippedItems = shippedItemCount;
    return orderModel;
}

/**
 * Creates an order model for the current customer
 * @param {Object} req - the request object
 * @param {boolean} handleMultipleShipments - handle the multiple shipments
 * @returns {Object} an object of the customer's order
 */
function getOrderDetails(req, handleMultipleShipments) {
    return getOrderDetailsModel(req.querystring.orderID, req.locale.id, handleMultipleShipments);
}

/**
 * Creates an order model for the current customer
 * @param {Object} req - the request object
 * @param {Object} selectedPidsArray - selected products details in return flow
 * @param {Object} pidQtyObj - selected products quantity details in return flow
 * @returns {Object} an object of the customer's order
 */
function getReturnOrderDetails(req, selectedPidsArray, pidQtyObj) {
    var orderID = req.querystring.trackOrderNumber ? req.querystring.trackOrderNumber : req.querystring.orderID;
    var order = OrderMgr.getOrder(orderID);

    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale = Locale.getLocale(req.locale.id);

    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'orderDetails', selectedPidsArray: selectedPidsArray, pidQtyObj: pidQtyObj }
    );
    return orderModel;
}

/**
 * Fetches TrackingDetails for guest customer
 * @param {string} trackOrderNumber DW Order number
 * @param {string} trackOrderEmail Customer Email Address
 * @param {string} localeID request's locale ID
 * @param {boolean} handleMultipleShipments - handle the multiple shipments
 * @returns {Object} trackingDetails returns TrackingDetails object
 */
function getTrackingDetails(trackOrderNumber, trackOrderEmail, localeID, handleMultipleShipments) {
    var Resource = require('dw/web/Resource');
    return {
        order: (trackOrderNumber && trackOrderEmail) ? getOrderDetailsModel(trackOrderNumber, localeID, handleMultipleShipments) : null,
        errorMsg: Resource.msg('error.message.trackorder.form', 'login', null)
    };
}

/**
 * Provides Order model
 * @param {Object} req Request model
 * @returns {Object} returs order Model
 */
function getOrderModel(req) {
    var Order = require('dw/order/Order');
    var orders = [];
    var orderItr = customer.orderHistory ? customer.orderHistory.orders : null;//eslint-disable-line
    if (!orderItr) return [];
    try {
        // Fetch only first two orders for account dashboard
        var count = 2;
        while (orderItr.hasNext() && count > 0) {
            var dwOrder = orderItr.next();
            var dwOrderStatus = dwOrder && dwOrder.getStatus() ? dwOrder.getStatus().value : null;
            if (dwOrder && dwOrderStatus !== Order.ORDER_STATUS_REPLACED && dwOrderStatus !== Order.ORDER_STATUS_FAILED && dwOrderStatus !== Order.ORDER_STATUS_CREATED) {
                orders.push(getOrderDetailsModel(dwOrder.orderNo, req.locale.id));
                count--;
            }
        }
    } catch (e) {
        orders = [];
        e.stack;//eslint-disable-line
    } finally {
        if (orderItr) orderItr.close();
    }
    return orders;
}

/**
* Returns a list of orders for the current customer
* @param {Object} currentCustomer - object with customer properties
* @param {Object} querystring - querystring properties
* @param {string} locale - the current request's locale id
* @returns {Object} - orderModel of the current dw order object
* */
function getReturnOrders(currentCustomer, querystring, locale) {
    var Order = require('dw/order/Order');
    // get all orders for this user
    var customerNo = currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND (shippingStatus={1} OR shippingStatus={2})',
        'creationDate desc',
        customerNo,
        Order.SHIPPING_STATUS_PARTSHIPPED,
        Order.SHIPPING_STATUS_SHIPPED
    );

    var orders = [];
    var currentLocale = Locale.getLocale(locale);

    while (customerOrders.hasNext()) {
        var customerOrder = customerOrders.next();
        var config = {
            numberOfLineItems: 'single'
        };

        var returnCases = customerOrder.getReturnCases();
        for (var i = 0; i < returnCases.length; i++) {
            var returnCase = returnCases[i];
            var order = new ReturnModel(
                returnCase,
                { config: config, countryCode: currentLocale.country }
            );
            orders.push(order);
        }
    }

    return orders;
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

base.getOrders = getOrders;
base.getOrderDetails = getOrderDetails;
base.getReturnOrderDetails = getReturnOrderDetails;
base.getTrackingDetails = getTrackingDetails;
base.getOrderModel = getOrderModel;
base.getReturnOrders = getReturnOrders;
base.orderDetailsRequest = orderDetailsRequest;
module.exports = base;
