'use strict';

const { assert } = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function OISAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}

function OrderModel () {}

var orderHelpers = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/orderHelpers', {
    'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
    'app_storefront_base/cartridge/scripts/order/orderHelpers': {
        getLastOrder: () => null
    },
    'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
    '../util/OISHelper': {
        prepareGraphQLRequest: (requestType, params) => {
            return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
        }
    },
    '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelper,
    '~/cartridge/scripts/init/OISDataService': {
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
            };
        }
    },
    'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
    '*/cartridge/models/OIS/order': OrderModel
});

describe('int_OIS/cartridge/scripts/order/orderHelpers', () => {

    it('Testing method: getLastOrder when last order is null', () => {
        var lastOrder = orderHelpers.getLastOrder();
        assert.isDefined(lastOrder, 'Last order is not defined');
        assert.isNull(lastOrder, 'Last order is not null');
    });

    it('Testing method: getOrders with valid token', () => {
        var orders = orderHelpers.getOrders();
        assert.isDefined(orders, 'orders not defined');
        assert.isNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.orders.length, 0);
    });

    it('Testing method: getOrders with empty token', () => {
        orderHelpers = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/orderHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '../util/OISHelper': {
                prepareGraphQLRequest: (requestType, params) => {
                    return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
                }
            },
            '~/cartridge/scripts/init/OISDataService': {
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
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {},
            '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelper
        });
        var orders = orderHelpers.getOrders();
        assert.isDefined(orders, 'orders are not defined');
        assert.isNotNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.errorMsg, 'testMsg');
    });

    it('Testing method: getOrders with invalid response', () => {
        var orderHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/orderHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelper,
            '~/cartridge/scripts/init/OISDataService': {
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
                    };
                }
            },
            '../util/OISHelper': {
                prepareGraphQLRequest: (requestType, params) => {
                    return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {}
        });
        var orders = orderHelpersRes.getOrders();
        assert.isDefined(orders, 'orders not defined');
        assert.isNotNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.errorMsg, 'testMsg');
    });

    it('Testing method: getOrders with invalid response of server error', () => {
        var orderHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/orderHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelper,
            '~/cartridge/scripts/init/OISDataService': {
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
                    };
                }
            },
            '../util/OISHelper': {
                prepareGraphQLRequest: (requestType, params) => {
                    return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {}
        });
        var orders = orderHelpersRes.getOrders();
        assert.isDefined(orders, 'orders not defined');
        assert.isNotNull(orders.errorMsg, 'Error exists');
        assert.equal(orders.errorMsg, 'testMsg');
    });

    it('Testing method: getOrders with response is null', () => {
        var orderHelpersRes = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/orderHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelper,
            '~/cartridge/scripts/init/OISDataService': {
                getGraphQL: () => {
                    return {
                        call: () => null
                    };
                }
            },
            '../util/OISHelper': {
                prepareGraphQLRequest: (requestType, params) => {
                    return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': {},

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
        assert.isNull(orderModel, 'orderModel is null');
    });

    it('Testing method: getOrderModel if access token is null', () => {
        var orderHelpersNull = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/order/orderHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'app_storefront_base/cartridge/scripts/order/orderHelpers': {
                getLastOrder: () => null
            },
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '../util/OISHelper': {
                prepareGraphQLRequest: (requestType, params) => {
                    return 'query order ($input: OrderInput!) { order (input: $input) { billingAddress { ...AddressFields } shippingAddress { ...AddressFields } creationDate lastModified currency customerInfo { email customerName customerNo customerId } orderNo isCommercialPickup status orderTotal paymentInstruments { amount paymentMethod { id } } orderItems { productItem { quantityExchanged quantityReturned quantity product { ...ProductFields } } shipmentId fulfillmentStatus storeId gift giftMessage shippingMethod returnInfo { isEligibleForReturn ineligibilityReason exchangeItems { productId } } } productTotal shipments { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } shippingTotal fulfillmentGroups { type fulfillmentStatus shipment { shipmentId carrier { code name } trackingNumber trackingLink estimatedDelivery dateDelivered dateShipped } storeId items { productItem { quantity product { ...ProductFields } } } } siteId taxTotal } } fragment AddressFields on Address { fullName firstName lastName suffix title companyName postBox address1 address2 suite city stateCode postalCode countryCode phone } fragment ProductFields on VariantProduct { prices { sale base tax discount total } upc sku copy { name } color { colorway } assets { images: imageURIs } ...on VariantProductEGiftCard { recipientName recipientEmail fromName amount message } }'
                }
            },
            '~/cartridge/scripts/init/OISDataService': {
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
                    };
                }
            },
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/models/OIS/order': OrderModel,
            '~/cartridge/scripts/util/OISAuthTokenHelper': OISAuthTokenHelper
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
    });

});
