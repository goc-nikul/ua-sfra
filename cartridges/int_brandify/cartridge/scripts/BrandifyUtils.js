'use strict';

/* eslint-disable  spellcheck/spell-checker */
/* eslint-disable  prefer-const */
/*
 * API Includes
 */
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('int.brandify');
var BrandifyPreferences = require('*/cartridge/scripts/BrandifyPreferences');

/**
 * Function gets the country code to send
 * @return {string} - country code
 */
function getStoreCountryCode() {
    // eslint-disable-next-line no-undef
    var countryCode = request.locale.countryCode;

    // eslint-disable-next-line no-undef
    var geoLocationCountry = request.geolocation.countryCode;

    if (geoLocationCountry) {
        countryCode = geoLocationCountry;
    }

    return countryCode;
}

/**
 * Function builds the brandify request JSON
 * @param {string} radius radius
 * @param {string} postalCode postalCode
 * @param {string} lat latitude
 * @param {string} long longitude
 * @returns {Object} requestJSON requestJSON
 */
function buildRequestJSON(radius, postalCode, lat, long) {
    var brandifyAppKey = BrandifyPreferences.BrandifyAppKey;
    var countryCode = getStoreCountryCode();
    var requestJSON = {
        request: {
            appkey: brandifyAppKey,
            formdata: {
                geoip: false,
                dataview: 'store_default',
                order: 'UASPECIALITY, UAOUTLET, AUTHORIZEDDEALER, rank,_distance',
                limit: 10,
                geolocs: {
                    geoloc: [{
                        country: countryCode || 'US',
                        postalcode: postalCode || null,
                        latitude: lat || null,
                        longitude: long || null
                    }]
                },
                searchradius: radius || '15',
                where: {
                    or: {
                        UASPECIALITY: {
                            eq: '1'
                        },
                        UAOUTLET: {
                            eq: '1'
                        }
                    }
                },
                false: '0'
            }
        }
    };
    return requestJSON;
}

/**
 * filter brandify response
 * @param {Object} response response
 * @param {string} radius - selected radius
 * @param {string} postalCode - postal code for search
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @returns {Object} stores storesModel
 */
function filterStoreSearch(response, radius, postalCode, lat, long) {
    var storeSearchResults = [];
    try {
        if (response && response.object && response.object.statusCode === 200) {
            if (response.object.text) {
                var storesResponse = JSON.parse(response.object.text);
                if (storesResponse && storesResponse.response && storesResponse.response.collection) {
                    var storesList = storesResponse.response.collection;
                    storesList.forEach(function (store) {
                        var storeID = store.stnum;
                        if (storeID) {
                            var StoreMgr = require('dw/catalog/StoreMgr');
                            var storeByID = StoreMgr.getStore(storeID);
                            if (storeByID) {
                                storeSearchResults.push(storeByID);
                            }
                        }
                    });
                }
            }
        }
    } catch (e) {
        Log.error('Error while filtering brandify response: {0}', e.message);
    }
    var storeSet = new (require('dw/util/HashSet'))();
    if (storeSearchResults.length > 0) {
        storeSet.add(storeSearchResults);
    }
    var StoresModel = require('*/cartridge/models/stores');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var searchKey = null;
    if (postalCode) {
        searchKey = { postalCode: postalCode };
    } else if (lat && long) {
        searchKey = { lat: lat, long: long };
    }
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;
    var actionUrl = URLUtils.url('Stores-FindStores', 'showMap', false).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');
    var stores = new StoresModel(storeSet, searchKey, resolvedRadius, actionUrl, apiKey);
    return stores;
}
module.exports = {
    getStoreCountryCode: getStoreCountryCode,
    buildRequestJSON: buildRequestJSON,
    filterStoreSearch: filterStoreSearch
};
