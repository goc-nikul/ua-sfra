'use strict';

var BaseCategory = require('app_storefront_base/cartridge/models/search/attributeRefinementValue/category');
var URLUtils = require('dw/web/URLUtils');
/**
 * @constructor
 * @classdesc Category attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 * @param {boolean} selected - Selected flag
 */
function CategoryRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    BaseCategory.apply(this, Array.prototype.slice.call(arguments));
    this.hidefromLeftNavigationRefinement = 'hidefromLeftNavigationRefinement' in refinementValue.custom && refinementValue.custom.hidefromLeftNavigationRefinement.valueOf() ? refinementValue.custom.hidefromLeftNavigationRefinement.valueOf().toString() : '';
    this.url = URLUtils.url('Search-ShowAjax', 'cgid', refinementValue.ID);
}

CategoryRefinementValueWrapper.prototype = Object.create(BaseCategory.prototype);
CategoryRefinementValueWrapper.prototype.constructor = CategoryRefinementValueWrapper;

module.exports = CategoryRefinementValueWrapper;
