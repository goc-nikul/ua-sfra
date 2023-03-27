'use strict';

const {
    assert
} = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class Bytes {
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    toString() {
        return this.secretKey;
    }
}

class Cipher {
    encrypt(input) {
        return input;
    }
}

class Test {
    constructor(product) {
        this.product = product;
    }
}

var images = proxyquire('../../../../cartridges/app_ua_core/cartridge/models/product/decorators/images', {
    '~/cartridge/models/product/productImages': Test
});

var OrderUtils = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/OrderUtils', {
    'dw/crypto/Encoding': {
        toBase64: function(input) {
            return input;
        }
    },
    'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
    'dw/crypto/Cipher': Cipher,
    'dw/util/Bytes': Bytes,
    'int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds': {
        prepareURLForLocale: function(url, locale) {
            return url + '/' + locale;
        }
    },
    '*/cartridge/models/product/decorators/images': images
});

function Calendar() {
    this.toTimeString = () => '01/01/2022';
}

var OrderDetailsModel = proxyquire('../../../../cartridges/int_OIS/cartridge/models/OIS/orderDetails.js', {
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
            return {
                DELIVERED: 'DELIVERED'
            };
        },
        orderStatusMapping: () => {
            return {
                DELIVERED: 'DELIVERED'
            };
        },
        bopisStatusMapping: () => {
            return {
                Fulfilled: 'PICKED_UP'
            };
        }
    },
    'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
    'dw/util/Calendar': Calendar,
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    'dw/catalog/ProductMgr': {
        getProduct: () => {
            return {
                getPrimaryCategory: () => {
                    return {
                        ID: 'sale'
                    };
                }
            };
        }
    },
    '*/cartridge/scripts/helpers/storeHelpers': {
        getStoreGoogleMapLink: () => 'getStoreGoogleMapLink',
        findStoreById: () => {
            return {
                name: 'storeName',
                address1: 'address1',
                city: 'city',
                stateCode: 'stateCode',
                postalCode: '12345'
            };
        }
    },
    'app_ua_core/cartridge/scripts/util/OrderUtils' : OrderUtils
});

describe('int_OIS/cartridge/models/OIS/orderDetails.js', () => {

    it('Testing Model with args orderDetailsTemplate not exists', () => {
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
                            total: 100
                        }
                    },
                    quantity: 1
                },
                shippingMethod: 'GROUND',
                shipmentId: '124',
                storeId: null
            }],
            shippingAddress: {
                fullName: 'UA'
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
        var orderdetail;
        assert.doesNotThrow(() => {
            orderdetail = new OrderDetailsModel(node);
        });
        assert.isDefined(orderdetail, 'orderdetail is not defined');
        assert.isNotNull(orderdetail, 'orderdetail is null');
        assert.equal(orderdetail.currencyCode, 'USD');
        assert.equal(orderdetail.shippingMethod, 'GROUND');
        assert.equal(orderdetail.bopisItemQuantity, 0);
        assert.equal(orderdetail.shippingTotal, '$0');
        assert.equal(orderdetail.taxTotal, '$0');
        assert.equal(orderdetail.orderItems[0].name, 'product name');
        assert.equal(orderdetail.orderItems[0].ID, '1234');
    });

    it('Testing Model with args orderDetailsTemplate exists', () => {
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
                        assets: {
                            images: [{
                                url: 'productimageurl'
                            }]
                        },
                        color: {
                            colorway: 'black'
                        },
                        prices: {
                            tax: 10,
                            discount: 90,
                            base: 100
                        }
                    },
                    quantity: 1
                },
                shippingMethod: 'GROUND',
                shipmentId: '124',
                trackingLink: 'trackingLink'
            }],
            shippingAddress: {
                fullName: null,
                isBopis: true
            },
            fulfillmentGroups: [{
                fulfillmentStatus: 'DELIVERED',
                items: []
            }],
            status: 'DELIVERED',
            shipments: [{
                    dateDelivered: '01/01/2022',
                    shipmentId: '124',
                    trackingLink: '1234'
                },
                {
                    dateDelivered: '01/01/2022',
                    shipmentId: '125',
                    trackingLink: '1245'
                }
            ]
        };
        var orderdetail;
        assert.doesNotThrow(() => {
            orderdetail = new OrderDetailsModel(node, true);
        });
        assert.isDefined(orderdetail, 'orderdetail is not defined');
        assert.isNotNull(orderdetail, 'orderdetail is null');
        assert.equal(orderdetail.currencyCode, 'USD');
        assert.equal(orderdetail.shippingMethod, 'GROUND');
        assert.equal(orderdetail.bopisItemQuantity, 0);
        assert.equal(orderdetail.shippingTotal, '$0');
        assert.equal(orderdetail.taxTotal, '$0');
        assert.equal(orderdetail.orderItems[0].name, 'product name');
        assert.equal(orderdetail.orderItems[0].ID, 'UA');
    });

    it('Testing Model with args orderDetailsTemplate exists with fulfilment status CANCELLED', () => {
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
                        assets: {
                            images: [{
                                url: 'productimageurl'
                            }]
                        },
                        color: {
                            colorway: 'black'
                        },
                        prices: {
                            tax: 10,
                            discount: 90,
                            base: 100
                        }
                    },
                    quantity: 1
                },
                shippingMethod: 'GROUND',
                shipmentId: '124',
                trackingLink: 'trackingLink',
                fulfillmentStatus: 'CANCELED',
                storeId: 'store123'
            }, {
                productItem: {
                    product: {
                        upc: '1234',
                        sku: 'UA-1234-1234',
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
                            tax: 10,
                            discount: 90,
                            base: 100
                        }
                    },
                    quantity: 1
                },
                shippingMethod: 'GROUND',
                shipmentId: '124',
                fulfillmentStatus: 'CANCELED',
                storeId: null
            }],
            shippingAddress: {
                fullName: null,
                isBopis: true
            },
            fulfillmentGroups: [{
                fulfillmentStatus: 'CANCELED',
                items: []
            }],
            status: 'CANCELED',
            shipments: [{
                    dateDelivered: '01/01/2022',
                    shipmentId: '124'
                },
                {
                    dateDelivered: '01/01/2022',
                    shipmentId: '125'
                }
            ]
        };
        var orderdetail;
        assert.doesNotThrow(() => {
            orderdetail = new OrderDetailsModel(node, true);
        });
        assert.isDefined(orderdetail, 'orderdetail is not defined');
        assert.isNotNull(orderdetail, 'orderdetail is null');
        assert.equal(orderdetail.currencyCode, 'USD');
        assert.equal(orderdetail.shippingMethod, 'GROUND');
        assert.equal(orderdetail.bopisItemQuantity, 1);
        assert.equal(orderdetail.shippingTotal, '$0');
        assert.equal(orderdetail.taxTotal, '$0');
        assert.equal(orderdetail.orderItems[0].name, 'product name');
        assert.equal(orderdetail.orderItems[0].ID, 'UA');
    });

    it('Testing Model with args orderDetailsTemplate exists with fulfilment status CANCELLED and billing address and customer info exists', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            shippingTotal: '100',
            isCommercialPickup: true,
            paymentInstruments: [{
                paymentMethod: {
                    id: 'CREDIT_CARD'
                }
            }],
            orderItems: [{
                productItem: {
                    quantityExchanged: 1,
                    quantityReturned: 1,
                    product: {
                        upc: '1234',
                        sku: 'UA-1234-1234',
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
                            tax: 10,
                            discount: 90,
                            base: 100
                        }
                    },
                    quantity: 1
                },
                returnInfo: {
                    isEligibleForReturn: true,
                    ineligibilityReason: 'size',
                    exchangeItems: [{}]
                },
                lineItemNumber: '1234',
                shippingMethod: 'GROUND',
                shipmentId: '124',
                trackingLink: 'trackingLink',
                fulfillmentStatus: 'CANCELED',
                storeId: 'store123'
            }],
            shippingAddress: {
                fullName: null,
                isBopis: true,
                address1: 'storeaddress1'
            },
            billingAddress: {},
            customerInfo: {},
            fulfillmentGroups: [{
                fulfillmentStatus: 'CANCELED',
                items: []
            }],
            status: 'CANCELED',
            shipments: [{
                    dateDelivered: '01/01/2022',
                    shipmentId: '124'
                },
                {
                    dateDelivered: '01/01/2022',
                    shipmentId: '125'
                }
            ]
        };
        var orderdetail;
        assert.doesNotThrow(() => {
            orderdetail = new OrderDetailsModel(node, true);
        });
        assert.isDefined(orderdetail, 'orderdetail is not defined');
        assert.isNotNull(orderdetail, 'orderdetail is null');
        assert.equal(orderdetail.paymentMethod, 'CREDIT_CARD');
        assert.equal(orderdetail.pickUpStore, 'storeaddress1');
        assert.isTrue(orderdetail.isCommercialPickup);
        assert.equal(orderdetail.shippingTotalWithoutCurrency, '100');
        assert.isNotNull(orderdetail.billingAddress, 'billingAddress is null');
        assert.isNotNull(orderdetail.customerInfo, 'customerInfo is null');
        assert.equal(orderdetail.currencyCode, 'USD');
        assert.equal(orderdetail.shippingMethod, 'GROUND');
        assert.equal(orderdetail.bopisItemQuantity, 1);
        assert.equal(orderdetail.shippingTotal, '$100');
        assert.equal(orderdetail.taxTotal, '$0');
        assert.equal(orderdetail.orderItems[0].name, 'product name');
        assert.equal(orderdetail.orderItems[0].ID, 'UA');
    });

    it('Testing Model with args orderDetailsTemplate exists with fulfilment status SHIPPED and billing address and customer info exists', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            shippingTotal: '100',
            isCommercialPickup: true,
            paymentInstruments: [{
                paymentMethod: {
                    id: 'CREDIT_CARD'
                }
            }],
            orderItems: [{
                productItem: {
                    quantityExchanged: 1,
                    quantityReturned: 1,
                    product: {
                        upc: '1234',
                        sku: 'UA-1234-1234',
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
                            tax: 10,
                            discount: 90,
                            base: 100
                        }
                    },
                    quantity: 1
                },
                returnInfo: {
                    isEligibleForReturn: true,
                    ineligibilityReason: 'size',
                    exchangeItems: [{}]
                },
                lineItemNumber: '1234',
                shippingMethod: 'GROUND',
                shipmentId: '124',
                trackingLink: 'trackingLink',
                fulfillmentStatus: 'PARTIAL_SHIPPED',
                storeId: 'store123'
            }],
            shippingAddress: {
                fullName: null,
                isBopis: true,
                address1: 'storeaddress1'
            },
            billingAddress: {},
            customerInfo: {},
            fulfillmentGroups: [{
                fulfillmentStatus: 'PARTIAL_SHIPPED',
                items: []
            }],
            status: 'PARTIAL_SHIPPED',
            shipments: [{
                    dateDelivered: '01/01/2022',
                    shipmentId: '124'
                },
                {
                    dateDelivered: '01/01/2022',
                    shipmentId: '125'
                }
            ]
        };
        var orderdetail;
        assert.doesNotThrow(() => {
            orderdetail = new OrderDetailsModel(node, true);
        });
        assert.isDefined(orderdetail, 'orderdetail is not defined');
        assert.isNotNull(orderdetail, 'orderdetail is null');
        assert.equal(orderdetail.paymentMethod, 'CREDIT_CARD');
        assert.equal(orderdetail.pickUpStore, 'storeaddress1');
        assert.isTrue(orderdetail.isCommercialPickup);
        assert.equal(orderdetail.shippingTotalWithoutCurrency, '100');
        assert.isNotNull(orderdetail.billingAddress, 'billingAddress is null');
        assert.isNotNull(orderdetail.customerInfo, 'customerInfo is null');
        assert.equal(orderdetail.currencyCode, 'USD');
        assert.equal(orderdetail.shippingMethod, 'GROUND');
        assert.equal(orderdetail.bopisItemQuantity, 1);
        assert.equal(orderdetail.shippingTotal, '$100');
        assert.equal(orderdetail.taxTotal, '$0');
        assert.equal(orderdetail.orderItems[0].name, 'product name');
        assert.equal(orderdetail.orderItems[0].ID, 'UA');
    });

    it('Testing Model with args orderDetailsTemplate exists with fulfilment status DELIVERED and billing address and customer info exists', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            shippingTotal: '100',
            isCommercialPickup: true,
            paymentInstruments: [{
                paymentMethod: {
                    id: 'CREDIT_CARD'
                }
            }],
            orderItems: [{
                productItem: {
                    quantityExchanged: 1,
                    quantityReturned: 1,
                    product: {
                        upc: '1234',
                        sku: 'UA-1234-1234',
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
                            tax: 10,
                            discount: 90,
                            base: 100
                        }
                    },
                    quantity: 1
                },
                returnInfo: {
                    isEligibleForReturn: true,
                    ineligibilityReason: 'size',
                    exchangeItems: [{}]
                },
                lineItemNumber: '1234',
                shippingMethod: 'GROUND',
                shipmentId: '124',
                trackingLink: 'trackingLink',
                fulfillmentStatus: 'DELIVERED',
                storeId: 'store123'
            }],
            shippingAddress: {
                fullName: null,
                isBopis: true,
                address1: 'storeaddress1'
            },
            billingAddress: {},
            customerInfo: {},
            fulfillmentGroups: [{
                fulfillmentStatus: 'DELIVERED',
                items: []
            }],
            status: 'DELIVERED',
            shipments: [{
                    dateDelivered: '01/01/2022',
                    shipmentId: '124'
                },
                {
                    dateDelivered: '01/01/2022',
                    shipmentId: '125'
                }
            ]
        };
        var orderdetail;
        assert.doesNotThrow(() => {
            orderdetail = new OrderDetailsModel(node, true);
        });
        assert.isDefined(orderdetail, 'orderdetail is not defined');
        assert.isNotNull(orderdetail, 'orderdetail is null');
        assert.equal(orderdetail.paymentMethod, 'CREDIT_CARD');
        assert.equal(orderdetail.pickUpStore, 'storeaddress1');
        assert.isTrue(orderdetail.isCommercialPickup);
        assert.equal(orderdetail.shippingTotalWithoutCurrency, '100');
        assert.isNotNull(orderdetail.billingAddress, 'billingAddress is null');
        assert.isNotNull(orderdetail.customerInfo, 'customerInfo is null');
        assert.equal(orderdetail.currencyCode, 'USD');
        assert.equal(orderdetail.shippingMethod, 'GROUND');
        assert.equal(orderdetail.bopisItemQuantity, 1);
        assert.equal(orderdetail.shippingTotal, '$100');
        assert.equal(orderdetail.taxTotal, '$0');
        assert.equal(orderdetail.orderItems[0].name, 'product name');
        assert.equal(orderdetail.orderItems[0].ID, 'UA');
    });

    it('Testing Model with args orderDetailsTemplate exists with fulfilment status DELIVERED shipping is null, billing address and customer info exists', () => {
        var node = {
            currency: 'USD',
            orderNo: '100',
            shippingTotal: '100',
            isCommercialPickup: true,
            paymentInstruments: [{
                paymentMethod: {
                    id: 'CREDIT_CARD'
                }
            }],
            orderItems: [{
                productItem: {
                    quantityExchanged: 1,
                    quantityReturned: 1,
                    product: {
                        upc: '1234',
                        sku: 'UA-1234-1234',
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
                            tax: 10,
                            discount: 90,
                            base: 100
                        }
                    },
                    quantity: 1
                },
                returnInfo: {
                    isEligibleForReturn: true,
                    ineligibilityReason: 'size',
                    exchangeItems: [{}]
                },
                lineItemNumber: '1234',
                shippingMethod: 'GROUND',
                shipmentId: '124',
                trackingLink: 'trackingLink',
                fulfillmentStatus: 'DELIVERED',
                storeId: 'store123'
            }],
            shippingAddress: {
                fullName: null,
                isBopis: true,
                address1: 'storeaddress1'
            },
            billingAddress: {},
            customerInfo: {},
            fulfillmentGroups: [{
                fulfillmentStatus: 'DELIVERED',
                items: []
            }],
            status: 'DELIVERED',
            shipments: [{
                    dateDelivered: '01/01/2022',
                    shipmentId: '127'
                },
                {
                    dateDelivered: '01/01/2022',
                    shipmentId: '125'
                }
            ]
        };
        var orderdetail;
        assert.doesNotThrow(() => {
            orderdetail = new OrderDetailsModel(node, true);
        });
        assert.isDefined(orderdetail, 'orderdetail is not defined');
        assert.isNotNull(orderdetail, 'orderdetail is null');
        assert.equal(orderdetail.paymentMethod, 'CREDIT_CARD');
        assert.equal(orderdetail.pickUpStore, 'storeaddress1');
        assert.isTrue(orderdetail.isCommercialPickup);
        assert.equal(orderdetail.shippingTotalWithoutCurrency, '100');
        assert.isNotNull(orderdetail.billingAddress, 'billingAddress is null');
        assert.isNotNull(orderdetail.customerInfo, 'customerInfo is null');
        assert.equal(orderdetail.currencyCode, 'USD');
        assert.equal(orderdetail.shippingMethod, 'GROUND');
        assert.equal(orderdetail.bopisItemQuantity, 1);
        assert.equal(orderdetail.shippingTotal, '$100');
        assert.equal(orderdetail.taxTotal, '$0');
        assert.equal(orderdetail.orderItems[0].name, 'product name');
        assert.equal(orderdetail.orderItems[0].ID, 'UA');
    });

});
