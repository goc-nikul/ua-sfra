'use strict';

const {
    assert
} = require('chai');

var proxiquire = require('proxyquire').noCallThru().noPreserveCache();

function Calendar() {
    this.toTimeString = () => '01/01/2022';
}

var OrderReturnDetailsModel = proxiquire('../../../../cartridges/int_OIS/cartridge/models/OIS/orderReturnDetails.js', {
    'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
    'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    '*/cartridge/scripts/util/utilHelper': {
        orderStatusModel: () => {
            return {
                DELIVERED: 'DELIVERED'
            };
        },
        fulfillmentStatus: () => {
            return {
                DELIVERED: 'DELIVERED'
            };
        },
        bopisOrderStatus: () => {
            return {};
        }
    },
    '*/cartridge/scripts/order/exchangeOrderHelper': {
        getExchangeProductList: () => '1234',
        getExchangeProductHits: () => null
    },
    '*/cartridge/scripts/helpers/storeHelpers': {
        findStoreById: () => {
			return {
				name: 'name',
	            address1: 'address1',
	            city: 'city',
	            stateCode: 'stateCode',
	            postalCode: 'postalCode'
			}
		},
        getStoreGoogleMapLink: () => null
    },
    'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    'dw/util/Calendar': Calendar,
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource')
});

describe('int_OIS/cartridge/models/OIS/orderReturnDetails.js', () => {

    it('Testing Model orderDetailsTemplate is null and with matching line item', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            orderItems: [{
                productItem: {
                    product: {
                        upc: '1234',
                        sku: '1234-1234',
                        copy: {
                            name: 'product name'
                        },
                        assets: null,
                        color: null,
                        prices: {
                            total: 100,
                            discount: 10,
                            base: 90
                        }
                    },
                    quantity: 1
                },
                shippingMethod: 'GROUND',
                shipmentId: '124',
                storeId: 'aaaa',
                returnInfo: {
                        isEligibleForReturn: true,
                        exchangeItems: []
                    }
            }],
            shippingAddress: {
                fullName: 'UA'
            },
            billingAddress: {},
            customerInfo : {},
            fulfillmentGroups: [{
                fulfillmentStatus: 'DELIVERED',
                items: []
            }],
            status: 'DELIVERED',
            shipments: [{
                dateDelivered: '01/01/2022'
            }]
        };
        var orderReturnDetails;
        assert.doesNotThrow(() => {
            var arrayPids = [{
                shipmentId: '124',
                quantity : 1,
                isBopisItem: true,
                pid: '1234'
            }];
            orderReturnDetails = new OrderReturnDetailsModel(node, arrayPids);
        });
        assert.isDefined(orderReturnDetails, 'orderReturnDetails is not defined');
        assert.isNotNull(orderReturnDetails, 'orderReturnDetails is null');
        assert.equal(orderReturnDetails.status, 'DELIVERED');
        assert.isFalse(orderReturnDetails.isEligibleForExchange);
        assert.equal(orderReturnDetails.taxTotal, '$0');
    });

    it('Testing Model orderDetailsTemplate is null and with matching line item, includeExchangeProducts, pid and pidQtyObj', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            orderItems: [{
                    productItem: {
                        product: {
                            upc: '1234',
                            sku: 'UA-1234-1234',
                            copy: {
                                name: 'product name'
                            },
                            assets: null,
                            color: null,
                            prices: {
                                tax: 10,
                                discount: 10,
                                base: 90
                            }
                        },
                        quantity: 1
                    },
                    shippingMethod: 'GROUND',
                    status: 'DELIVERED',
                    shipmentId: '124',
                    storeId: null,
                    returnInfo: {
                        isEligibleForReturn: true,
                        exchangeItems: []
                    }
                }
            ],
            shippingAddress: {
                fullName: null
            },
            fulfillmentGroups: [{
                fulfillmentStatus: 'DELIVERED',
                items: []
            }],
            status: 'DELIVERED',
            shipments: [{
                dateDelivered: '01/01/2022'
            }]
        };
        var orderReturnDetails;
        assert.doesNotThrow(() => {
            var arrayPids = [{
                shipmentId: '124',
                pid: '1234'
            }];
            var pidQtyObj = [{
                pid: '1234',
                qty: 1
            }];
            orderReturnDetails = new OrderReturnDetailsModel(node, arrayPids, true, '1234', pidQtyObj);
        });
        assert.isDefined(orderReturnDetails, 'orderReturnDetails is not defined');
        assert.isNotNull(orderReturnDetails, 'orderReturnDetails is null');
        assert.equal(orderReturnDetails.status, 'DELIVERED');
        assert.isFalse(orderReturnDetails.isEligibleForExchange);
        assert.equal(orderReturnDetails.orderTotal, '$0');
    });

    it('Testing Model orderDetailsTemplate is null and with matching line item, includeExchangeProducts, pid and pidQtyObj with duplicate', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            orderItems: [{
                    productItem: {
                        product: {
                            upc: '1234',
                            sku: null,
                            copy: {
                                name: 'product name'
                            },
                            assets: {
                                images: [{
                                    url: 'productimageurl'
                                }]
                            },
                            color: {
                                colorway: 'black'
                            },
                            prices: {
                                total: 100,
                                discount: 10,
                                base: 90
                            }
                        },
                        quantity: 1
                    },
                    shippingMethod: 'GROUND',
                    shipmentId: '124',
                    status: 'SHIPPED',
                    storeId: null,
                    returnInfo: {
                        isEligibleForReturn: true,
                        ineligibilityReason: 'size',
                        exchangeItems: [{}]
                    }
                }
            ],
            shippingAddress: {
                fullName: 'UA'
            },
            fulfillmentGroups: [{
                fulfillmentStatus: 'SHIPPED',
                items: []
            }],
            status: 'SHIPPED',
            shipments: [{
                dateDelivered: '01/01/2022'
            }]
        };
        var orderReturnDetails;
        assert.doesNotThrow(() => {
            var arrayPids = [{
                shipmentId: '124',
                pid: '1234'
            }];
            orderReturnDetails = new OrderReturnDetailsModel(node, arrayPids, true, '1234', []);
        });
        assert.isDefined(orderReturnDetails, 'orderReturnDetails is not defined');
        assert.isNotNull(orderReturnDetails, 'orderReturnDetails is null');
        assert.equal(orderReturnDetails.status, 'SHIPPED');
        assert.equal(orderReturnDetails.taxTotal, '$0');
        assert.equal(orderReturnDetails.subTotal, '$0');
        assert.equal(orderReturnDetails.orderTotal, '$0');
    });

    it('Testing Model orderDetailsTemplate is null and with matching line item, includeExchangeProducts, pid and pidQtyObj with duplicate and discount 0', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            orderItems: [{
                    productItem: {
                        product: {
                            upc: '1234',
                            sku: null,
                            copy: {
                                name: 'product name'
                            },
                            assets: {
                                images: [{
                                    url: 'productimageurl'
                                }]
                            },
                            color: {
                                colorway: 'black'
                            },
                            prices: {
                                total: 100,
                                discount: 0
                            }
                        },
                        quantity: 1
                    },
                    shippingMethod: 'GROUND',
                    shipmentId: '124',
                    status: 'SHIPPED',
                    storeId: null,
                    returnInfo: {
                        isEligibleForReturn: false,
                        ineligibilityReason: 'size',
                        exchangeItems: [{}]
                    }
                }
            ],
            shippingAddress: null,
            fulfillmentGroups: [{
                fulfillmentStatus: 'SHIPPED',
                items: []
            }],
            status: 'SHIPPED',
            shipments: [{
                dateDelivered: '01/01/2022'
            }]
        };
        var orderReturnDetails;
        assert.doesNotThrow(() => {
            var arrayPids = [{
                shipmentId: '124',
                pid: '1234'
            }];
            orderReturnDetails = new OrderReturnDetailsModel(node, arrayPids, true, '1234', []);
        });
        assert.isDefined(orderReturnDetails, 'orderReturnDetails is not defined');
        assert.isNotNull(orderReturnDetails, 'orderReturnDetails is null');
        assert.equal(orderReturnDetails.status, 'SHIPPED');
        assert.isFalse(orderReturnDetails.isEligibleForReturn);
        assert.isFalse(orderReturnDetails.isEligibleForExchange);
        assert.equal(orderReturnDetails.taxTotal, '$0');
        assert.equal(orderReturnDetails.subTotal, '$0');
        assert.equal(orderReturnDetails.orderTotal, '$0');
    });

});
