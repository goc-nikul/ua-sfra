'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var ProductFactory = require('*/cartridge/scripts/factories/product');

/**
 * Exchange product info
 * @param {Object} exchangeItemSKU - The exchange product SKU
 * @param {Object} exchangeItems - exchange items variation model
 * @return {Object} Return orders exchange item
 */
function getExchangeProduct(exchangeItemSKU, exchangeItems) {
    var exchangeItemObj = exchangeItemSKU;
    var exchangeProductID = exchangeItemObj.split('-')[0];
    var exchangeProductColor = exchangeItemObj.split('-')[1];
    var exchangeProductSize = exchangeItemObj.split('-')[2];

    var product = ProductMgr.getProduct(exchangeProductID);
    if (!product) return {};
    if (product.isMaster()) {
        for (var i = 0; i < product.variants.length; i++) {
            var variant = product.variants[i];
            if (variant && variant.custom && variant.custom.color && variant.custom.color === exchangeProductColor && variant.custom.size && variant.custom.size === exchangeProductSize) {
                product = variant;
                break;
            }
        }
    }
    var selectedOptions = null;
    var requestQuantity = 1;
    var pliProduct = {
        pid: product.ID,
        quantity: requestQuantity,
        options: selectedOptions,
        exchangeItem: 'true',
        exchangeVariationModel: exchangeItems
    };
    var productObj = ProductFactory.get(pliProduct);

    return productObj;
}

/**
 * Exchange product info
 * @param {Object} exchangeItems - The list exchange products
 * @param {number} quantity - item quantity
 * @param {string} exchangeProductsArrayString - exchange products string array
 * @return {Object} Return orders exchange item array
 */
function getExchangeProductHits(exchangeItems, quantity, exchangeProductsArrayString) {
    var items = [];
    var exchangeProductID = exchangeItems[0].productId;
    var product = ProductMgr.getProduct(exchangeProductID);

    if (product) {
        var selectedOptions = null;
        var requestQuantity = quantity;
        var pliProduct = {
            pid: product.ID,
            quantity: requestQuantity,
            options: selectedOptions,
            exchangeItem: 'true',
            exchangeVariationModel: exchangeProductsArrayString
        };
        var productObj = ProductFactory.get(pliProduct);

        items.push(productObj);
    }

    return items;
}
/**
 * The first exchange product
 * @param {Object} exchangeItems - The list exchange products
 * @return {Object} Return list of products string
 */
function getExchangeProductList(exchangeItems) {
    var items = exchangeItems.map(function (item) {
        return item.productId;
    });

    return items.length === 0 ? '' : items.toString();
}

module.exports = {
    getExchangeProduct: getExchangeProduct,
    getExchangeProductList: getExchangeProductList,
    getExchangeProductHits: getExchangeProductHits
};
