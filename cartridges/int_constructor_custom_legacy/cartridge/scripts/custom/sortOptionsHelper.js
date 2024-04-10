/* eslint-disable vars-on-top */

var system = require('dw/system/System');

/**
 * Returns random number between the first and second param.
 * @param {number} min The minimum number.
 * @param {number} max The maximum number.
 * @returns {number} A random number.
 */
function getRandomNumber(min, max) {
    const range = max - min;
    const randomValue = Math.random() * (range + min);
    return Math.floor(randomValue);
}

/**
 * Builds the best seller sort data for an individual product.
 * @param {dw.catalog.Product} product The product.
 * @returns {Object|string} An object containing the best seller sort data for an individual product.
 */
function buildBestSellers(product) {
    var bestSeller = 0;

    if ('revenueMonth' in product.activeData && !empty(product.activeData.revenueMonth)) {
        bestSeller = product.activeData.revenueMonth * 0.65;
    }

    if ('conversionMonth' in product.activeData && !empty(product.activeData.conversionMonth)) {
        bestSeller += product.activeData.conversionMonth * 0.25;
    }

    if ('viewsMonth' in product.activeData && !empty(product.activeData.viewsMonth)) {
        bestSeller += product.activeData.viewsMonth * 0.1;
    }

    // for testing only
    if (system.getInstanceType() !== system.PRODUCTION_SYSTEM || system.getInstanceType() !== system.STAGING_SYSTEM) {
        bestSeller = getRandomNumber(1, 5000);
    }

    return bestSeller;
}

/**
 * Builds the newest sort data for an individual product.
 * @param {dw.catalog.Product} product The product.
 * @returns {Object|string} An object containing the newest sort data for an individual product.
 */
function buildNewest(product) {
    var newest = 0;

    if ('daysAvailable' in product.activeData && !empty(product.activeData.daysAvailable)) {
        newest = product.activeData.daysAvailable;
    }

    // for testing only
    if (system.getInstanceType() !== system.PRODUCTION_SYSTEM || system.getInstanceType() !== system.STAGING_SYSTEM) {
        newest = getRandomNumber(1, 5000);
    }

    return newest;
}

/**
 * Builds the rating sort data for an individual product.
 * @param {dw.catalog.Product} product The product.
 * @returns {Object|string} An object containing the rating sort data for an individual product.
 */
function buildRating(product) {
    var rating = 0;

    if ('bvAverageRating' in product.custom && !empty(product.custom.bvAverageRating)) {
        rating = Number(product.custom.bvAverageRating);
    }

    // for testing only
    if (system.getInstanceType() !== system.PRODUCTION_SYSTEM || system.getInstanceType() !== system.STAGING_SYSTEM) {
        rating = getRandomNumber(1, 5000);
    }

    return rating;
}

/**
 * Builds the sort JSON for an individual product.
 * @param {dw.catalog.Product} product The product.
 * @returns {Object|string} An JSON object containing the sort data for an individual product.
 */
function buildSortData(product) {
    var sortData = {};

    sortData.bestSellers = buildBestSellers(product);
    sortData.newest = buildNewest(product);
    sortData.rating = buildRating(product);

    return sortData;
}

module.exports.buildSortData = buildSortData;
