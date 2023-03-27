'use strict';

/* API Includes */

/**
 * get stores by postal code
 * @param {string} postalCode postalCode
 * @param {string} radius - selected radius
 * @returns {Object} storesModel storeModel
 */
function getStoresByPostalCode(postalCode, radius) {
    var storesModel = null;
    var BrandifyUtils = require('*/cartridge/scripts/BrandifyUtils');
    var brandifyService = require('*/cartridge/scripts/services/BrandifyService');
    var brandifyRequestData = BrandifyUtils.buildRequestJSON(radius, postalCode);
    var response = brandifyService.call(brandifyRequestData);
    var filteredResponse = BrandifyUtils.filterStoreSearch(response, radius, postalCode);
    if (filteredResponse) {
        storesModel = filteredResponse;
    }
    return storesModel;
}

 /**
  * get stores by postal code
  * @param {string} lat latitude
  * @param {string} long longitude
  * @param {string} radius - selected radius
  * @returns {Object} storesModel storeModel
  */
function getStoresByCoordinates(lat, long, radius) {
    var storesModel = null;
    var BrandifyUtils = require('*/cartridge/scripts/BrandifyUtils');
    var brandifyService = require('*/cartridge/scripts/services/BrandifyService');
    var postalCode = null;
    var brandifyRequestData = BrandifyUtils.buildRequestJSON(radius, postalCode, lat, long);
    var response = brandifyService.call(brandifyRequestData);
    var filteredResponse = BrandifyUtils.filterStoreSearch(response, radius, null, lat, long);
    if (filteredResponse) {
        storesModel = filteredResponse;
    }
    return storesModel;
}

module.exports = {
    getStoresByPostalCode: getStoresByPostalCode,
    getStoresByCoordinates: getStoresByCoordinates
};
