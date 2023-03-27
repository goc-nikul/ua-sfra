'use strict';

var base = module.superModule;

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function productTile(product, apiProduct, productType, options) {
    base.call(this, product, apiProduct, productType, options);
    // Add other features
    var decorators = require('*/cartridge/models/product/decorators/index');
    decorators.productPersonlization(product, apiProduct);
    return product;
}

module.exports = productTile;
