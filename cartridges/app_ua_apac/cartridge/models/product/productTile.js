'use strict';

var base = module.superModule;
var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(
    product,
    apiProduct,
    productType,
    options
) {
    decorators.memberPricing(product, apiProduct);
    base.call(this, product, apiProduct, productType, options);
    return product;
};
