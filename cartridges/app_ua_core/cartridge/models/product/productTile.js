'use strict';

var decorators = require('~/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');
var ProductHelper = require('~/cartridge/scripts/helpers/ProductHelper');

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType, options) {
    var productSearchHit = ProductHelper.getProductSearchHit(apiProduct);
    decorators.base(product, apiProduct, productType);
    decorators.searchPrice(product, productSearchHit, promotionCache.promotions, ProductHelper.getProductSearchHit, options.experienceType, ProductHelper.getVariantForColor, apiProduct, options.viewPreference);
    decorators.tileImages(product, apiProduct, productSearchHit, options.viewPreference, options.experienceType);
    decorators.tileSwatches(product, productSearchHit, options.outletColors, options.experienceType, options.viewPreference, options.isFilterByTeam, options.team, product && product.images && product.images.selectedColor ? product.images.selectedColor.color : '');
    decorators.badges(product, apiProduct);
    decorators.customAttributes(product, apiProduct);
    decorators.promotions(product, options.promotions);

    return product;
};
