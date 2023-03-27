'use strict';

/**
 * @module models/authToken
 */

const CUSTOM_OBJECT_NAME = 'authTokens';
const CUSTOM_OBJECT_KEY = 'NZPostOathToken';

/**
 * Retrieves cached token from custom object storage
 * If no existing token object, an empty one is created
 * @returns {dw.object.CustomAttributes} Returns token custom attributes
 */
function getObject() {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    return Transaction.wrap(function () {
        return (CustomObjectMgr.getCustomObject(CUSTOM_OBJECT_NAME, CUSTOM_OBJECT_KEY) || CustomObjectMgr.createCustomObject(CUSTOM_OBJECT_NAME, CUSTOM_OBJECT_KEY)).custom;
    });
}

/**
 * Puts token into custom object storage
 * @param {Object} obj A plain JS object with the token
 * @returns {Object} Returns the same plain JS object
 */
function updateCachedTokenObject(obj) {
    var custObj = getObject();
    const tokenObject = {	// creating new object with property names matching the rest of the application.
        accessToken: obj.access_token,
        expires: Date.now() + (obj.expires_in * 1000)
    };
    require('dw/system/Transaction').wrap(function () {
        custObj.token = tokenObject.accessToken;
        custObj.expires = new Date(tokenObject.expires);
    });

    return tokenObject;
}

/**
 * Returns whether the stored token is valid
 * @returns {boolean} Whether the stored token is valid and not expired
 * @alias module:models/authToken~AuthToken#isValidAuth
 */
function isValidAuth() {
    if (!this.token || !this.token.accessToken) {
        var cachedToken = getObject();
        if (!cachedToken || !cachedToken.token) {
            return false;
        }
        this.token = {
            accessToken: cachedToken.token,
            expires: cachedToken.expires
        };
    }
    // check if expires is in the future
    return this.token && this.token.accessToken && this.token.expires.getTime() > Date.now();
}

/**
 * Call Live service if token is not valid
 */
function callService() {
    var result = require('*/cartridge/scripts/helpers/nzPostHelpers').getOAuthToken();
    if (result && this) this.token = updateCachedTokenObject(result);
}

/**
 * Gets a valid token from storage or from a new auth request
 * @returns {boolean|Object} False or plain JS object containing the token response
 * @alias module:models/authToken~AuthToken#getValidToken
 */
function getValidToken() {
    if (!this.isValidAuth()) callService();
    return this.isValidAuth() && this.token;
}

/**
 * Token class for checking auth and retrieving valid token
 * @constructor
 * @alias module:models/authToken~AuthToken
 */
function NzAuthToken() {
    /**
     * Token object returned by Marketing Cloud
     * @type {Object}
     * @property {string} accessToken The token auth string
     * @property {string} tokenType Will be “Bearer”
     * @property {number} expiresIn Expiration in seconds, relative to when requested
     * @property {number} issued Date issued in milliseconds
     * @property {number} expires Date expires in milliseconds
     * @property {string} scope Scope values assigned to the client ID and secret pair, returns all the allowed scopes
     * @property {string} soapInstanceURL SOAP based URL for making the API calls
     * @property {string} restInstanceURL REST based URL for making the API calls
     */
    this.token = null;
}

/**
 * @alias module:models/authToken~AuthToken#prototype
 */
NzAuthToken.prototype = {
    isValidAuth: function isValid() {
        return isValidAuth.apply(this);
    },

    getValidToken: function getValid() {
        return getValidToken.apply(this);
    },

    refreshToken: callService
};

module.exports = NzAuthToken;
