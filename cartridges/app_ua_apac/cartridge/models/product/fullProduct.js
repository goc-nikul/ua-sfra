'use strict';

var base = module.superModule;
var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with full product information
 *
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @param {boolean} exchangeOrderItem - trigger custom hasOrderableVariants
 * @param {Object} exchangeVariationModel - exchange items variation model
 * @returns {Object} - Decorated product model
 */
function fullProduct(product, apiProduct, options, exchangeOrderItem, exchangeVariationModel) {
    base.call(this, product, apiProduct, options, exchangeOrderItem, exchangeVariationModel);
    decorators.memberPricing(product, apiProduct);
    return product;
}

module.exports = fullProduct;
