'use strict';

/**
 * Base productLineItem overwritten to add borderfree adjusted unit price
 *
 */

var base = module.superModule;
var bfPriceTotal = require('*/cartridge/models/productLineItem/decorators/bfPriceTotal');

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
    base.call(this, product, apiProduct, options);
    bfPriceTotal(product, options.lineItem);
    return product;
};

