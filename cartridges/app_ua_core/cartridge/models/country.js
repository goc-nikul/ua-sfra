'use strict';

/* Script includes */
var PreferencesUtil = require('~/cartridge/scripts/utils/PreferencesUtil');
var UrlUtil = require('~/cartridge/scripts/utils/UrlUtils');

/**
 * Helper function, used to work with different countries
 * @returns {Object} Basic list of the supported countries
 */
function getBasicSitesList() {
    return PreferencesUtil.getJsonValue('sitesListBasic');
}

/**
 * Helper function, used to work with different countries
 * @returns {Object} Full list of the supported countries
 */
function getFullSitesList() {
    return PreferencesUtil.getJsonValue('sitesListFull');
}

/**
 * Helper function, used to work with different countries
 * @returns {Object} Full list of the Borderfree countries
 */
function getGlobalAccessCountries() {
    return PreferencesUtil.getValue('globalAccessCountries');
}

/**
 * Represents list of the available sites, based on global preference
 * @constructor
 */
function Country() {
    var countryCode = PreferencesUtil.getValue('countryCode');

    // Model Properties
    this.country = {
        countryCode: countryCode.getValue(),
        displayName: countryCode.getDisplayValue()
    };

    // Model Methods
    this.getSiteURL = UrlUtil.getWebsiteURL;
    this.getBasicSitesList = getBasicSitesList;
    this.getFullSitesList = getFullSitesList;
    this.getGlobalAccessCountries = getGlobalAccessCountries;
}

module.exports = Country;
