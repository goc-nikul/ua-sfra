'use strict';

/**
 * @module util/helpers
 */

var Logger = require('dw/system/Logger').getLogger('bm_socialfeeds', 'OCI:util/helpers');
var config = require('*/cartridge/scripts/oci/oci.config');

/**
 * @description Expands a JSON String into an object.  Takes a JSON string and attempts
 * to deserialize it.  A default value can be applied in the event that deserialization fails.
 *
 * @param {String} jsonString Represents the JSON String being expanded and deserialized.
 * @param {*} defaultValue Represents the default value to be applied to the variable if the JSON
 * string could not be expanded / deserialized.
 * @returns {*} Returns undefined if empty string or exception encountered
 */
function expandJSON(jsonString, defaultValue) {
    var output = defaultValue;
    try {
        output = jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
        Logger.error('Error parsing JSON: {0}', e);
    }
    return output;
}

/**
 * @description Returns an access token
 *
 * @returns {*} Returns undefined if empty string or exception encountered
 */
function getAccessToken() {
    var svc = require('*/cartridge/scripts/oci/services/ServiceMgr').getAuthService();
    var result = svc.call();
    if (result.status === 'OK' && !empty(result.object)) {
        // In case the auth token has been retrieved, then return it
        return result.object.access_token;
    }
    return undefined;
}

/**
 * @description Returns the org id saved in the custom object.
 *
 * @return {String} Org id
 */
function getOrgId() {
    var co = require('dw/object/CustomObjectMgr').getCustomObject(config.customObject.type, config.customObject.ID);
    if (co && co.custom.externalData) {
        var externalData = JSON.parse(co.custom.externalData);
        if(externalData.orgId) {
            return externalData.orgId;
        }
    }
    return '';
}

module.exports = {
    expandJSON: expandJSON,
    getAccessToken: getAccessToken,
    getOrgId: getOrgId
};