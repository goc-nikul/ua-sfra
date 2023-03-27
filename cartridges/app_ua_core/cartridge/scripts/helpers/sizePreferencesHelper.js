'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var ArrayList = require('dw/util/ArrayList');
var Logger = require('dw/system/Logger').getLogger('DefaultSizeSelection');

/**
 * Get Size preference object
 * @param {Object} product dw Product
 * @returns {Object} size preferences object
 */
function getSizePreferenceObjects(product) {
    try {
        var sizePrefObject = {};
        var mProduct = (product && product.variant) ? product.masterProduct : product;
        var masterSizePrefJSON = (mProduct && 'masterSizePrefJSON' in mProduct.custom) ? mProduct.custom.masterSizePrefJSON : null;
        var variationSizePrefJSON = (product && 'variationSizePrefJSON' in product.custom) ? product.custom.variationSizePrefJSON : null;
        if (masterSizePrefJSON) {
            var oMasterSizePrefJSON = JSON.parse(masterSizePrefJSON);
            sizePrefObject.gender = oMasterSizePrefJSON.gender;
            sizePrefObject.productType = oMasterSizePrefJSON.productType;
        }
        if (variationSizePrefJSON) {
            var oVariationSizePrefJSON = JSON.parse(variationSizePrefJSON);
            sizePrefObject.sizeType = oVariationSizePrefJSON.type;
            sizePrefObject.size = oVariationSizePrefJSON.size;
        }
        return Object.keys(sizePrefObject).length === 0 ? null : sizePrefObject;
    } catch (e) {
        Logger.error(e + '\n' + e.stack);
    }
    return null;
}

/**
 * Fetches size preferences in object
 * @param {Object} oSizePreferences Object formatted session
 * @param {Object} product dw Product object
 * @returns {Object} returns size pref object if exists else null
 */
function findSizePreferencesInSession(oSizePreferences, product) {
    var sizePreferenceObject = getSizePreferenceObjects(product);
    var tSizePreferenceObjects = null;
    if (oSizePreferences && !oSizePreferences.isEmpty() && sizePreferenceObject) {
        var oSizePreferencesIter = oSizePreferences.iterator();
        while (oSizePreferencesIter.hasNext()) {
            var sessionSizePreferenceObject = oSizePreferencesIter.next();
            if ((sessionSizePreferenceObject.gender === sizePreferenceObject.gender) && (sessionSizePreferenceObject.productType === sizePreferenceObject.productType)) {
                tSizePreferenceObjects = sessionSizePreferenceObject;
                break;
            }
        }
    }
    return tSizePreferenceObjects;
}

/**
 * Validates whether product is eligible for pre-populate size
 * @param {Object} product dw product object
 * @returns {boolean} status provides status
 */
function isPreSizeSelectionEligible(product) {
    return !!(product &&
        ('masterSizePrefJSON' in product.custom) &&
        product.custom.masterSizePrefJSON);
}

/**
 * Update IDM for registered customer
 * @param {string} sizePreferences session size preferences
 * @param {string} email email address
 * @returns {boolean} returns status of IDM update
 */
function updateIDM(sizePreferences, email) {
    if (sizePreferences && email) {
        var idmHelper = require('*/cartridge/scripts/idmHelper');
        var tokenResponse = idmHelper.getAccessToken('client_credentials', null);
        if (!empty(tokenResponse) && 'access_token' in tokenResponse && !empty(tokenResponse.access_token)) {
            var accessToken = tokenResponse.access_token;
            var idmUserID = idmHelper.getUserIDByEmail(email, accessToken);
            return !!idmHelper.updateSizePreferences(idmUserID, sizePreferences.toArray(), accessToken);
        }
    }
    return false;
}

/**
 * Create session attribute
 * @param {string} pid dw product ID
 * @param {string} sizePreferences String JSON format of serialized session attribute
 * @param {string} authEmail String Auth Email for registered customer else null
 * @returns {Object} returns value of session attribute
 */
function createSizePrefJson(pid, sizePreferences, authEmail) {
    try {
        var idmPreferences = require('*/cartridge/scripts/idmPreferences.js');
        var product = ProductMgr.getProduct(pid);
        if (!(product && 'variationSizePrefJSON' in product.custom && product.custom.variationSizePrefJSON)) {
            return null;
        }
        var oSizePreference = new ArrayList(sizePreferences ? JSON.parse(sizePreferences) : []);
        var alreadyExistingObj = findSizePreferencesInSession(oSizePreference, product);
        if (alreadyExistingObj) {
            oSizePreference.remove(alreadyExistingObj);
        }
        var sizePrefObj = getSizePreferenceObjects(product);
        if (sizePrefObj) {
            oSizePreference.add(sizePrefObj);
        }
        if (oSizePreference && !oSizePreference.isEmpty() && idmPreferences.isIdmEnabled && authEmail) {
            var status = updateIDM(oSizePreference, authEmail);
            if (!status) {
                return null;
            }
        }
        return JSON.stringify(oSizePreference.toArray());
    } catch (e) {
        Logger.error(e + '\n' + e.stack);
    }
    return null;
}

/**
 * Fetches all saved values in session
 * @param {string} pid dw product ID
 * @param {string} sizePreferences JSON formatted session variable
 * @returns {string} returns size value
 */
function getSavedPrefs(pid, sizePreferences) {
    try {
        var product = ProductMgr.getProduct(pid);
        var oSizePreference = new ArrayList(sizePreferences ? JSON.parse(sizePreferences) : []);
        var sizePreferenceObject = findSizePreferencesInSession(oSizePreference, product);
        if (sizePreferenceObject) {
            return sizePreferenceObject.size;
        }
    } catch (e) {
        Logger.error(e + '\n' + e.stack);
    }
    return null;
}

module.exports = {
    isPreSizeSelectionEligible: isPreSizeSelectionEligible,
    createSizePrefJson: createSizePrefJson,
    getSavedPrefs: getSavedPrefs
};
