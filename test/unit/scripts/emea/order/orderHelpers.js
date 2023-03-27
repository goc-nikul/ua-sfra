'use strict';

const { locale } = require('globalize');
// const { locale } = require('globalize');
const Locale = require('../../../../mocks/dw/dw_util_Locale');
const Site = require('../../../../mocks/dw/dw_system_Site');

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var order = {
    ORDER_STATUS_REPLACED: 'ORDER_STATUS_REPLACED',
    ORDER_STATUS_FAILED: 'ORDER_STATUS_FAILED',
    EXPORT_STATUS_READY: 'order export status is ready'
};

class OrderModel {
    constructor(customerOrder, { config, countryCode }) {
        this.customerOrder = customerOrder;
        this.config = {
            config,
            countryCode
        };
    }
}

class ReturnModel {
    constructor(returnCase, { config, countryCode }) {
        this.returnCase = {
            returnCase, config, countryCode
        };
    }
}


var orderHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/orderHelpers.js', {
    'dw/order/OrderMgr': {
        searchOrders: () => {
            var customObj = [{
                status: {
                    value: 3
                },
                custom: {
                    maoStatusUpdateFailedCount: null,
                    updates: 'paymentDetailsUpdate',
                    onHold: true,
                    sapCarrierCode: '12345'
                },
                setExportStatus: function () {
                    return 'exported';
                },
                setConfirmationStatus: function () {
                    return 'confirmed';
                }
            }];
            var cnt = 0;
            return {
                count: 1,
                hasNext: () => {
                    cnt++;
                    return cnt === 1;
                },
                getCount: function () {
                    return 10;
                },
                asList: function () {
                    return [];
                },
                next: () => {
                    return {
                        getReturnCases: () => {
                            return [customObj[0], {}];
                        }
                    };
                }
            };
        }
    },
    'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale'),
    '*/cartridge/models/order': OrderModel,
    '*/cartridge/models/returnOrder': ReturnModel,
    'app_storefront_base/cartridge/scripts/order/orderHelpers': {
        getLastOrder: () => null
    },
    'dw/order/Order': order,
    'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
});

describe('app_ua_emea/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', () => {

    it('Testing method: getOrders to get customer orders from profile', () => {
        var currentCustomer = {
            profile: {
                customerNo: 'Customer123'
            }
        };
        var querystring = {
            after: ''
        };
        var result = orderHelpers.getOrders(currentCustomer, querystring, Locale);
        assert.isDefined(result, 'Last order is defined');
    });

    it('Testing method: getReturnOrders from customer profile', () => {
        var currentCustomer = {
            profile: {
                customerNo: 'Customer123'
            }
        };
        var querystring = {
            after: ''
        };
        var result = orderHelpers.getReturnOrders(currentCustomer, querystring, 'AT');
        assert.equal(result.orders.length, 2);
        assert.isObject(result);
        assert.isDefined(result);

    });

    it('Testing method: getOrderDetails', () => {
        orderHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/orderHelpers.js', {
            'dw/order/OrderMgr': {
                getOrder: (orderID) => {
                    if (orderID) {
                        return {
                            custom: {
                                shippingJson: '[{"emailSent":true,"date":"2022-03-31T01:01:01.000Z","carrier":"UPS-STD","deliveryNumber":"852613375630050D","trackingCode":"883613727547322E","trackingLink":"","items":{"1361379-001-XS":"1"},"sentToPaazl":true}]'
                            }
                        };
                    }
                    return null;
                }
            },
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/models/returnOrder': {},
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/order/Order': order,
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource')
        });
        var req = {
            querystring: { orderID: '1234567890' },
            locale: { id: 'AT' }
        };
        var result = orderHelpers.getOrderDetails(req);
        assert.equal(result.shippedItems, 1);
        req = {
            querystring: { orderID: null },
            locale: { id: 'AT' }
        };
        result = orderHelpers.getOrderDetails(req);
        assert.isNull(result, null);
        var trackOrderNumber = 'TRAC123';
        var trackOrderEmail = 'test@ua.com';
        var localeID = 'AT';
        result = orderHelpers.getTrackingDetails(trackOrderNumber, trackOrderEmail, localeID);
        assert.equal(result.order.shippedItems, 1);
        assert.equal(result.errorMsg, 'testMsg');
    });

    it('Testing method: getReturnOrderDetails with order details in params ', () => {
        orderHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/orderHelpers.js', {
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/models/returnOrder': {},
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/order/Order': order
        });
        var req = {
            querystring: { orderID: '1234567890', trackOrderNumber: 'TRAC123' },
            locale: { id: 'AT' }
        };
        var selectedPidsArray = 'selectedPidsArray';
        var pidQtyObj = 'pidQtyObj';
        var result = orderHelpers.getReturnOrderDetails(req, selectedPidsArray, pidQtyObj);
        assert.equal(result.customerOrder.orderNo, '1234567890');
    });

    it('Testing method: getOrderModel with customer OrderNO', () => {
        var Customer = require('../../../../mocks/dw/dw_customer_Customer');
        global.customer = new Customer();
        orderHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/orderHelpers.js', {
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/models/returnOrder': {},
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order')
        });
        var req = {
            querystring: { orderID: '1234567890', trackOrderNumber: 'TRAC123' },
            locale: { id: 'AT' }
        };
        var result = orderHelpers.getOrderModel(req);
        assert.isDefined(result);
        var cnt = 0;
        global.customer.orderHistory = {
            orders: {
                close: function () {
                    return {};
                },
                count: 2,
                hasNext: () => {
                    cnt++;
                    return cnt === 1;
                },
                next: function () {
                    return {
                        getStatus: () => {
                            return {
                                value: 'ORDER_STATUS_SHIPPED'
                            };
                        }
                    };
                }
            }
        };
        result = orderHelpers.getOrderModel(req);
        assert.equal(result[0].customerOrder.orderNo, '1234567890');
        assert.isDefined(result);
    });

    it('Testing method: getOrderModel when last order is null', () => {
        var Customer = require('../../../../mocks/dw/dw_customer_Customer');
        global.customer = new Customer();
        orderHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/orderHelpers.js', {
            'dw/order/OrderMgr': require('../../../../mocks/dw/dw_order_OrderMgr'),
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/models/returnOrder': {},
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order')
        });
        var req = {
            querystring: { orderID: '1234567890', trackOrderNumber: 'TRAC123' },
            locale: { id: 'AT' }
        };
        global.customer.orderHistory = {
            orders: {
                close: function () {
                    return {};
                },
                count: 2
            }
        };
        var result = orderHelpers.getOrderModel(req);
        assert.equal(result.length, 0);
        assert.isDefined(result);
    });

    it('Testing method: getReturnOrders', () => {
        var Customer = require('../../../../mocks/dw/dw_customer_Customer');
        global.customer = new Customer();
        orderHelpers = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/order/orderHelpers.js', {
            'dw/order/OrderMgr': {
                searchOrders: () => {
                    return {
                        count: 1,
                        hasNext: () => {
                            return false;
                        },
                        next: () => {
                            return {
                                getReturnCases: () =>{
                                    return [{}, {}];
                                }
                            };
                        }
                    };
                }
            },
            'dw/util/Locale': require('../../../../mocks/dw/dw_util_Locale'),
            '*/cartridge/models/order': OrderModel,
            '*/cartridge/models/returnOrder': {},
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/order/Order': require('../../../../mocks/dw/dw_order_Order'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
        });
        var currentCustomer = {
            profile: {
                customerNo: 'Customer123'
            }
        };
        global.customer.orderHistory = {
            orders: {
                close: function () {
                    return {};
                },
                count: 2
            }
        };
        var querystring = {
            after: ''
        };
        var result = orderHelpers.getReturnOrders(currentCustomer, querystring);
        assert.equal(result.orders.length, 0);
        assert.isDefined(result);
    });
});
