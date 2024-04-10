/**
 * @file Initializes ConstructorIO using settings from the global window object.
 * @module constructorIO
 */

'use strict';

import Cookies from 'js-cookie';

const clientWrapper = require('./clientWrapper');
const cioTiles = require('./components/tiles');
const { getURL, getConstructorIOSettings, getResource } = require('./clientWrapper');

const RECENT_SEARCH_COOKIE_NAME = 'ua-recent-search';

const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

const convertSuggestionsToLinks = (suggestions) => {
    let links = '';

    try {
        suggestions.forEach((suggestion, index) => {
            const value = suggestion.value;

            if (value !== undefined) {
                links = links.concat(`
                    <li class="b-suggestions_info-item js-item" id="category-${index}" role="option">
                        <a class="b-suggestions_info-link" href="${getURL('searchURL') + value}" data-analytics-track="search-suggestion" data-analytics-value="category|${value} ">
                            <span class="b-suggestions_info-name">
                                ${value}
                            </span>
                        </a>
                    </li>
                `);
            }
        });

        return links;
    } catch (error) {
        // Return an empty string or some default HTML in case of failure
        return links;
    }
};

const getRecentSearches = () => {
    const recentSearches = Cookies.get(RECENT_SEARCH_COOKIE_NAME);
    if (recentSearches) {
        return (
            recentSearches
                .split(';')
                .filter((s) => !!s) || []
        );
    }

    return [];
};

const addToRecentSearch = (searchTerm) => {
    // This will get the current list of recent searches and prepend the new search result, dedupe it and return the top 3
    const oldRecentSearches = getRecentSearches();
    const recentSearches = ([searchTerm, ...oldRecentSearches]).filter((value, index, values) => values.indexOf(value) === index).slice(0, 3);

    // Update the cookie with the list.
    Cookies.set(RECENT_SEARCH_COOKIE_NAME, recentSearches.join(';'));
};

const getCurrentSearchData = () => {
    const params = new URL(document.location).searchParams;
    const searchQuery = params.get('q');

    return searchQuery;
};

const convertRecentSearchesToLinks = (recentSearches) => {
    let links = '';

    try {
        recentSearches.forEach((recentSearch, index) => {
            const value = escapeHtml(recentSearch);
            links = links.concat(`
                <li class="b-suggestions_info-item js-item" id="phrase-${index}" role="option">
                    <a class="b-suggestions_info-link" href="${getURL('searchURL') + encodeURIComponent(value)}" data-analytics-track="search-suggestion" data-analytics-value="recent searches|${value} ">
                        <span class="b-suggestions_info-name">
                            ${value}
                        </span>
                    </a>
                </li>
            `);
        });

        return links;
    } catch (error) {
        // Return an empty string or some default HTML in case of failure
        return links;
    }
};

/**
 * Helper function used to convert ConstructorIO data into HTML string
 * that can be used in the processResponse function used to render
 * Search Suggestions popup
 *
 * @param {Object} response - ConstructorIO Autocomplete query response object
 * @return {string} - HTML string with ConstructorIO data
 */
const convertCIOToHTMLString = (response) => {
    const hasResponse = response && response.sections;
    const products = hasResponse && response.sections.Products;
    const suggestions = hasResponse && response.sections['Search Suggestions'];
    const tiles = cioTiles.convertProductsToTiles(products);
    const links = convertSuggestionsToLinks(suggestions);
    const query = hasResponse && response.request && response.request.term ? response.request.term : '';
    const currentSearch = getCurrentSearchData();
    addToRecentSearch(currentSearch);
    const recentSearches = getRecentSearches();
    const recentSearchLinks = convertRecentSearchesToLinks(recentSearches);

    return (`
        <div class="b-suggestions js-suggestions">
            <div class="b-suggestions-flyout">
                <div class="b-suggestions-container" role="listbox" id="search-results">
                    ${links ? `
                        <div class="b-suggestions-info">
                            <div class="b-suggestions-section">
                                <div class="b-suggestions-title">${getResource('headerModalSuggestionsCategory') || ''}</div>
                                <ul class="b-suggestions_info-list">
                                    ${links}
                                </ul>
                            </div>
                            ${recentSearchLinks ? `
                                <div class="b-suggestions-section">
                                    <div class="b-suggestions-title">${getResource('headerModalSuggestionsRecentSearch') || ''}</div>
                                    <ul class="b-suggestions_info-list">
                                        ${recentSearchLinks}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    ${!links && recentSearchLinks ? `
                    <div class="b-suggestions-info">
                        <div class="b-suggestions-section">
                            <div class="b-suggestions-title">${getResource('headerModalSuggestionsRecentSearch') || ''}</div>
                            <ul class="b-suggestions_info-list">
                                ${recentSearchLinks}
                            </ul>
                        </div>
                    </div>
                ` : ''}
                    <div class="b-suggestions-products b-suggestions_products">
                        <div class="b-suggestions-section">
                            ${products.length >= 4 ? (
                                `<div class="b-suggestions-results">
                                    <a class="b-suggestions-results-link" href="${getURL('searchURL') + query || ''}">
                                        ${getResource('refinementsViewall') || ''}
                                    </a>
                                </div>`
                            ) : ''}
                            ${products.length > 0 ? (
                            `<div class="b-suggestions-title">${getResource('headerModalSuggestionsProduct') || ''}</div>
                                <ul class="b-suggestions_products-list">
                                    ${tiles}
                                </ul>`
                            ) : (
                            `<div class="b-suggestions-title_noresult">${getResource('noResultsFound')}</div>
                                <div class="b-suggestions-text_noresult">
                                    <div class="content-asset">${getResource('noSearchSuggestions')}</div>
                                </div>`
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
};

/**
 * Fetches Autocomplete search results.
 * @param {string} query - Query string.
 * @returns {Promise<Object>} Promise resolving with Autocomplete results.
 */
const getConstructorioSuggestions = (query) => {
    const cioClient = clientWrapper.getConstructorIOClient();

    if (cioClient && cioClient.autocomplete && cioClient.autocomplete.getAutocompleteResults) {
        const constructorIOSettings = getConstructorIOSettings();
        return cioClient.autocomplete.getAutocompleteResults(query, {
            variationsMap: constructorIOSettings.variationMap || undefined,
            resultsPerSection: {
                Products: 4,
                Categories: 0,
                'Search Suggestions': 7
            },
            networkParameters: {
                timeout: constructorIOSettings.timeout
            }
        });
    }

    return Promise.reject(new Error('Failed to fetch ConstructorIO autocomplete results.'));
};

export {
    convertCIOToHTMLString,
    getConstructorioSuggestions
};
