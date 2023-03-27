'use strict';

/**
 * Get corresoping URL
 * @param {Object} productSearch SFRA product search model object
 * @param {Object} httpParams request params
 * @param {Object} index index
 * @returns {string} returns corresponding url
 */
function getURL(productSearch, httpParams, index) {
    var URLUtils = require('dw/web/URLUtils');
    var url = URLUtils.url('Search-Show');
    var pageSize = productSearch.pageSize;
    if (productSearch.category) {
        url.append('cgid', productSearch.category.id);
    }
    if (httpParams.q) {
        url.append('q', httpParams.q);
    }
    if (index !== 0) {
        url.append('start', (pageSize * index));
        url.append('sz', pageSize);
    }
    return url;
}

/**
 * Forms NO JS Objects
 * @param {Object} productSearch SFRA product search model
 * @param {Object} httpParams request params
 * @param {Object} noofPages total number of pages
 * @returns {Object} returns array of no js objects
 */
function getNonJsPaginationObjects(productSearch, httpParams, noofPages) {
    try {
        var paginations = [];
        for (var i = 0; i < noofPages; i++) {
            var pagination = {
                selected: (i === (productSearch.pageNumber)),
                url: getURL(productSearch, httpParams, i),
                index: i + 1
            };
            paginations.push(pagination);
        }
        return paginations;
    } catch (e) {
        var Logger = require('dw/system/Logger').getLogger('NoJSPagination');
        Logger.error('{0}:{1}: {2} ({3}:{4}) \n{5}', 'Error on NoJSPagination', e.name, e.message, e.fileName, e.lineNumber, e.stack);
    }
    return [];
}

/**
 * NO JS Pagination contructor
 * @param {Object} productSearch SFRA product search model
 * @param {Object} httpParams request params
 */
function NoJsPagination(productSearch, httpParams) {
    var noofPages = Math.ceil((productSearch.count) / (productSearch.pageSize));
    this.pagination = getNonJsPaginationObjects(productSearch, httpParams, noofPages);
    this.isPreviousAvailable = productSearch.pageNumber !== 0;
    this.previousURL = this.isPreviousAvailable ? getURL(productSearch, httpParams, productSearch.pageNumber - 1) : null;
    this.isNextAvailable = (productSearch.pageNumber) !== (noofPages - 1);
    this.nextURL = this.isNextAvailable ? getURL(productSearch, httpParams, productSearch.pageNumber + 1) : null;
}

module.exports = NoJsPagination;
