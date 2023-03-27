'use strict';

const { assert } = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function UACAPIAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}

function UACAPIEmptyAuthTokenHelper() {
    this.getValidToken = () => null;
}

function OrderModel () {}

var orderHelpers = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', {
    'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
    'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
    'app_storefront_base/cartridge/scripts/order/orderHelpers': {
        getLastOrder: () => null
    },
    'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
    'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
    '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
    '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
        getGraphQL: () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        object: {
                            error: false,
                            orders: []
                        }
                    };
                }
            }
        }
    },
    '../util/UACAPIHelper': {
        prepareGraphQLRequest: () => null
    },
    'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
    '*/cartridge/models/OIS/order': OrderModel
});

describe('int_mao/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', () => {

    it('Testing method: getLastOrder when last order is null', () => {
        var lastOrder = orderHelpers.getLastOrder();
        assert.isDefined(lastOrder, 'Last order is not defined');
        assert.isNull(lastOrder, 'Last order is not null');
    });

    it('Testing method: getOrders with valid token', () => {
        var orders = orderHelpers.getOrders();
        assert.isDefined(orders, 'orders not defined');
        assert.isNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.orders.length, 0)
    });

    it('Testing method: getOrders with empty token', () => {
        var orderHelpers = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', {
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIEmptyAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {},
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {}
        });
        var orders = orderHelpers.getOrders();
        assert.isDefined(orders, 'orders are not defined');
        assert.isNotNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.errorMsg, 'testMsg');
    });

    it('Testing method: getOrders with invalid response', () => {
        var orderHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', {
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getGraphQL: () => {
                    return {
                        call: () => {
                            return {
                                ok: true,
                                object: {
                                    error: true,
                                    orders: [],
                                    errorMessage: 'No matching order found'
                                }
                            };
                        }
                    }
                }
            },
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {}
        });
        var orders = orderHelpersRes.getOrders();
        assert.isDefined(orders, 'orders not defined');
        assert.isNotNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.errorMsg, 'testMsg');
    });

    it('Testing method: getOrders with invalid response of server error', () => {
        var orderHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', {
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getGraphQL: () => {
                    return {
                        call: () => {
                            return {
                                ok: true,
                                object: {
                                    error: true,
                                    orders: [],
                                    errorMessage: 'server error'
                                }
                            };
                        }
                    }
                }
            },
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {}
        });
        var orders = orderHelpersRes.getOrders();
        assert.isDefined(orders, 'orders not defined');
        assert.isNotNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.errorMsg, 'testMsg');
    });

    it('Testing method: getOrders with response is null', () => {
        var orderHelpersRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', {
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getGraphQL: () => {
                    return {
                        call: () => null
                    }
                }
            },
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {}
        });
        var orders = orderHelpersRes.getOrders();
        assert.isDefined(orders, 'orders not defined');
        assert.isNotNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.errorMsg, 'testMsg');
    });


    it('Testing method: accountDashBoardRequest', () => {
        var accountDashBoardRequest = orderHelpers.accountDashBoardRequest();
        assert.isDefined(accountDashBoardRequest, 'accountDashBoardRequest not defined');
        assert.isNotNull(accountDashBoardRequest, 'accountDashBoardRequest is null');
    });

    it('Testing method: orderHistoryRequest', () => {
        var orderHistoryRequest = orderHelpers.orderHistoryRequest();
        assert.isDefined(orderHistoryRequest, 'orderHistoryRequest not defined');
        assert.isNotNull(orderHistoryRequest, 'orderHistoryRequest is null');
    });

    it('Testing method: orderDetailsRequest', () => {
        var orderDetailsRequest = orderHelpers.orderDetailsRequest();
        assert.isDefined(orderDetailsRequest, 'orderDetailsRequest not defined');
        assert.isNotNull(orderDetailsRequest, 'orderDetailsRequest is null');
    });

    it('Testing method: orderTrackRequest', () => {
        var orderTrackRequest = orderHelpers.orderTrackRequest();
        assert.isDefined(orderTrackRequest, 'orderTrackRequest not defined');
        assert.isNotNull(orderTrackRequest, 'orderTrackRequest is null');
    });

    it('Testing method: capitalizeShippingPostalCode when shipping address is null', () => {
        var order = {
            getDefaultShipment: () => {
                return {
                    getShippingAddress: () => null
                };
            }
        };
        var capitalizeShippingPostalCode = orderHelpers.capitalizeShippingPostalCode(order);
        assert.isDefined(capitalizeShippingPostalCode, 'capitalizeShippingPostalCode not defined');
        assert.isNotNull(capitalizeShippingPostalCode, 'capitalizeShippingPostalCode is null');
    });

    it('Testing method: capitalizeShippingPostalCode when shipping address is not null', () => {
        var order = {
            getDefaultShipment: () => {
                return {
                    getShippingAddress: () => {
                        return {
                            getPostalCode: () => '1234',
                            setPostalCode: () => null
                        };
                    }
                };
            }
        };
        var capitalizeShippingPostalCode = orderHelpers.capitalizeShippingPostalCode(order);
        assert.isDefined(capitalizeShippingPostalCode, 'capitalizeShippingPostalCode not defined');
        assert.isNotNull(capitalizeShippingPostalCode, 'capitalizeShippingPostalCode is null');
    });

    it('Testing method: getOrderModel', () => {
        var req = {
            currentCustomer: {
                profile: {
                    customerNo: '12345'
                }
            }
        };
        var orderModel = orderHelpers.getOrderModel(req);
        assert.isDefined(orderModel, 'orderModel not defined');
        assert.isNotNull(orderModel, 'orderModel is null');
    });

    it('Testing method: getOrderModel if access token is null', () => {
        var orderHelpersNull = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/order/orderHelpers.js', {
            'dw/system/Site': require('../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../../mocks/dw/dw_system_Logger'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper': UACAPIEmptyAuthTokenHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getGraphQL: () => {
                    return {
                        call: () => {
                            return {
                                ok: true,
                                object: {
                                    error: false,
                                    orders: []
                                }
                            };
                        }
                    }
                }
            },
            '../util/UACAPIHelper': {
                prepareGraphQLRequest: () => null
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': OrderModel
        });
        var req = {
            currentCustomer: {
                profile: {
                    customerNo: '12345'
                }
            }
        };
        var orderModel = orderHelpersNull.getOrderModel(req);
        assert.isDefined(orderModel, 'orderModel not defined');
        assert.isNull(orderModel, 'orderModel is null');
    });

});
