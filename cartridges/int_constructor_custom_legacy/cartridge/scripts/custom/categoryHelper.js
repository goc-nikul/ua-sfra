/* eslint-disable no-param-reassign */

var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var productSearchHit = require('dw/catalog/ProductSearchHit');
var bucketedAttributesHelper = require('./bucketedAttributesHelper');
var Site = require('dw/system/Site');

/**
 * Removes unneeded text from URL.
 *
 * @param {string} url The url.
 * @returns {string} The scrubbed url.
 */
function cleanUrl(url) {
    if (!empty(url)) {
        // remove hostname
        if (url.indexOf('://') >= 0) {
            var protocolSplit = url.split('://');
            var domainSplit = protocolSplit[1].split('/');
            var host = 'https://' + domainSplit[0];
            url = url.indexOf(host) >= 0 ? url.replace(host, '') : url;
        }

        // convert ampersands
        url.replace(/&amp;/g, '&');

        // get site ID
        const sitePattern = '/s/' + Site.current.getID();

        // convert underscores to dashes in locale
        const localePattern = '/' + request.locale.toLowerCase().replace('_', '-');

        // remove site ID and convert locale
        url = url.indexOf(sitePattern) >= 0 ? url.replace(sitePattern, localePattern) : url;
    }

    return url;
}

/**
 * Returns the same category URL as UACAPI.
 *
 * @param {dw.catalog.Category} category The category.
 * @returns {string} The category url.
 */
function getCategoryUrl(category) {
    if (!empty(category)) {
        var url = dw.web.URLUtils.url('Search-Show', 'cgid', category.ID).toString();

        // convert url
        return cleanUrl(url);
    }

    return '';
}

/**
 * Returns the alternate category URL.
 *
 * @param {dw.catalog.Category} category The category.
 * @returns {string} The category url.
 */
function getCategoryAltUrl(category) {
    if (!empty(category)) {
        var url = category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
            ? category.custom.alternativeUrl.toString()
            : dw.web.URLUtils.url('Search-Show', 'cgid', category.ID).toString();

        // convert url
        return cleanUrl(url);
    }

    return '';
}

/**
 * Returns the parent category ID.
 *
 * @param {dw.catalog.Category} category The category.
 * @returns {string} The parent category ID.
 */
function getCategoryParentID(category) {
    if (!empty(category) && !empty(category.parent)) {
        return category.parent.ID;
    }

    return '';
}

/**
 * Returns the parent category name.
 *
 * @param {dw.catalog.Category} category The category.
 * @returns {string} The parent category name.
 */
function getCategoryParentName(category) {
    if (!empty(category) && !empty(category.parent)) {
        return category.parent.displayName;
    }

    return '';
}

/**
 * Returns the list of parent categories(including the passed category) with data.
 *
 * @param {dw.catalog.Category} category The category.
 * @param {Array} categories The list of categories.
 * @param {'asc' | 'desc'} sortOrder The sort order for the list of categories.
 * @param {boolean} excludeRoot Whether or not to exclude the root category.
 * @param {boolean} includeSelf Whether or not to include the passed category.
 * @returns {Array|string} The list of parent categories.
 */
function getParentCategories(category, categories, sortOrder, excludeRoot, includeSelf) {
    if (!empty(category)) {
        // initialize variables
        sortOrder = !empty(sortOrder) && sortOrder === 'asc' ? 'asc' : 'desc';
        includeSelf = !empty(includeSelf) && includeSelf;
        excludeRoot = !empty(excludeRoot) && excludeRoot;

        // add the passed category to the categories list
        var addCategory = ((excludeRoot && category.ID !== 'root') || !excludeRoot) && includeSelf;

        if (addCategory) {
            // initialize the list of categories if necessary
            categories = empty(categories) || !Array.isArray(categories) ? [] : categories;

            // get urls
            var url = getCategoryUrl(category);
            var altUrl = getCategoryAltUrl(category);

            // get data for the current category
            var parent = {
                id: category.ID,
                name: category.displayName,
                url: url,
                altUrl: altUrl === url ? null : altUrl,
                hideFromBreadCrumbs: category.custom.hideFromBreadCrumbs
            };

            // add category to the list
            categories.push(parent);
        }

        // if category has a parent category, add it to the list
        if (category.parent) {
            getParentCategories(category.parent, categories, sortOrder, excludeRoot, true);
        }

        // decide to return data or not
        var returnCategories = ((excludeRoot && (category.ID === 'root' && !empty(categories))) || category.ID !== 'root') || !excludeRoot;

        if (returnCategories) {
            // change sort order if specified
            return sortOrder === 'desc' && categories.length > 1 ? categories.reverse() : categories;
        }
    }

    return '';
}

/**
 * Returns search results for the passed category.
 *
 * @param {*} category The category.
 * @returns {Object} The search results.
 */
function searchCategory(category) {
    // configure search
    var productSearchModel = new ProductSearchModel();
    productSearchModel.setRecursiveCategorySearch(false);
    productSearchModel.addHitTypeRefinement([productSearchHit.HIT_TYPE_PRODUCT_MASTER, productSearchHit.HIT_TYPE_VARIATION_GROUP]);
    productSearchModel.setCategoryID(category.cgid);

    // execute search
    productSearchModel.search();
    return productSearchModel;
}

/**
 * Returns true if the passed category contains the gifts by price search refinement.
 *
 * @param {*} category The category.
 * @returns {boolean} Whether or not the passed category contains the gifts by price search refinement.
 */
function isGiftsCategory(category) {
    var productSearchModel = searchCategory({ cgid: category.ID });

    if (productSearchModel.getCount() > 0) {
        // get price refinement definition for passed category
        var priceRefinement = productSearchModel.refinements.priceRefinementDefinition;

        // if the gifts by price refinement is present, add the category to the list
        if (!empty(priceRefinement) && priceRefinement.displayName) {
            return bucketedAttributesHelper.isDisplayName('price', priceRefinement.displayName);
        }
    }

    return false;
}

/**
 * Returns list of categories that contain the Gifts By Price
 * search refinement.
 *
 * @param {*} category The category.
 * @returns {Object} The list.
 */
function getGiftsCategories(category) {
    // get search model for passed category
    var giftsCategories = [];

    // build map for passed category
    if (isGiftsCategory(category)) {
        giftsCategories.push(category.ID);
    }

    // build map for each subcategory
    var subCategories = category.onlineSubCategories.toArray();
    subCategories.forEach(function (subCategory) {
        giftsCategories.push.apply(giftsCategories, getGiftsCategories(subCategory));
    });

    return giftsCategories;
}

module.exports.getCategoryUrl = getCategoryUrl;
module.exports.getCategoryAltUrl = getCategoryAltUrl;
module.exports.getCategoryParentID = getCategoryParentID;
module.exports.getCategoryParentName = getCategoryParentName;
module.exports.getGiftsCategories = getGiftsCategories;
module.exports.getParentCategories = getParentCategories;
