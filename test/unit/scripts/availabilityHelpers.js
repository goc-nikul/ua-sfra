'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = (data) => {
    return !data;
};
var availabilityHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/availabilityHelpers.js', {
    'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
    '*/cartridge/config/preferences': {
        maxOrderQty: 10
    },
    '*/cartridge/scripts/renderTemplateHelper': {
        getRenderedHtml: () => true
    }
});

describe('availabilityHelper.js file test cases', function () {
    describe('updateItemsAvailability method test cases', function () {
        it('Test Case with all the inputs and current basket should not be null', () => {
            var currentBasket = {
                removeProductLineItem: function () {
                    return true
                },
            };
            var unavailableItem = {};
            var partiallyAvailableItem = {
                lineItem: {
                    setQuantityValue: function () {
                        return true
                    }
                }
            };
            var validatedProducts = {
                fullyRemoved: {
                    forEach: function (callback) {
                        callback(unavailableItem)
                    }
                },
                partiallyRemoved: {
                    forEach: function (callback) {
                        callback(partiallyAvailableItem)
                    }
                }
            }
            var result = availabilityHelper.updateItemsAvailability(currentBasket, validatedProducts);
            assert.isNotNull(result,'Result is Null');
        });
    });
    describe('getAvailabilityRenderTemplate method test cases', function () {
        it('should return defined value', () => {
            var inValidItems = {};
            var result = availabilityHelper.getAvailabilityRenderTemplate(inValidItems);
            assert.isDefined(result, 'result is not defined')
        });
    });
    describe('updateLineItemQuantityOption method test cases', function () {
        it('Test Case for maxOrderQty is null', () => {
            var availabilityHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/availabilityHelpers.js', {
                '*/cartridge/config/preferences': {
                    maxOrderQty: null
                }
            });
            var item = {
                UUID: 'test',
                quantityOptions: {
                    maxOrderQuantity : 10
                }
            };
            var lineItemQtyList = {};
            lineItemQtyList.test = JSON.stringify({});
            var cartModel = {
                items: [item]
            };
            var result = availabilityHelper.updateLineItemQuantityOption(lineItemQtyList, cartModel);
            assert.isNotNull(result,'Result is Null')
        });
        it('Test Case for UUID is null', () => {
            var item = {
                UUID: null,
                quantityOptions: {
                    maxOrderQuantity : 10
                }
            };
            var lineItemQtyList = {};
            lineItemQtyList.test = JSON.stringify({});
            var cartModel = {
                items: [item]
            };
            var result = availabilityHelper.updateLineItemQuantityOption(lineItemQtyList, cartModel);
            assert.isNotNull(result,'Result is Null')
        });
    });
    describe('getInvalidItems method test cases', function () {
        it('Test Case for fullyRemoved items are not null', () => {
            var fullyRemovedItem = {
                fromStoreId : true,
                id : 123
            };
            var item = {
                custom: {
                    fromStoreId : 890
                },
                id: true
            };
            var validatedProducts = {
                fullyRemoved : [fullyRemovedItem]
            };
            var cartModel = {
                items: [item],
                valid:{
                    error: true
                }
            };
           var result= availabilityHelper.getInvalidItems(cartModel, validatedProducts);
           assert.isNotNull(result,'result is null');
        });
        it('Test Case for fullyRemoved items are null', () => {
            var item = {
                custom: {
                    fromStoreId : 890
                },
                id: true
            };
            var validatedProducts = {
                fullyRemoved : null
            };
            var cartModel = {
                items: [item],
                valid:{
                    error: true
                }
            };
            var result= availabilityHelper.getInvalidItems(cartModel, validatedProducts);
            assert.isNotNull(result,'result is null');
        });
        it('Test Case for fromStoreId is null', () => {
            var fullyRemovedItem = false;
            var item = {
                custom: {
                    fromStoreId : null
                },
                id: null
            };
            var validatedProducts = {
                fullyRemoved : [fullyRemovedItem]
            };
            var cartModel = {
                items: [item],
                valid:{
                    error: true
                }
            };
            var result= availabilityHelper.getInvalidItems(cartModel, validatedProducts);
            assert.isNotNull(result,'result is null');
        });
        it('Test Case for fullyRemovedItem is not null', () => {
            var fullyRemovedItem = {
                fromStoreId: 123,
                id: 'abc'
             };
            var item = {
                custom: {
                    fromStoreId : 123
                },
                id: 'abc'
            };
            var validatedProducts = {
                fullyRemoved : [fullyRemovedItem]
            };
            var cartModel = {
                items: [item],
                valid:{
                    error: true
                }
            };
            var result= availabilityHelper.getInvalidItems(cartModel, validatedProducts);
            assert.isNotNull(result,'result is null');
        });
        it('Test Case for partiallyRemovedItem is not null', () => {
            var partiallyRemovedItem = {
                fromStoreId : 123,
                id : 123
            };
            var item = {
                custom: {
                    fromStoreId : 890
                },
                id: true
            };
            var validatedProducts = {
                partiallyRemoved : [partiallyRemovedItem]
            };
            var cartModel = {
                items: [item],
                valid:{
                    error: true
                }
            };
            var result= availabilityHelper.getInvalidItems(cartModel, validatedProducts);
            assert.isNotNull(result,'result is null');
        });

        it('Test Case for partiallyRemovedItem and fromStoreId is not null ', () => {
            var partiallyRemovedItem = {
                fromStoreId : 'abc',
                id : 123
            };
            var item = {
                custom: {
                    fromStoreId : 'abc'
                },
                id: 123
            };
            var validatedProducts = {
                partiallyRemoved : [partiallyRemovedItem]
            };
            var cartModel = {
                items: [item],
                valid:{
                    error: true
                }
            };
            var result= availabilityHelper.getInvalidItems(cartModel, validatedProducts);
            assert.isNotNull(result,'result is null');
        });
    });
});
