/**
 * @file Initializes ConstructorIO using settings from the global window object.
 * @module constructorIO
 */

'use strict';

const { cloneDeep } = require('lodash');
const {
    getPriceFacetOptions,
    getCioPreFilterExpression,
    parseControllerPLPURL
} = require('./utils/utils');
const {
    getConstructorIOSettings, getConstructorIOClient
} = require('./clientWrapper');

/**
 * Fetches search results.
 * @param {Object} - config Object with search parameters, or url with data
 * @returns {Promise<Object>} Promise resolving with results.
 */
const getConstructorioSearch = ({ searchParams: _searchParams, url, data }) => {
    if (!window.constructorIOSettings) {
        return Promise.reject(new Error('no settings'));
    }
    const cioClient = getConstructorIOClient();
    const searchParams = parseControllerPLPURL({ url, data }) || _searchParams || window.searchParams || (window.constructorIOSettings && window.constructorIOSettings.initialSearchParams) || {};

    if (cioClient && cioClient.search && cioClient.search.getSearchResults && searchParams.query) {
        const filters = cloneDeep(searchParams.filterParams) || {};
        const hasPriceRange = searchParams.priceRange;
        const { CIO_SORT_OPTIONS_MAP, variationMap } = getConstructorIOSettings();

        const networkParams = {
            timeout: window.constructorIOSettings.timeout
        };
        const sortingRule = CIO_SORT_OPTIONS_MAP[searchParams.sortRule] ? CIO_SORT_OPTIONS_MAP[searchParams.sortRule] : {};
        const params = {
            sortBy: sortingRule.sortBy || undefined,
            sortOrder: sortingRule.sortOrder || undefined,
            offset: searchParams.start || 0,
            resultsPerPage: searchParams.pageSize || 12,
            variationsMap: variationMap,
            filters
        };

        // Convert Price Refinement to make compatible with CIO Facets
        let paramsWithPrice = cloneDeep(params);
        if (hasPriceRange) {
            paramsWithPrice.preFilterExpression = getCioPreFilterExpression(hasPriceRange);
        }

        let promises = [cioClient.search.getSearchResults(
            searchParams.query,
            paramsWithPrice,
            networkParams
        )];

        // Update price buckets, when a non-price filter is selected
        if (hasPriceRange) {
            promises.push(cioClient.search.getSearchResults(searchParams.query, params, networkParams));
        }

        return Promise.allSettled(promises).then((results) => {
            // Search for redirects
            let anyRedirect;
            [...results].some(
                (result) => {
                    if (result && result.value && result.value.response && result.value.response.redirect && result.value.response.redirect.data && result.value.response.redirect.data.url) {
                        anyRedirect = result.value.response.redirect.data.url;
                        return true;
                    }
                    return false;
                });
            if (anyRedirect) {
                window.location.href = anyRedirect;
                return true;
            }
            if (
                !results ||
                results.some(
                    (result) =>
                        result.status === 'rejected' ||
                        !result.value ||
                        result.value.response.results.length === 0
                )
            ) {
                return Promise.reject(new Error('Empty results.'));
            }

            // If price buckets exist, maintain their state as backup
            let buckets;
            if (window.searchParams && window.searchParams.buckets) {
                buckets = window.searchParams.buckets;
            }

            // update backets from last request without price filtering
            buckets = getPriceFacetOptions(results[results.length - 1].value);

            // Update window state and return
            window.searchParams = searchParams;
            window.searchParams.trailingFilters = filters;
            if (buckets) window.searchParams.buckets = buckets;
            return Object.assign(results[0].value, { searchParams });
        });
    }

    return Promise.reject(new Error('Failed to fetch ConstructorIO autocomplete results.'));
};

module.exports = {
    getConstructorioSearch
};
