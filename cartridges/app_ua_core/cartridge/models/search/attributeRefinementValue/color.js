'use strict';

var base = module.superModule;
var BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');
var ACTION_ENDPOINT = 'Search-Show';

/**
 * @constructor
 * @classdesc Color attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function ColorAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;

    this.initialize();
}

ColorAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

ColorAttributeValue.prototype.initialize = function () {
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
 * @classdesc Color attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function ColorRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    base.call(this, productSearch, refinementDefinition, refinementValue);
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    this.pageUrl = new ColorAttributeValue(productSearch, refinementDefinition, refinementValue).pageUrl;
    this.stdLightness = 0.6;
    this.lightnessValues = productHelpers.changeSwatchBorder(this.presentationId, this.presentationId);
}

module.exports = ColorRefinementValueWrapper;
