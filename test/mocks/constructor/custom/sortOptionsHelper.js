/* eslint-disable vars-on-top */
'use strict';

var system = require('dw/system/System');

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

    return bestSeller;
}

function buildNewest(product) {
    var newest = 0;

    if ('daysAvailable' in product.activeData && !empty(product.activeData.daysAvailable)) {
        newest = product.activeData.daysAvailable;
    }

    return newest;
}

function buildRating(product) {
    var rating = 0;

    if ('bvAverageRating' in product.custom && !empty(product.custom.bvAverageRating)) {
        rating = Number(product.custom.bvAverageRating);
    }

    return rating;
}

function buildSortData(product) {
    var sortData = {};

    sortData.bestSellers = buildBestSellers(product);
    sortData.newest = buildNewest(product);
    sortData.rating = buildRating(product);

    return sortData;
}

module.exports = {
    buildSortData: buildSortData
};
