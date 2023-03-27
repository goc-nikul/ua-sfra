'use strict';

const CUSTOM_OBJECT_NAME = 'authTokens';
const CUSTOM_OBJECT_KEY = 'NZPostOathToken';

var Transaction = require('dw/system/Transaction');

/**
 * Get custom object references
 * @returns {Object} custom object references
 */
function getCustomObjectReference() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    return Transaction.wrap(function () {
        return CustomObjectMgr.getCustomObject(CUSTOM_OBJECT_NAME, CUSTOM_OBJECT_KEY) || CustomObjectMgr.createCustomObject(CUSTOM_OBJECT_NAME, CUSTOM_OBJECT_KEY);
    });
}

/**
 * Save token in custom object
 * @param {string} authToken oAuth token
 */
function saveAuthToken(authToken) {
    Transaction.wrap(function () {
        getCustomObjectReference().custom.token = authToken;
    });
}

/**
 * Get token from custom object
 * @returns {string} access token
 */
function getAuthToken() {
    var customObjecRef = getCustomObjectReference();
    return (customObjecRef && 'token' in customObjecRef.custom) ? customObjecRef.custom.token : null;
}

/**
 * Save token in custom object
 * @param {string} authToken oAuth token
 */
function resetAuthToken() {
    Transaction.wrap(function () {
        getCustomObjectReference().custom.token = null;
    });
}

module.exports = {
    saveAuthToken: saveAuthToken,
    getAuthToken: getAuthToken,
    resetAuthToken: resetAuthToken
};
