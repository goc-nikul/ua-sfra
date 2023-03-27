'use strict';

var base = module.superModule;
var BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');
var ACTION_ENDPOINT = 'Search-Show';

/**
 * @constructor
 * @classdesc Boolean attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function BooleanAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;

    this.initialize();
}

BooleanAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

BooleanAttributeValue.prototype.initialize = function () {
    BaseAttributeValue.prototype.initialize.call(this);
    this.pageUrl = this.getUrl(
        this.productSearch,
        ACTION_ENDPOINT,
        this.id,
        this.value,
        this.selected,
        this.selectable
    );
};

/**
 * @constructor
 * @classdesc Boolean attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function BooleanRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    base.call(this, productSearch, refinementDefinition, refinementValue);
    this.pageUrl = new BooleanAttributeValue(productSearch, refinementDefinition, refinementValue).pageUrl;
}

module.exports = BooleanRefinementValueWrapper;
