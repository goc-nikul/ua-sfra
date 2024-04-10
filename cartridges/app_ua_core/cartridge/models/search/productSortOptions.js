'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

var ACTION_ENDPOINT = 'Search-Show';

var BaseProductSortOptions = require('app_storefront_base/cartridge/models/search/productSortOptions');

/**
 * Retrieves sorting options
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search instance
 * @param {dw.util.List.<dw.catalog.SortingOption>} sortingOptions - List of sorting rule options
 * @param {dw.web.PagingModel} pagingModel - The paging model for the current search context
 * @param {Object} baseOptions - Base cartridge sorting options
 * @return {SortingOption} - Sorting option
 */
function updateSortingOptions(productSearch, sortingOptions, pagingModel, baseOptions) {
    var counter = 0;
    return collections.map(sortingOptions, function (option) {
        var baseUrl = productSearch.urlSortingRule(ACTION_ENDPOINT, option.sortingRule);
        var pagingParams = {
            start: '0',
            sz: pagingModel.end + 1
        };
        var baseOption = baseOptions[counter];
        counter++;
        return {
            displayName: baseOption.displayName,
            id: baseOption.id,
            url: baseOption.url,
            sortingRuleId: option.sortingRule.ID,
            pageUrl: urlHelper.appendQueryParams(baseUrl.toString(), pagingParams).toString()
        };
    });
}

/**
 * Get selected Sorting Option Name
 *
 * @param {dw.util.List.<dw.catalog.SortingOption>} sortingOptions - Sorting rule options
 * @param {string} ruleId - Selected Sorting Rule Id
 * @return {selectedSortingOption} - Selected Sorting Option Name
 */
function getSelectedSortingOption(sortingOptions, ruleId) {
    var selectedSortingOption = '';
    collections.forEach(sortingOptions, function (option) {
        if (option.ID && ruleId && option.ID.replace(/[\s-]/g, '').toLowerCase() === ruleId.replace(/[\s-]/g, '').toLowerCase()) {
            selectedSortingOption = option.displayName;
            return;
        }
    });
    return selectedSortingOption;
}

/**
 * @constructor
 * @classdesc Model that encapsulates product sort options
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search instance
 * @param {string|null} sortingRuleId - HTTP Param srule value
 * @param {dw.util.List.<dw.catalog.SortingOption>} sortingOptions - Sorting rule options
 * @param {dw.catalog.Category} rootCategory - Catalog's root category
 * @param {dw.web.PagingModel} pagingModel - The paging model for the current search context
 */
function ProductSortOptions(
    productSearch,
    sortingRuleId,
    sortingOptions,
    rootCategory,
    pagingModel
) {
    BaseProductSortOptions.apply(this, Array.prototype.slice.call(arguments));
    this.options = updateSortingOptions(productSearch, sortingOptions, pagingModel, this.options);
    this.selectedSortingOption = getSelectedSortingOption(sortingOptions, this.ruleId);
}

ProductSortOptions.prototype = Object.create(BaseProductSortOptions.prototype);
ProductSortOptions.prototype.constructor = ProductSortOptions;


module.exports = ProductSortOptions;
