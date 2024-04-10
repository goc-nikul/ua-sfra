'use strict';
const sinon = require('sinon');
const assert = require('chai').assert;
var ArrayList = require('../../../mocks/dw/dw.util.Collection');
const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var productLineItemsStub = sinon.stub();
var createShipmentStub = sinon.stub();
var createProductLineItemStub = sinon.stub();

global.empty = (data) => {
    return !data;
};

class Product {
    constructor(productID) {
        this.master = false;
        this.ID = productID || '883814258849';
        this.name = 'test';
        this.image = {
            'small': {
                URL: 'testUrlSmall'
            },
            'medium': {
                URL: 'testUrlMedium'
            },
            'large': {
                URL: 'testUrlLarge'
            }
        };
        this.custom = {
            sku: '1330767-408-8',
            giftCard: {
                value: 'EGIFT_CARD'
            },
            customerLineItemQtyLimit: 5
        };
        this.optionModel = {};
        this.availabilityModel = {
            inventoryRecord: {
                perpetual: false,
                allocation: 10,
                ATS: {
                    value: 10
                },
                getATS() {
                    return {
                        value: 10,
                        getValue: function () {
                            return 10;
                        }
                    };
                },
                setAllocation: function (allocation) {
                    this.allocation = allocation;
                },
                getAllocation: function () {
                    return {
                        getValue: function () {
                            return 10;
                        }
                    };
                }
            }
        };
        this.isMaster = function () {
            return this.master;
        };
        this.getVariants = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: productID || '883814258849'
                }
            };
            return [variants];
        };
        this.getVariationModel = function () {
            var variants = {
                onlineFlag: true,
                availabilityModel: {
                    orderable: true
                },
                custom: {
                    color: '003'
                },
                masterProduct: {
                    ID: productID || '883814258849'
                },
                master: false
            };
            return {
                getDefaultVariant: function () {
                    return variants;
                }
            };
        };
        this.variationModel = {
            onlineFlag: true,
            availabilityModel: {
                orderable: true
            },
            custom: {
                color: '003'
            },
            masterProduct: {
                ID: productID || '883814258849'
            },
            master: false
        };
        this.raw = {
            custom: {
                outletColors: ''
            }
        };
    }

    getImage(size) {
        return this.image[size];
    }
}

class ProductMgr {
    static getProduct(productID) {
        this.product = new Product(productID);
        return this.product;
    }
    static setProduct(product) {
        this.product = product;
    }
}

global.req = {
    // eslint-disable-next-line spellcheck/spell-checker
    querystring: {
        uuid: 'ca155038d934befcd30f532e92',
        pid: '883814258849'
    }
};

global.request = {
    getLocale: function () {
        return {
            slice: function () {
                return {
                    toUpperCase: function () {
                        return 'US';
                    }
                };
            }
        };
    }
};

var Customer = require('../../../mocks/dw/dw_customer_Customer');
global.customer = new Customer();

global.session = {
    custom: {
        customerCountry: 'US'
    }

};

var emptyCartHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/cart/cartHelpers', {
    'app_storefront_base/cartridge/scripts/cart/cartHelpers': {
        getExistingProductLineItemInCart() {
            return null;
        },
        checkBundledProductCanBeAdded() {
            return true;
        },
        getExistingProductLineItemsInCart() {
            return [{
                custom: {
                    fromStoreId: '0520'
                },
                shipment: {
                    custom: {
                        fromStoreId: '0520'
                    }
                }
            }];
        }
    },
    '*/cartridge/scripts/helpers/productHelpers': {
        getCurrentOptionModel: function () {
            return {};
        }
    },
    'dw/util/UUIDUtils': require('../../../mocks/dw/dw_util_UUIDUtils'),
    '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
        getStoreInventory: () => 1,
        basketHasInStorePickUpShipment: () => true,
        getBopisShipment: () => {
            return {
                getShippingMethod: () => {
                    return {
                        ID: 'in-store'
                    };
                }
            };
        }
    },
    'dw/order/ShippingMgr': require('../../../mocks/dw/dw_order_ShippingMgr'),
    'dw/catalog/StoreMgr': {
        getStore: function () {
            return {
                name: 'store1',
                address1: 'storeAdd1',
                address2: 'storeAdd2',
                city: 'storeCity',
                stateCode: 'storestateCode',
                postalCode: 'storePostalCode',
                phone: 'storePhone',
                countryCode: {
                    value: 'US'
                }
            };
        }
    },
    'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
    'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
    'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    'int_mao/cartridge/scripts/availability/MAOAvailability': {
        getMaoAvailability: function () {
            return {};
        }
    },
    'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
        getSKUS: function () {
            return {};
        },
        isCheckPointEnabled: function () {
            return {};
        }
    },
    '*/cartridge/scripts/helpers/basketValidationHelpers': {
        getLineItemInventory: function () {
            return 11;
        }
    },
    '*/cartridge/scripts/checkout/checkoutHelpers': {
        ensureNoEmptyShipments: function () {
            return true;
        },
        giftCardCharactersValidations: function () {
            return {
                error: false
            };
        },
        updateShipToAsDefaultShipment: function () {
            return;
        },
        copyShippingAddressToShipment: () => true
    },
    '*/cartridge/scripts/helpers/storeHelpers': {
        getPreSelectedStoreCookie: () => {
            return {
                ID: '123',
                name: '123'
            };
        },
        findStoreById: () => {
            return {
                productInStoreInventory: true
            };
        },
        getProductAvailabilityOnStoreHours: () => {
            return {
                stores: [{
                    availabilityMessage: 'availabilityMessage'
                }]
            };
        }
    },
    '*/cartridge/scripts/utils/PreferencesUtil': require('../../../mocks/scripts/PreferencesUtil.js'),
    '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' },
    '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () { } },
    'dw/order/BasketMgr': {
        getCurrentBasket: () => {}
    },
    'app_ua_core/cartridge/scripts/cart/cartHelpers': {
        getExistingProductLineItemInCart: function () {
            return true;
        },
        hasPreOrderItems: function () {
            return false;
        }
    }
});

var cartHelpers = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/cart/cartHelpers', {
    'app_storefront_base/cartridge/scripts/cart/cartHelpers': {
        getExistingProductLineItemInCart() {
            return null;
        },
        checkBundledProductCanBeAdded() {
            return true;
        },
        getExistingProductLineItemsInCart() {
            return [{
                custom: {
                    fromStoreId: '0520'
                },
                shipment: {
                    custom: {
                        fromStoreId: '0520'
                    }
                }
            }];
        }
    },
    '*/cartridge/scripts/helpers/productHelpers': {
        getCurrentOptionModel: function () {
            return {};
        }
    },
    'dw/util/UUIDUtils': require('../../../mocks/dw/dw_util_UUIDUtils'),
    '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
        getStoreInventory: () => 1,
        basketHasInStorePickUpShipment: () => true,
        getBopisShipment: () => {
            return {
                getShippingMethod: () => {
                    return {
                        ID: 'in-store'
                    };
                }
            };
        }
    },
    'dw/order/ShippingMgr': require('../../../mocks/dw/dw_order_ShippingMgr'),
    'dw/catalog/StoreMgr': {
        getStore: function () {
            return {
                name: 'store1',
                address1: 'storeAdd1',
                address2: 'storeAdd2',
                city: 'storeCity',
                stateCode: 'storestateCode',
                postalCode: 'storePostalCode',
                phone: 'storePhone',
                countryCode: {
                    value: 'US'
                }
            };
        }
    },
    'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
    'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
    'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
    'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
    'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    'int_mao/cartridge/scripts/availability/MAOAvailability': {
        getMaoAvailability: function () {
            return {};
        }
    },
    'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
        getSKUS: function () {
            return {};
        },
        isCheckPointEnabled: function () {
            return {};
        }
    },
    '*/cartridge/scripts/helpers/basketValidationHelpers': {
        getLineItemInventory: function () {
            return 11;
        }
    },
    '*/cartridge/scripts/checkout/checkoutHelpers': {
        ensureNoEmptyShipments: function () {
            return true;
        },
        giftCardCharactersValidations: function () {
            return {
                error: false
            };
        },
        updateShipToAsDefaultShipment: function () {
            return;
        },
        copyShippingAddressToShipment: () => true
    },
    '*/cartridge/scripts/helpers/storeHelpers': {
        getPreSelectedStoreCookie: () => {
            return {
                ID: '123',
                name: '123'
            };
        },
        findStoreById: () => {
            return {
                productInStoreInventory: true
            };
        },
        getProductAvailabilityOnStoreHours: () => {
            return {
                stores: [{
                    availabilityMessage: 'availabilityMessage'
                }]
            };
        }
    },
    '*/cartridge/scripts/utils/PreferencesUtil': require('../../../mocks/scripts/PreferencesUtil.js'),
    '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' },
    '*/cartridge/scripts/helpers/basketCalculationHelpers': { calculateTotals: function () { } },
    'dw/order/BasketMgr': {
        getCurrentBasket: () => {
            return {
                getProductLineItems: () => productLineItemsStub,
                createShipment: () => createShipmentStub,
                createProductLineItem: () => createProductLineItemStub,
                getAllProductLineItems: function () {
                    return [
                        {
                            UUID: '9876543210',
                            productID: 'remove123',
                            custom: {
                                sku: '9876543210'
                            },
                            shipment: {
                                default: false,
                                custom: {
                                    fromStoreId: 'store1'
                                },
                                productLineItems: {
                                    empty: true
                                }
                            },
                            getProduct: function () {
                                return {
                                    custom: {
                                        bvAverageRating: 'bvAverageRating'
                                    },
                                    isVariant: function () {
                                        return true;
                                    },
                                    getID: function () {
                                        return {};
                                    },
                                    getUPC: function () {
                                        return {};
                                    },
                                    getMasterProduct: function () {
                                        return {
                                            getID: function () {
                                                return {};
                                            }
                                        };
                                    }
                                };
                            },
                            getpriceAdjustments: function () {
                                return new ArrayList([{
                                    promotion: {
                                        calloutMsg:'aaaa',
                                        basedOnSourceCodes: 'basedOnSourceCodesz',
                                        sourceCodeGroups: new ArrayList([
                                            {
                                                ID: 'ID'
                                            }
                                        ])
                                    },
                                    basedOnCoupon: false,
                                    price: {
                                        value: '1'
                                    }
                                }]);
                            },
                            getShipment: function () {
                                return {
                                    shippingStatus: 'SHIPPING_STATUS_NOTSHIPPED',
                                    custom: {
                                        paazlDeliveryInfo: false
                                    },
                                    shippingAddress: {
                                        firstName: 'David',
                                        lastName: 'Johnson',
                                        address1: '25 Quincy Rd.',
                                        address2: '',
                                        city: 'Boston',
                                        postalCode: '01234',
                                        countryCode: {
                                            value: 'us'
                                        },
                                        phone: '617-777-1010',
                                        stateCode: 'MA'
                                    },
                                    getID: function () {
                                        return 'aaaaa';
                                    }
                                };
                            },
                            getPrice: function () {
                                return {
                                    divide: function () {
                                        return {
                                            equals: function () {
                                                return false;
                                            }
                                        };
                                    },
                                    subtract: function () {
                                        return '1';
                                    }
                                };
                            },
                            getProratedPrice: function () {
                                return {
                                    divide: function () {
                                        return '1';
                                    },
                                    subtract: function () {
                                        return '1';
                                    }
                                };
                            },
                            getQuantityValue: () => 1,
                            getQuantity: function () {
                                return {
                                    getValue: function () {
                                        return {};
                                    }
                                };
                            },
                            getOrderItem: function () {
                                return {
                                    getItemID: function () {
                                        return {};
                                    }
                                };
                            }
                        }
                    ];
                },
                removeProductLineItem: function () {
                    return {};
                },
                removeShipment: function () {
                    return {};
                }
            };
        }
    },
    'app_ua_core/cartridge/scripts/cart/cartHelpers': {
        getExistingProductLineItemInCart: function () {
            return true;
        },
        hasPreOrderItems: function () {
            return false;
        }
    }
});

describe('int_loyalty/cartridge/scripts/cart/cartHelpers test', () => {
    it('Testing removeProductFromCart currentBasket Empty', function () {
        let productId = '1234';
        var emptyBasket = emptyCartHelpers.removeProductFromCart(productId);
        assert.isFalse(emptyBasket);
    });

    it('Testing removeProductFromCart ProductId Empty', function () {
        let productId = '';
        var emptyProductId = cartHelpers.removeProductFromCart(productId);
        assert.isFalse(emptyProductId);
    });

    it('Testing removeProductFromCart remove Item', function () {
        let productId = 'remove123';
        var emptyItem = cartHelpers.removeProductFromCart(productId);
        assert.isTrue(emptyItem);
    });
});
