'use strict';

var BaseProductSearch = require('app_storefront_base/cartridge/models/search/productSearch');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var preferences = require('*/cartridge/config/preferences');
var searchRefinementsFactory = require('*/cartridge/scripts/factories/searchRefinements');
var ACTION_ENDPOINT = 'Search-Show';

/**
 * @constructor
 * @classdesc ProductSearch class
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 */
function createNewUrl(productSearch, httpParams) {
    var params = httpParams.start ? httpParams.start : httpParams.pageSize ? httpParams.pageSize : '0';
    var appended = {};
    appended.start = params;
    appended.breadcrumbLast = httpParams.breadCrumbLast ? httpParams.breadCrumbLast : '';
    appended.previousUrl = '';
    if (httpParams.start && httpParams.start > 0 && httpParams.showMore !== 'true') {
        var showMoreEndpoint = 'Search-UpdateGrid';
        var pageSize = preferences.defaultPageSize ? preferences.defaultPageSize : 12;
        var start = Number(httpParams.start) - pageSize <= 0 ? '0' : Number(httpParams.start) - pageSize;
        var urlParameter = { start: start };
        var url = productSearch.url(showMoreEndpoint).toString();
        appended.previousUrl = urlHelper.appendQueryParams(url, urlParameter).toString();
    }
    return appended;
}

/**
 * Generates URL that removes refinements, essentially resetting search criteria
 *
 * @param {dw.catalog.ProductSearchModel} search - Product search object
 * @param {Object} httpParams - Query params
 * @param {string} [httpParams.q] - Search keywords
 * @param {string} [httpParams.cgid] - Category ID
 * @return {string} - URL to reset query to original search
 */
function getSearchResultResetLink(search, httpParams) {
    var URLUtils = require('dw/web/URLUtils');
    return search.categorySearch
        ? URLUtils.url(ACTION_ENDPOINT, 'cgid', httpParams.cgid)
        : URLUtils.url(ACTION_ENDPOINT, 'q', httpParams.q);
}

/**
 * @constructor
 * @classdesc ProductSearch class
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 * @param {string} sortingRule - Sorting option rule ID
 * @param {dw.util.ArrayList.<dw.catalog.SortingOption>} sortingOptions - Options to sort search
 *     results
 * @param {dw.catalog.Category} rootCategory - Search result's root category if applicable
 */
function ProductSearch(productSearch, httpParams, sortingRule, sortingOptions, rootCategory) { // eslint-disable-line
    var currentStart = httpParams.start ? httpParams.start : 0;
    BaseProductSearch.apply(this, Array.prototype.slice.call(arguments));
    this.createNewUrl = createNewUrl(
            productSearch,
            httpParams
        );
    this.start = Number(currentStart);
    this.defaultPageSize = preferences.defaultPageSize;
    this.searchResultResetLink = getSearchResultResetLink(productSearch, httpParams);
    // When js is disabled show below pagination
    var NoJsPagination = require('*/cartridge/models/search/noJSPagination');
    this.jsDisablePagination = new NoJsPagination(this, httpParams);
}
ProductSearch.prototype = Object.create(BaseProductSearch.prototype);
ProductSearch.prototype.constructor = ProductSearch;

/**
 * buildDiscountPercentageFilter to support percentage discount filter
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} mappedValues - Mapped Refinement values
 * @param {dw.util.Collection.<dw.catalog.ProductSearchRefinementValue>} refinementValues - Refinement values
 * @returns {Object} - Modified refinement values
 */
function buildDiscountPercentageFilter(productSearch, mappedValues, refinementValues) {
    const Resource = require('dw/web/Resource');
    const selectionMap = {
        20: false,
        30: false,
        40: false,
        50: false,
        51: false
    };
    const hitCounts = {
        20: 0,
        30: 0,
        40: 0,
        50: 0,
        51: 0
    };
    const currentSelectedRefinementValues = productSearch.getRefinementValues('discountPercentage').toArray();
    const availableRefinementValues = [];
    collections.forEach(refinementValues, function (refinementValue) {
        const { value: val, hitCount } = refinementValue;
        const breakPointVal = val;
        hitCounts[breakPointVal] += hitCount;
        /* istanbul ignore else */
        if (availableRefinementValues.indexOf(breakPointVal) < 0) {
            availableRefinementValues.push(breakPointVal.toString());
        }
    });
    const valuesMap = [];
    mappedValues.forEach(refinementValue => {
        const breakPointVal = refinementValue.displayValue;
        if (!refinementValue.selectable || availableRefinementValues.indexOf(breakPointVal) < 0) return;
        /* istanbul ignore else */
        if (breakPointVal) {
            /* istanbul ignore else */
            valuesMap.push(breakPointVal);
            /* istanbul ignore else */
            if (refinementValue.selected) selectionMap[breakPointVal] = refinementValue.selected;
        }
    });
    const selectableRefinementValues = currentSelectedRefinementValues.filter(val => {
        return availableRefinementValues.indexOf(val) > -1;
    });
    const newValues = [];
    valuesMap.forEach(value => {
        const newValue = JSON.parse(JSON.stringify(mappedValues.find(refinementValue => value === refinementValue.displayValue)));
        newValue.displayValue = Resource.msg('refinement.discountpercentage.' + value, 'search', null);
        newValue.title = Resource.msg('refinement.discountpercentage.' + value, 'search', null);
        productSearch.setRefinementValues('discountPercentage', selectableRefinementValues.join('|'));
        if (selectionMap[value] === true) {
            newValue.pageUrl = productSearch.urlRelaxAttributeValue(ACTION_ENDPOINT, 'discountPercentage', value).relative().toString();
            newValue.url = productSearch.urlRelaxAttributeValue(ACTION_ENDPOINT, 'discountPercentage', value).relative().toString();
        } else {
            newValue.pageUrl = productSearch.urlRefineAttributeValue(ACTION_ENDPOINT, 'discountPercentage', value).relative().toString();
            newValue.url = productSearch.urlRefineAttributeValue(ACTION_ENDPOINT, 'discountPercentage', value).relative().toString();
        }
        newValue.count = hitCounts[value];
        newValue.displayCount = ['(', hitCounts[value], ')'].join('');
        newValues.push(newValue);
    });

    return newValues;
}

/**
 * Retrieves search refinements
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinements} refinements - Search refinements
 * @param {ArrayList.<dw.catalog.ProductSearchRefinementDefinition>} refinementDefinitions - List of
 *     product serach refinement definitions
 * @return {Refinement[]} - List of parsed refinements
 */
function getRefinements(productSearch, refinements, refinementDefinitions) {
    return collections.map(refinementDefinitions, function (definition) {
        var refinementValues = refinements.getAllRefinementValues(definition);
        var values = searchRefinementsFactory.get(productSearch, definition, refinementValues);

        if (definition.attributeID === 'discountPercentage') {
            values = buildDiscountPercentageFilter(productSearch, values, refinementValues);
        }

        return {
            displayName: definition.displayName,
            isCategoryRefinement: definition.categoryRefinement,
            isAttributeRefinement: definition.attributeRefinement,
            isPriceRefinement: definition.priceRefinement,
            cutoffThreshold: definition.cutoffThreshold,
            values: values
        };
    });
}

Object.defineProperty(ProductSearch.prototype, 'refinements', {
    get: function () {
        /* istanbul ignore else */
        if (!this.cachedRefinements) {
            this.cachedRefinements = getRefinements(
                this.productSearch,
                this.productSearch.refinements,
                this.productSearch.refinements.refinementDefinitions
            );
        }

        return this.cachedRefinements;
    },
    set: function () {
        // setter for the property
    }
});

module.exports = ProductSearch;
