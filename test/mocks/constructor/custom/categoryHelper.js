'use strict';

var ProductSearchModel = require('../../../mocks/dw/dw_catalog_ProductSearchModel');
var bucketedAttributesHelper = require('../../../mocks/constructor/custom/bucketedAttributesHelper');
var productSearchHit = require('../../../mocks/dw/dw_catalog_ProductSearchHit');

// Mocking empty function
function empty(value) {
    // Simulating an empty check function
    return value === null || value === undefined || value === '';
}

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

        // remove site info
        const sitePattern = '/s/US';

        // convert underscores to dashes in locale
        const localePattern = '/' + 'en_US'.toLowerCase().replace('_', '-');

        url = url.indexOf(sitePattern) >= 0 ? url.replace(sitePattern, localePattern) : url;
    }

    return url;
}

function getCategoryUrl(category) {
    if (!empty(category)) {
        var url = '/s/US/c/' + category.ID + '/';

        // convert url
        return cleanUrl(url);
    }

    return '';
}

function getCategoryAltUrl(category) {
    if (!empty(category)) {
        var url = category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
            ? category.custom.alternativeUrl.toString()
            : '/s/US/c/' + category.ID + '/';

        // convert url
        return cleanUrl(url);
    }

    return '';
}

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

        // if there's another parent category, add it to the list
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

function getCategoryParentID(category) {
    if (!empty(category) && !empty(category.parent)) {
        return category.parent.ID;
    }

    return '';
}

function getCategoryParentName(category) {
    if (!empty(category) && !empty(category.parent)) {
        return category.parent.displayName;
    }

    return '';
}

module.exports = {
    cleanUrl: cleanUrl,
    getCategoryUrl: getCategoryUrl,
    getCategoryAltUrl: getCategoryAltUrl,
    getParentCategories: getParentCategories,
    searchCategory: searchCategory,
    isGiftsCategory: isGiftsCategory,
    getGiftsCategories: getGiftsCategories,
    getCategoryParentID: getCategoryParentID,
    getCategoryParentName: getCategoryParentName
};