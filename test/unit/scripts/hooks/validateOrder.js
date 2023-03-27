'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
var checkoutHelpers = require('../../../../cartridges/storefront-reference-architecture/test/mocks/helpers/checkoutHelpers');

var productLineItems1 = new ArrayList([{
    product: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);

var productLineItems2 = new ArrayList([{
    product: {
        online: false,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);

var productLineItems3 = new ArrayList([{
    product: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {
        fromStoreId: new ArrayList([{}])
    },
    productID: 'someID',
    quantityValue: 2
}]);

var lineItemContainer = {
    totalTax: {
        available: false
    },
    merchandizeTotalPrice: {
        available: true
    },
    productLineItems: productLineItems1,
    couponLineItems: new ArrayList([{
        valid: true
    }]),
    shippingMethod: {
        custom: {
            storePickupEnabled : false
        }
    }
};

describe('validate order', function () {
    var validateOrderHook = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/hooks/validateOrder.js', {
        'dw/web/Resource': {
            msg: function (param) {
                return param;
            }
        },
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
        '*/cartridge/scripts/helpers/basketValidationHelpers': proxyquire('../../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/basketValidationHelpers', {
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {
                        getRecord: function () {
                            return {
                                ATS: {
                                    value: 3
                                }
                            };
                        }
                    };
                }
            },
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            'dw/catalog/StoreMgr': {
                getStore: function () {
                    return {
                        custom: {
                            inventoryListId: 'someID'
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': checkoutHelpers
        })
    });

    it('should validate a valid basket', function () {
        lineItemContainer.shipments = false; // new ArrayList([{ shippingAddress: { address1: 'some street' } }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
    });

    it('should invalidate a null basket', function () {
        var result = validateOrderHook.validateOrder(null, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.cart.expired');
    });

    it('should invalidate a basket without total tax', function () {
        var result = validateOrderHook.validateOrder(lineItemContainer, true);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.invalid.tax');
    });

    it('should invalidate a basket with merchandize Total Price not available', function () {
        lineItemContainer.merchandizeTotalPrice.available = false;
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.cart.or.checkout.error');
        lineItemContainer.merchandizeTotalPrice.available = true;
    });

    it('should invalidate a basket when product not online', function () {
        lineItemContainer.productLineItems = productLineItems2;
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
        lineItemContainer.productLineItems = productLineItems1;
    });

    it('should validate a basket when product has inStore inventory', function () {
        lineItemContainer.productLineItems = productLineItems3;
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
        lineItemContainer.productLineItems = productLineItems1;
    });

    
    it('should invalidate a basket with incomplete shipping address', function () {
        lineItemContainer.shipments = new ArrayList([{ shippingAddress: { address1: 'some street' } }]);
        lineItemContainer.productLineItems = {
            getLength() {
                return '0';
            }
        };
        var result = validateOrderHook.validateOrder(null, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.cart.expired');
    });

    it('should invalidate a basket with invalid coupons', function () {
        lineItemContainer.couponLineItems = new ArrayList([{ valid: false }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.invalid.coupon');
        lineItemContainer.couponLineItems = new ArrayList([{ valid: true }]);
    });

    it('should invalidate a basket with no productLineItems', function () {
        lineItemContainer.productLineItems = new ArrayList([]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.productlineitem');
        lineItemContainer.productLineItems = productLineItems1;
    });

    it('should invalidate a basket with incomplete shipping address', function () {
        lineItemContainer.shipments = new ArrayList([{ shippingAddress: {} }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
    });

    it('should invalidate a basket with incomplete shipping address', function () {
        lineItemContainer.shipments = new ArrayList([{ shippingMethod: {
            custom: {
                storePickupEnabled: true
            }
        } }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
    });

    it('should invalidate a basket with incomplete shipping address', function () {
        lineItemContainer.shipments = new ArrayList([{ custom: {
            fromStoreId: 'Store123'
     } }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
    });

    it('should invalidate a basket with incomplete shipping address', function () {
        lineItemContainer.shipments = false;
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
    });

});
