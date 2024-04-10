'use strict';
const sinon = require('sinon');
const assert = require('chai').assert;
const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var productLineItemsStub = sinon.stub();
var createShipmentStub = sinon.stub();
var createProductLineItemStub = sinon.stub();

var currentBasket = {
    getProductLineItems: productLineItemsStub,
    createShipment: createShipmentStub,
    createProductLineItem: createProductLineItemStub
};

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

describe('app_ua_core/cartridge/scripts/cartHelpers test', () => {
    var cartHelpers = require('../../../mocks/scripts/cart/cartHelpers');
    it('Testing addLineItem: method', function () {
        var lineItemCtnr = new LineItemCtnr();
        var product = {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '883814258849',
            name: 'test'
        };
        var productLineItem = cartHelpers.addLineItem(lineItemCtnr, product, 2, [], {}, lineItemCtnr.getDefaultShipment(), false, '');
        assert.equal(2, productLineItem.quantity.value);
    });
    it('Testing addNewLineItem: method', function () {
        var lineItemCtnr = new LineItemCtnr();
        var product = {
            custom: {
                sku: '1330767-408-8',
                giftCard: {
                    value: 'NONE'
                }
            },
            ID: '883814258849',
            name: 'test'
        };
        var productLineItem = cartHelpers.addNewLineItem(lineItemCtnr, product, 5, [], {}, lineItemCtnr.defaultShipment, true, 'giftMessage');
        assert.equal('883814258849', productLineItem.product.ID);
        assert.equal(true, productLineItem.gift);
        assert.equal('giftMessage', productLineItem.giftMessage);
    });

    it('Testing addNewLineItem: method', function () {
        var lineItemCtnr = new LineItemCtnr();
        var list = [
            { items: [{ productID: '883814258849' }] }
        ];
        lineItemCtnr.createProductLineItem('883814258849', lineItemCtnr.defaultShipment);
        // eslint-disable-next-line spellcheck/spell-checker
        var expectedResult = { ca155038d934befcd30f532e92: true };
        var result = cartHelpers.isListItemExistInBasket(lineItemCtnr, list);
        assert.deepEqual(expectedResult, result);
    });

    it('Testing addProductToCart: method', function () {
        var lineItemCtnr = new LineItemCtnr();
        global.request.getLocale = function () {
            return 'en_US';
        };
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        cartHelpers.addProductToCart(lineItemCtnr, '883814258849', 1, [], {}, null, global.req, true, 'Happy New year');
        assert.equal(1, lineItemCtnr.getProductLineItems().length);
    });

    it('Testing addProductToCart method with non available product', function () {
        var lineItemCtnr = new LineItemCtnr();
        global.request.getLocale = function () {
            return 'en_US';
        };
        cartHelpers.addProductToCart(lineItemCtnr, '883814258849', 1000, [], {}, null, global.req, true, 'Happy New year');
        assert.equal(1, lineItemCtnr.getProductLineItems().length);
    });

    it('Testing addProductToCart method with missing isPickupItem and missing storeID vartiable in queryString ', function () {
        var lineItemCtnr = new LineItemCtnr();
        global.req.form = {}
        var result = cartHelpers.addProductToCart(lineItemCtnr, '883814258849', 1000, [], {}, null, global.req, true, 'Happy New year');
        assert.equal(false, result.error);
    });

    it('Testing addProductToCart method with isPickupItem and missing storeID vartiable in queryString ', function () {
        var lineItemCtnr = new LineItemCtnr();
        global.req.form = {
            isPickupItem : true
        }
        var result = cartHelpers.addProductToCart(lineItemCtnr, '883814258849', 1000, [], {}, null, global.req, true, 'Happy New year');
        assert.equal(false, result.error);
    });

    it('Testing addProductToCart method with isPickupItem and storeID vartiable in queryString ', function () {
        var lineItemCtnr = new LineItemCtnr();
        global.req.form = {
            isPickupItem : true
        }
        var result = cartHelpers.addProductToCart(lineItemCtnr, '883814258849', 1000, [], {}, '10011', global.req, true, 'Happy New year');
        assert.equal(false, result.error);
    });

    it('Testing getInventoryMessages: method', function () {
        var uuid = 'a676fd4366815425012af45074';
        var availableToSell = 0;
        var result = cartHelpers.getInventoryMessages(availableToSell, uuid);
        assert.equal(result.error, true);

        availableToSell = 1;
        result = cartHelpers.getInventoryMessages(availableToSell, uuid);
        assert.equal(result.error, false);
    });

    it('Testing removePLItem: method', function () {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem('883814258849', lineItemCtnr.defaultShipment);
        lineItemCtnr.createBonusLineItem('883814258849', lineItemCtnr.defaultShipment);
        var req = {
            querystring: {
                pid: '883814258849',
                uuid: 'ca155038d934befcd30f532e92'
            }
        };
        var bonusProductsUUIDs = [];
        cartHelpers.removePLItem(req, lineItemCtnr, bonusProductsUUIDs);
        assert.equal(bonusProductsUUIDs.length > 0, true);
    });

    it('Testing isListItemExistInBasket: method', function () {
        var lineItemCtnr = new LineItemCtnr();
        lineItemCtnr.createProductLineItem('883814258849', lineItemCtnr.defaultShipment);
        var list = [];
        var items = [];
        items.push({ productID: '883814258849' });
        list.push({
            items: items
        });
        var result = cartHelpers.isListItemExistInBasket(lineItemCtnr, list);
        assert.equal(result[lineItemCtnr.productLineItems[0].UUID], true);
    });

    it('Testing method: getQtyAlreadyInCart for Non bundled product', function () {
        var TEST_QUANTITY_VALUE = 2;
        var lineItems = [{
            custom: {
                fromStoreId: 'store123'
            },
            bundledProductLineItems: [],
            productID: '1223',
            UUID: 'uuid_2',
            quantityValue: TEST_QUANTITY_VALUE
        }];
        var qty = cartHelpers.getQtyAlreadyInCart('1223', lineItems, 'uuid', 'store123');
        assert.equal(qty, TEST_QUANTITY_VALUE);
    });

    it('Testing method: getQtyAlreadyInCart for bundled product', function () {
        var TEST_QUANTITY_VALUE = 2;
        var lineItems = [{
            custom: {},
            product: {
                ID: '1223'
            },
            bundledProductLineItems: [
                {
                    productID: '1223',
                    quantityValue: 2,
                    UUID: 'uuid_1'
                }
            ],
            productID: '1223',
            UUID: 'uuid_2',
            quantityValue: TEST_QUANTITY_VALUE
        }];
        var qty = cartHelpers.getQtyAlreadyInCart('1223', lineItems, 'uuid');
        assert.equal(qty, TEST_QUANTITY_VALUE);
    });

    it('Testing method: getCartInventoryMessages with ATS 0', function () {
        var result = cartHelpers.getCartInventoryMessages(0);
        assert.isTrue(result.error);
        assert.equal(result.messages[0], 'testMsg');
    });

    it('Testing method: getCartInventoryMessages with ATS lesser than request QTY', function () {
        var result = cartHelpers.getCartInventoryMessages(1, 'uuid', 2);
        assert.isTrue(result.error);
        assert.equal(result.messages[0], 'testMsgf');
    });

    it('Testing method: removeCouponLineItems removes coupons for employees (except loyalty coupons)', function () {
        var spy = sinon.spy();
        var basket = {
            removeCouponLineItem: spy,
            couponLineItems: [{ couponCode: 'TEST-1234-1234' }, { couponCode: 'TEST-4562-0000' }, { couponCode: 'LYLD-4562-0000' }]
        };
        cartHelpers.removeCouponLineItems(basket, true);
        assert(spy.withArgs(basket.couponLineItems[0]).calledOnce);
        assert(spy.withArgs(basket.couponLineItems[1]).calledOnce);
        assert(spy.withArgs(basket.couponLineItems[2]).notCalled);
    });

    it('Testing method: removeCouponLineItems removes all coupons for VIPs', function () {
        var spy = sinon.spy();
        var basket = {
            removeCouponLineItem: spy,
            couponLineItems: [{ couponCode: 'TEST-1234-1234' }, { couponCode: 'TEST-4562-0000' }, { couponCode: 'LYLD-4562-0000' }]
        };
        cartHelpers.removeCouponLineItems(basket, false, true);
        assert(spy.withArgs(basket.couponLineItems[0]).calledOnce);
        assert(spy.withArgs(basket.couponLineItems[1]).calledOnce);
        assert(spy.withArgs(basket.couponLineItems[2]).calledOnce);
    });

    it('Testing method: hasPreOrderItems', function () {
        productLineItemsStub.returns([{
            product: {
                custom: {
                    isPreOrder: true
                },
                getVariationModel: () => {
                    return {
                        getMaster: () => {
                            return {
                                ID: 'pvm123',
                                custom: {
                                    isPreOrder: true
                                }
                            };
                        }
                    };
                }
            }
        }]);
        var hasPreOrder = cartHelpers.hasPreOrderItems(currentBasket);
        assert.isTrue(hasPreOrder);
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: getLimitedWishlistItems', function () {
        var limitedWishlistItems = cartHelpers.getLimitedWishlistItems(['wishlist1', 'wishlist2', 'wishlist3'], 2);
        assert.equal(limitedWishlistItems.length, 2);
        assert.equal(limitedWishlistItems[0], 'wishlist1');
        assert.equal(limitedWishlistItems[1], 'wishlist2');
    });

    it('Testing method: mergeLineItems', function () {
        productLineItemsStub.returns([
            {
                product: {
                    custom: {},
                    productID: '1234'
                },
                shipment: {
                    ID: 'me'
                },
                setQuantityValue: () => true
            }
        ]);
        assert.doesNotThrow(() => cartHelpers.mergeLineItems(currentBasket));
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: mergeLineItems handle errors', function () {
        productLineItemsStub.returns([
            {
                product: null,
                shipment: {
                    ID: 'me'
                },
                setQuantityValue: () => true
            }
        ]);
        assert.doesNotThrow(function () {
            cartHelpers.mergeLineItems(currentBasket);
        });
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: moveItemFromBopisShipment', function () {
        currentBasket.shipments = [{
            default: true,
            custom: {}
        }];
        var pli = {
            setShipment: () => true,
            custom: {},
            shipment: {
                custom: {}
            },
            product: {
                isMaster: () => false,
                custom: {
                    sku: 'sku'
                },
                availabilityModel: {
                    inventoryRecord: {
                        ATS: {
                            available: true,
                            value: 100
                        }
                    }
                }
            }
        };
        var moveToShipping = cartHelpers.moveItemFromBopisShipment(currentBasket, pli);
        assert.isTrue(moveToShipping.movedToShipping);
    });

    it('Testing method: splitItemFromBopisShipment with same product in cart', function () {
        currentBasket.shipments = [{
            default: true,
            custom: {}
        }];
        productLineItemsStub.returns([{
            product: {
                ID: '1234'
            },
            shipment: {
                custom: {
                    fromStoreId: null
                }
            },
            quantity: {
                value: 1
            },
            setQuantityValue: () => true
        }]);
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        var pli = {
            productID: '1234',
            quantityValue: 1,
            custom: {
                instoreAvailability: '',
                storeInventory: ''
            },
            product: {
                isMaster: () => false,
                custom: {
                    qtyLimitType: ''
                },
                availabilityModel: {
                    inventoryRecord: {
                        ATS: {
                            available: true,
                            value: 100
                        }
                    }
                }
            },
            setQuantityValue: () => true
        };
        var bopisShipment = cartHelpers.splitItemFromBopisShipment(currentBasket, pli, 0);
        assert.isTrue(bopisShipment.partiallyMovedToShipping);
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: splitItemFromBopisShipment with not same product in cart', function () {
        currentBasket.shipments = [{
            default: true,
            custom: {}
        }];
        productLineItemsStub.returns([{
            product: {
                ID: '1234'
            },
            shipment: {
                custom: {
                    fromStoreId: null
                }
            },
            quantity: {
                value: 1
            },
            setQuantityValue: () => true
        }]);
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        var pli = {
            productID: '12345',
            quantityValue: 1,
            custom: {
                instoreAvailability: '',
                storeInventory: ''
            },
            product: {
                isMaster: () => false,
                custom: {
                    qtyLimitType: ''
                },
                availabilityModel: {
                    inventoryRecord: {
                        ATS: {
                            available: true,
                            value: 100
                        }
                    }
                }
            },
            setQuantityValue: () => true
        };
        createShipmentStub.returns({
            setShippingMethod: () => true
        });
        createProductLineItemStub.returns({
            setQuantityValue: () => true,
            product: {
                custom: {
                    sku: '12234'
                }
            },
            custom: {
                sku: '12234'
            }
        });
        var bopisShipment = cartHelpers.splitItemFromBopisShipment(currentBasket, pli, 0);
        assert.isTrue(bopisShipment.partiallyMovedToShipping);
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: bopisLineItemInventory within instore inventory', function () {
        currentBasket.shipments = [{
            default: true,
            productLineItems: [{
                setShipment: () => true
            }],
            custom: {
                fromStoreId: 'store123'
            },
            setShippingMethod: () => true,
            createShippingAddress: () => true

        }, {
            default: false,
            productLineItems: [{
                setShipment: () => true
            }],
            custom: {
                fromStoreId: 'store1'
            },
            setShippingMethod: () => true,
            createShippingAddress: () => true,
            shippingAddress: {
                firstName: '',
                lastName: '',
                address1: '',
                address2: '',
                city: '',
                stateCode: '',
                postalCode: '',
                countryCode: '',
                phone: ''
            }
        }];
        productLineItemsStub.returns([{
            product: {
                ID: '1234',
                custom: {
                    availableForInStorePickup: false
                }
            },
            shipment: {
                custom: {
                    fromStoreId: 'store123'
                }
            },
            custom: {
                instoreAvailability: ''
            },
            quantityValue: 1,
            setQuantityValue: () => true
        }]);
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        var bopisInventory = cartHelpers.bopisLineItemInventory(currentBasket);
        // assert.isTrue(bopisInventory.basketHasStores);
        assert.equal(bopisInventory.ID, 'store123');
        assert.equal(bopisInventory.name, 'store1');
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: bopisLineItemInventory after instore inventory', function () {
        currentBasket.shipments = [{
            default: true,
            custom: {
                fromStoreId: 'store123'
            }
        }];
        productLineItemsStub.returns([{
            product: {
                ID: '1234',
                custom: {
                    availableForInStorePickup: false
                }
            },
            shipment: {
                custom: {
                    fromStoreId: 'store123'
                }
            },
            custom: {
                instoreAvailability: ''
            },
            quantityValue: 1000,
            setQuantityValue: () => true
        }]);
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        var bopisInventory = cartHelpers.bopisLineItemInventory(currentBasket);
        // assert.isTrue(bopisInventory.basketHasStores);
        assert.equal(bopisInventory.ID, 'store123');
        assert.equal(bopisInventory.name, 'store1');
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: defaultShipToAddressIfAny with empty shipments', function () {
        currentBasket.shipments = [{
            default: true,
            productLineItems: [],
            custom: {
                fromStoreId: null
            },
            setShippingMethod: () => true
        }, {
            default: false,
            productLineItems: [{
                setShipment: () => true
            }],
            custom: {
                fromStoreId: 'store1'
            },
            shippingAddress: {
                firstName: '',
                lastName: '',
                address1: '',
                address2: '',
                city: '',
                stateCode: '',
                postalCode: '',
                countryCode: '',
                phone: ''
            }
        }];
        productLineItemsStub.returns([]);
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        assert.doesNotThrow(() => cartHelpers.defaultShipToAddressIfAny(currentBasket));
        productLineItemsStub.resetBehavior();
    });

    it('Testing method: ensureShippingAddressforStore', function () {
        currentBasket.shipments = [{
            shippingAddress: null,
            custom: {
                fromStoreId: 'store123'
            },
            setShippingMethod: () => true
        }];
        currentBasket.defaultShipment = {
            shippingMethod: 'me'
        };
        assert.doesNotThrow(() => cartHelpers.ensureShippingAddressforStore(currentBasket));
    });

    it('Testing method: basketHasBOPISShipmet', function () {
        currentBasket.shipments = [{
            shippingAddress: null,
            custom: {
                fromStoreId: 'store123',
                shipmentType: 'in-store'
            },
            setShippingMethod: () => true
        }];
        assert.isTrue(cartHelpers.basketHasBOPISShipmet(currentBasket));
    });

    it('Testing method: isBorderFreeUser', function () {
        var req = {
            geolocation: {
                countryCode: 'CA'
            },
            querystring: {
                country: 'CA'
            }
        };
        assert.isTrue(cartHelpers.isBorderFreeUser(req));
    });

    it('Testing method: ensureBOPISShipment', function () {
        assert.doesNotThrow(() => cartHelpers.ensureBOPISShipment(currentBasket));
    });

    xit('Testing bopisLineItemInventory: method with prepatual', function () {
        var cartHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/cart/cartHelpers', {
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
            '*/cartridge/scripts/util/array': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
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
            'dw/order/ShippingMgr': require('../../mocks/dw/dw_order_ShippingMgr'),
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
            }
        });

        currentBasket.shipments = [{
            default: true,
            custom: {
                fromStoreId: 'store123'
            }
        }];
        productLineItemsStub.returns([{
            product: {
                ID: '1234',
                custom: {
                    availableForInStorePickup: true,
                    sku: '123'
                }
            },
            shipment: {
                custom: {
                    fromStoreId: 'store123'
                }
            },
            custom: {
                instoreAvailability: ''
            },
            quantityValue: 1000,
            setQuantityValue: () => true
        }]);
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        var bopisInventory = cartHelpers.bopisLineItemInventory(currentBasket);
        assert.isTrue(bopisInventory.basketHasStores);
    });

    it('Testing addProductToCart: method with not prepatual', function () {
        var cartHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/cart/cartHelpers', {
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
            '*/cartridge/scripts/util/array': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
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
            'dw/catalog/ProductMgr': ProductMgr,
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
                    return 0;
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
            }
        });

        var lineItemCtnr = new LineItemCtnr();
        global.request.getLocale = function () {
            return 'en_US';
        };
        currentBasket.productLineItems = currentBasket.getProductLineItems();
        cartHelpers.addProductToCart(lineItemCtnr, '883814258849', 1, [], {}, null, global.req, true, 'Happy New year', false);
        assert.equal(0, lineItemCtnr.getProductLineItems().length);
    });

    it('Testing addProductToCart: method with not perpetual ', function () {
        var cartHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/cart/cartHelpers', {
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
            '*/cartridge/scripts/util/array': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
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
            'dw/catalog/ProductMgr': ProductMgr,
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
            }
        });

        var lineItemCtnr = new LineItemCtnr();
        global.request.getLocale = function () {
            return 'en_US';
        };
        global.req = {
            // eslint-disable-next-line spellcheck/spell-checker
            querystring: {
                uuid: 'ca155038d934befcd30f532e92',
                pid: '883814258849'
            },
            form: {
                eGiftCardData: "\"{'gcRecipientName':'AmoghMedegar','gcRecipientEmail':'amedhegar@pfsweb.com','gcFrom':'Yesh','gcAmount':100,'gcDeliveryDate':'2020-05-05','gcMessage':'Happynewyear'}\""
            }
        };
        cartHelpers.addProductToCart(lineItemCtnr, '883814258849', 1, [], {}, null, global.req, true, 'Happy New year', false);
        assert.equal(1, lineItemCtnr.getProductLineItems().length);
    });
    it('Testing method: setBasketPurchaseSite', function () {
        var cartHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/cart/cartHelpers', {
            'app_storefront_base/cartridge/scripts/cart/cartHelpers': {},
            '*/cartridge/scripts/util/array': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            '*/cartridge/scripts/helpers/productHelpers': {},
            'dw/catalog/StoreMgr': {},
            '*/cartridge/scripts/checkout/checkoutHelpers': {},
            '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {},
            'dw/catalog/ProductMgr': require('../../../mocks/dw/dw_catalog_ProductMgr'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/util/UUIDUtils': require('../../../mocks/dw/dw_util_UUIDUtils'),
            'dw/order/ShippingMgr': require('../../../mocks/dw/dw_order_ShippingMgr'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getID: function () {
                            return 'US';
                        }
                    };
                }
            }
        });
        currentBasket = {
            custom: {
                purchaseSite: 'US'
            }
        };

        cartHelpers.setBasketPurchaseSite(currentBasket);
    });

    it('Testing method: removeStoreInfoFromBasket', function () {
        var currentBasket = new LineItemCtnr();
        cartHelpers.removeStoreInfoFromBasket(currentBasket);
        assert.isUndefined(currentBasket.shipments.get(0).custom.fromStoreId, 'fromStoreId was not removed from shipment');
        assert.isUndefined(currentBasket.shipments.get(0).custom.shipmentType, 'shipmentType was not removed from shipment');
    });
});
