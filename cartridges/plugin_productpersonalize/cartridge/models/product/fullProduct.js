'use strict';

var base = module.superModule;

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 * @param {boolean} exchangeOrderItem - trigger custom hasOrderableVariants
 * @param {Object} exchangeVariationModel - exchange items variation model
 *
 * @returns {Object} - Decorated product model
 */
function fullProduct(product, apiProduct, options, exchangeOrderItem, exchangeVariationModel) {
    base.call(this, product, apiProduct, options, exchangeOrderItem, exchangeVariationModel);
    require('*/cartridge/models/product/decorators/index').productPersonlization(product, apiProduct);
    return product;
}

module.exports = fullProduct;
