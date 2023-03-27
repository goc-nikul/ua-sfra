'use strict';

/* API includes */
var Site = require('dw/system/Site');
var System = require('dw/system/System');

/* Script includes*/
var JSONUtils = require('~/cartridge/scripts/utils/JsonUtils');

/* Global variables */
var currentSite = Site.getCurrent();
var orgPreferences = System.getPreferences();

/**
 * General wrapper for getCustomPreferenceValue(...)
 * @param {string} key - ID of the preference
 * @return {MultiData} value - Value of the site preference
 */
function getValue(key) {
    var value = null;

    if (!empty(key)) {
        value = currentSite.getCustomPreferenceValue(key);
    }

    return value;
}

/**
 * General wrapper for getCustomPreferenceValue(...) with parsing into JSON
 * @param {string} key - ID of the preference
 * @return {Object} value - Parsed into JSON site preference
 */
function getJsonValue(key) {
    var value = getValue(key);

    if (!empty(value)) {
        value = JSONUtils.parse(value);
    }

    return value;
}

/**
 *  Checks if some preference is enabled for current country
 *  country is got from the request.locale and cut 2 last letters (country format example - 'AU')
 *  @param {string} prefName The name of the preference to check
 *  @returns {boolean} return whether country is enabled or not for the given site.
 */
function isCountryEnabled(prefName) {
    const prefValue = this.getValue(prefName);
    if (empty(prefValue)) {
        return false;
    }
    // eslint-disable-next-line no-undef
    if (empty(request.locale)) {
        return false;
    }

    // eslint-disable-next-line no-undef
    if (prefValue.indexOf(request.locale.slice(-2)) !== -1 || prefValue === 'ALL') return true;
    return false;
}

/**
 * General wrapper for organization preferences
 * @param {string} key - ID of the preference
 * @return {MultiData} value - Value of the organization preference
 */
function getGlobalValue(key) {
    var value = null;

    if (!empty(key)) {
        value = orgPreferences.getCustom()[key];
    }

    return value;
}

/**
 * General wrapper for organization preferenceValue with parsing into JSON
 * @param {string} key - ID of the preference
 * @return {Object} value - Parsed into JSON organization preference
 */
function getGlobalJsonValue(key) {
    var value = getGlobalValue(key);

    if (!empty(value)) {
        value = JSONUtils.parse(value);
    }

    return value;
}

module.exports = {
    getValue: getValue,
    getJsonValue: getJsonValue,
    getGlobalValue: getGlobalValue,
    getGlobalJsonValue: getGlobalJsonValue,
    isCountryEnabled: isCountryEnabled
};
