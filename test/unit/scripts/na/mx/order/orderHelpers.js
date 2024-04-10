'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

let orderHelpers;
let defaultStubs;
let req;
let currentCustomer;
let Site = require('dw/system/Site');
let Locale = new (require('dw/util/Locale'))();

describe('app_ua_mx/cartridge/scripts/order/orderHelpers.js', () => {
    before(() => {
        Locale.getLocale = () => {
            return {
                country: 'MX'
            }
        };
        req = {
            locale: {
                id: 'MX'
            },
            querystring: {
                orderID: 123456
            }
        };
    });

    beforeEach(() => {
        currentCustomer = new (require('dw/customer/Customer'))();
        defaultStubs = {
            '*/cartridge/models/order': require('dw/order/Order'),
            '*/cartridge/models/returnOrder': function returnOrder() {
                return {};
            },
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {},
            'dw/util/Locale': Locale
        };
        orderHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/orderHelpers.js', defaultStubs);
    });

    it('Testing method: orderDetailsRequest', () => {
        var customerNo = '123456';
        var orderID = '654321';
        var siteId = Site.getCurrent().getID();
        var requestParamsJson;
        
        assert.doesNotThrow(() => requestParamsJson = orderHelpers.orderDetailsRequest(customerNo, orderID));
        var requestParams = JSON.parse(requestParamsJson);
        assert.equal(requestParams.input.siteId, siteId);
        assert.equal(requestParams.input.orderNumber, orderID);
        assert.equal(requestParams.input.customerNo, customerNo);
        assert.isTrue(requestParams.input.options.includeReturnInfo);
    });

    
    it('Testing method: getTrackingDetails', () => {
        var trackOrderNumber = '123456';
        var trackOrderEmail = 'test@email.com';
        var localeID = 'MX';
        var handleMultipleShipments = false;
        var trackingDetails;

        var order = new (require('dw/order/Order'))();
        var OrderMgr = new (require('dw/order/OrderMgr'))();
        OrderMgr.getOrder = () => {
            return order;
        };

        defaultStubs['dw/order/OrderMgr'] = OrderMgr;
        orderHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/orderHelpers.js', defaultStubs);
        
        // trackOrderNumber and trackOrderEmail are not provided
        assert.doesNotThrow(() => trackingDetails = orderHelpers.getTrackingDetails('', '', localeID, handleMultipleShipments));
        assert.isNull(trackingDetails.order);

        // shippingJson is NULL
        assert.doesNotThrow(() => trackingDetails = orderHelpers.getTrackingDetails(trackOrderNumber, trackOrderEmail, localeID, handleMultipleShipments));
        assert.isNull(trackingDetails.order.shippedItems);

        // shippingJson contains 2 items
        order.custom.shippingJson = '[{"date":"1/1/2022","items": {"productId": "1"}},{"date":"1/1/2022","items": {"3023761-003-7": "1"}}]';
        assert.doesNotThrow(() => trackingDetails = orderHelpers.getTrackingDetails(trackOrderNumber, trackOrderEmail, localeID, handleMultipleShipments));
        // Shipped items count == 2 (shippingJson contains 2 items)
        assert.equal(trackingDetails.order.shippedItems, 2);
    });

    it('Testing method: getReturnOrders', () => {
        var orders;
        var locale = 'MX';
        var querystring = '';

        var order = new (require('dw/order/Order'))();
        order.getReturnCases = () => [];
        var ordersIterator = new (require('dw/util/Iterator'))([order]);
        var OrderMgr = new (require('dw/order/OrderMgr'))();
        OrderMgr.searchOrders = () => ordersIterator;

        defaultStubs['dw/order/OrderMgr'] = OrderMgr;
        orderHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/orderHelpers.js', defaultStubs);

        // No orders with return cases
        assert.doesNotThrow(() => orders = orderHelpers.getReturnOrders(currentCustomer, querystring, locale));
        assert.lengthOf(orders, 0);

        // Order has return cases
        order.getReturnCases = () => [
            new (require('dw/order/ReturnCase'))()
        ];
        ordersIterator = new (require('dw/util/Iterator'))([order]);
        assert.doesNotThrow(() => orders = orderHelpers.getReturnOrders(currentCustomer, querystring, locale));
        assert.lengthOf(orders, 1);
    });

    it('Testing method: getOrderDetails', () => {
        var orderDetails;
        var handleMultipleShipments = false;
        var OrderMgr;

        // Order not found
        assert.doesNotThrow(() => orderDetails = orderHelpers.getOrderDetails(req, handleMultipleShipments));
        assert.isNull(orderDetails);

        // Order found
        var order = new (require('dw/order/Order'))();
        OrderMgr = new (require('dw/order/OrderMgr'))();
        OrderMgr.getOrder = (orderId) => {
            order.orderNo = orderId;
            return order;
        };

        defaultStubs['dw/order/OrderMgr'] = OrderMgr;
        defaultStubs['*/cartridge/models/order'] = function OrderModel(order) {
            return order;
        };
        orderHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/orderHelpers.js', defaultStubs);

        assert.doesNotThrow(() => orderDetails = orderHelpers.getOrderDetails(req, handleMultipleShipments));
        assert.isObject(orderDetails);
        assert.equal(orderDetails.orderNo, req.querystring.orderID);
    });

    it('Testing method: getReturnOrderDetails', () => {
        var orderDetails;
        var selectedPidsArray = [];
        var pidQtyObj = {};

        var order = new (require('dw/order/Order'))();
        var OrderMgr = new (require('dw/order/OrderMgr'))();
        OrderMgr.getOrder = (orderId) => {
            order.orderNo = orderId;
            return order;
        };

        defaultStubs['dw/order/OrderMgr'] = OrderMgr;
        defaultStubs['*/cartridge/models/order'] = function OrderModel(order) {
            return order;
        };
        orderHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/orderHelpers.js', defaultStubs);

        assert.doesNotThrow(() => orderDetails = orderHelpers.getReturnOrderDetails(req, selectedPidsArray, pidQtyObj));
        assert.isObject(orderDetails);
        assert.equal(orderDetails.orderNo, req.querystring.orderID);

        // Request contains trackOrderNumber param
        req.querystring.trackOrderNumber = 123456;
        assert.doesNotThrow(() => orderDetails = orderHelpers.getReturnOrderDetails(req, selectedPidsArray, pidQtyObj));
        assert.isObject(orderDetails);
        assert.equal(orderDetails.orderNo, req.querystring.orderID);
    });

    it('Testing method: getOrders', () => {
        var orders;
        var querystring = '';
        var locale = 'MX';

        var ordersIterator = new (require('dw/util/Iterator'))([]);
        var OrderMgr = new (require('dw/order/OrderMgr'))();
        OrderMgr.searchOrders = () => ordersIterator;

        defaultStubs['dw/order/OrderMgr'] = OrderMgr;
        orderHelpers = proxyquire('../../../../../../cartridges/app_ua_mx/cartridge/scripts/order/orderHelpers.js', defaultStubs);

        // Customer doesn't have orders
        assert.doesNotThrow(() => orders = orderHelpers.getOrders(currentCustomer, querystring, locale));
        assert.isObject(orders);
        assert.lengthOf(orders.orders, 0);

        // Customer has one order
        var order = new (require('dw/order/Order'))();
        ordersIterator = new (require('dw/util/Iterator'))([order]);
        OrderMgr.searchOrders = () => ordersIterator;

        assert.doesNotThrow(() => orders = orderHelpers.getOrders(currentCustomer, querystring, locale));
        assert.isObject(orders);
        assert.lengthOf(orders.orders, 1);
    });

    it('Testing method: getOrderModel', () => {
        var orders;

        // No orders found
        assert.doesNotThrow(() => orders = orderHelpers.getOrderModel(req));
        assert.lengthOf(orders, 0);
    });
    
});
