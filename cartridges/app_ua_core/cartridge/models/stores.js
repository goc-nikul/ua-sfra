'use strict';
var base = module.superModule;

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.util.Set} storesResultsObject - a set of <dw.catalog.Store> objects
 * @param {Object} searchKey - what the user searched by (location or postal code)
 * @param {number} searchRadius - the radius used in the search
 * @param {dw.web.URL} actionUrl - a relative url
 * @param {string} apiKey - the google maps api key that is set in site preferences
 */
function stores(storesResultsObject, searchKey, searchRadius, actionUrl, apiKey) {
    base.call(this, storesResultsObject, searchKey, searchRadius, actionUrl, apiKey);
    var Site = require('dw/system/Site');
    if ('inStorePickUpRadiusOptions' in Site.current.preferences.custom && !empty(Site.current.getCustomPreferenceValue('inStorePickUpRadiusOptions'))) {
        this.radiusOptions = JSON.parse(Site.current.getCustomPreferenceValue('inStorePickUpRadiusOptions'));
    }
}

module.exports = stores;
