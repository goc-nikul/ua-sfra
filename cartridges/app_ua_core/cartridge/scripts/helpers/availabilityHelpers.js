/* eslint-disable no-param-reassign */
'use strict';

var preferences = require('*/cartridge/config/preferences');
var DEFAULT_MAX_ORDER_QUANTITY = preferences.maxOrderQty || 10;

/**
 * Returns the array of lineItems objects which are partially not available and fully unAvailable
 * @param {Object} cartModel - The current user's basket cartModel object
 * @param {Object} validatedProducts - Validation status object return by basketValidation helper
 * @returns {Object} - An object holds array of unavailable and partially available products
 */
function getInvalidItems(cartModel, validatedProducts) {
    var fullyRemovedItems = [];
    var partiallyRemovedItems = [];
    // Filter out all the unavailable items which needs to be removed from the basket
    if (validatedProducts.fullyRemoved) {
        validatedProducts.fullyRemoved.forEach(function (fullyRemovedItem) {
            var dataArray = cartModel.items.filter(function (item) {
                let removedItemStoreId = fullyRemovedItem && 'fromStoreId' in fullyRemovedItem ? fullyRemovedItem.fromStoreId : null;
                let itemFromStoreID = 'fromStoreId' in item.custom && item.custom.fromStoreId ? item.custom.fromStoreId : null;
                if (fullyRemovedItem.id === item.id && removedItemStoreId === itemFromStoreID) {
                    item.availabilityError = true;
                    item.isPartiallyAvailable = false;
                    item.removedQuantity = item.quantity;
                    item.instockQuantity = 0;
                    return item;
                }
                return null;
            });
            fullyRemovedItems.push.apply(fullyRemovedItems, dataArray);
        });
        cartModel.valid.error = true;
    }
    // Filter out all the items which are partially not available
    if (validatedProducts.partiallyRemoved) {
        validatedProducts.partiallyRemoved.forEach(function (partiallyRemovedItem) {
            var dataArray = cartModel.items.filter(function (item) {
                let removedItemStoreId = partiallyRemovedItem && 'fromStoreId' in partiallyRemovedItem ? partiallyRemovedItem.fromStoreId : null;
                let itemFromStoreID = 'fromStoreId' in item.custom && item.custom.fromStoreId ? item.custom.fromStoreId : null;
                if (partiallyRemovedItem.id === item.id && removedItemStoreId === itemFromStoreID) {
                    // eslint-disable-next-line no-param-reassign
                    item.availabilityError = true;
                    item.isPartiallyAvailable = true;
                    // Quantity to be removed from the basket because of availability
                    item.removedQuantity = Number(item.quantity) - Number(partiallyRemovedItem.quantity);
                    item.instockQuantity = Number(partiallyRemovedItem.quantity);
                    return item;
                }
                return null;
            });
            partiallyRemovedItems.push.apply(partiallyRemovedItems, dataArray);
        });
        cartModel.valid.error = true;
    }
    return {
        fullyRemovedItems: fullyRemovedItems,
        partiallyRemovedItems: partiallyRemovedItems
    };
}

/**
 * This method will update the line item quantity option
 * @param {Object} lineItemQtyList - lineItemQtyList
 * @param {Object} cartModel - cartModel
 */
function updateLineItemQuantityOption(lineItemQtyList, cartModel) {
    cartModel.items.forEach(function (item) {
        if (lineItemQtyList[item.UUID]) {
            var lineItemQtyObject = JSON.parse(lineItemQtyList[item.UUID]);
            var availableToSell = lineItemQtyObject.lineItemQtyLimit;
            var maxOrderQuantity = Math.max(Math.min(availableToSell, DEFAULT_MAX_ORDER_QUANTITY), lineItemQtyObject.quantity);
            item.quantityOptions.maxOrderQuantity = maxOrderQuantity;
        }
    });
}

/**
 * Returns the rendering template with cart adjustment info
 * @param {Object} inValidItems - Validation status object return by basketValidation helper
 * @returns {string} renderedTemplate - html render response
 */
function getAvailabilityRenderTemplate(inValidItems) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var template = 'checkout/availability.isml';
    var renderedTemplate = renderTemplateHelper.getRenderedHtml(inValidItems, template);
    return renderedTemplate;
}

/**
 * Removes the unavailable items from the basket
 * @param {dw.order.Basket} currentBasket - The current user's basket
 * @param {Object} validatedProducts - Items which are not having inventory
 */
function updateItemsAvailability(currentBasket, validatedProducts) {
    var Transaction = require('dw/system/Transaction');
    validatedProducts.fullyRemoved.forEach(function (unavailableItem) {
        Transaction.wrap(function () {
            currentBasket.removeProductLineItem(unavailableItem.lineItem);
        });
    });

    validatedProducts.partiallyRemoved.forEach(function (partiallyAvailableItem) {
        Transaction.wrap(function () {
            partiallyAvailableItem.lineItem.setQuantityValue(partiallyAvailableItem.quantity);
        });
    });
}

module.exports = {
    getAvailabilityRenderTemplate: getAvailabilityRenderTemplate,
    getInvalidItems: getInvalidItems,
    updateItemsAvailability: updateItemsAvailability,
    updateLineItemQuantityOption: updateLineItemQuantityOption
};
