'use strict';

var productLineItemBase = require('app_storefront_base/cartridge/models/productLineItem/productLineItem');
var productDecorators = require('*/cartridge/models/product/decorators/index');
var productLineItemDecorators = require('*/cartridge/models/productLineItem/decorators/index');

/**
 * Decorate product with product line item information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.lineItemOptions - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.currentOptionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productLineItem(product, apiProduct, options) {
    productLineItemBase.call(this, product, apiProduct, options);
    productDecorators.customAttributes(product, apiProduct);
    productLineItemDecorators.customAttributes(product.custom, options.lineItem);
    if (options.variationModel) {
        productDecorators.images(product, options.variationModel, { types: ['cartFullDesktop'], quantity: 'single' });
    } else {
        productDecorators.images(product, apiProduct, { types: ['cartFullDesktop'], quantity: 'single' });
    }
    const Site = require('dw/system/Site');
    if ('isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled')) {
        var fromStoreId = require('*/cartridge/models/productLineItem/decorators/fromStoreId');
        fromStoreId(product, options.lineItem);
    }
    var bfPriceTotal = require('*/cartridge/models/productLineItem/decorators/bfPriceTotal');
    bfPriceTotal(product, options.lineItem);
    productLineItemDecorators.isOnline(product, options.lineItem);
    return product;
};

