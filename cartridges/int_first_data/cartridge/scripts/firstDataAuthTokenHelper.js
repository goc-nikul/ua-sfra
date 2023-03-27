    'use strict';


/**
 * Custom object name
 * @const {string}
 * @private
 */
    const customObjectName = 'FirstDataAuthToken';
    var Calendar = require('dw/util/Calendar');
    var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
    const firstDataPreferences = require('~/cartridge/scripts/firstDataPreferences');
    const Logger = require('dw/system/Logger').getLogger('FirstData', 'FirstData');

/**
 * Fetches object definition from Custom Object, creating it if not exists
 * @param {string} objectID - custom Object ID
 * @param {boolean} createIfNotExists - flag to create the custom object
 * @returns {dw.object.CustomAttributes} - custom attributes of custom object
 */
    function getCustomObject(objectID, createIfNotExists) {
        var com = require('dw/object/CustomObjectMgr');
        var objectDefinition = com.getCustomObject(customObjectName, objectID);
        if (empty(objectDefinition) && createIfNotExists === true) {
            require('dw/system/Transaction').wrap(function () {
                objectDefinition = com.createCustomObject(customObjectName, objectID);
            });
        }
        return objectDefinition.getCustom();
    }


/**
 * Retrieves cached token from custom object storage
 * If no existing token object, an empty one is created
 * @returns {dw.object.CustomAttributes} Returns token custom attributes
 */
    function getObject() {
        var id = firstDataPreferences.authHostname.replace('https://', 'https://' + encodeURIComponent(firstDataPreferences.clientId + '@'));
        return getCustomObject(id, true);
    }

/**
 * Puts token into custom object storage
 * @param {Object} obj A plain JS object with the token
 * @returns {Object} Returns the same plain JS object
 */
    function updateCachedTokenObject(obj) {
    // eslint-disable-next-line no-param-reassign
        obj = JSON.parse(obj.text);
        var timezoneHelper = new TimezoneHelper();
        var tokenExpiryTime = new Calendar(timezoneHelper.getCurrentSiteTime());
        tokenExpiryTime.add(tokenExpiryTime.SECOND, obj.expires_in);

        var customObject = getObject();
        const tokenObject = {	// creating new object with property names matching the rest of the application.
            accessToken: obj.access_token,
            tokenType: obj.token_type,
            expiresIn: obj.expires_in,
            scope: obj.scope,
            expires: tokenExpiryTime.getTime()
        };

        require('dw/system/Transaction').wrap(function () {
            customObject.token = JSON.stringify(tokenObject);
            customObject.expires	= tokenExpiryTime.getTime();
        });

        return tokenObject;
    }

/**
 * Returns whether the stored token is valid
 * @returns {boolean} Whether the stored token is valid and not expired
 * @alias module:models/authToken~AuthToken#isValidAuth
 */
    function isValidAuth() {
        var timezoneHelper = new TimezoneHelper();
        if (!this.token || !this.token.accessToken) {
            var cachedToken = getObject();
            if (!cachedToken || !cachedToken.token) {
                return false;
            }
            this.token = JSON.parse(cachedToken.token);
            this.token.expires = cachedToken.expires;
        }
        var currentDate = new Calendar(timezoneHelper.getCurrentSiteTime());
    // check if expires is in the future
        return this.token && this.token.accessToken && currentDate.before(new Calendar(this.token.expires));
    }

/**
 * Gets a valid token from storage or from a new auth request
 * @returns {boolean|Object} False or plain JS object containing the token response
 * @alias module:models/authToken~AuthToken#getValidToken
 */
    function getValidToken() {
        const firstDataHelper = require('*/cartridge/scripts/firstDataHelper');
        if (!this.isValidAuth()) {
            var result = firstDataHelper.getAuthAccessToken();
            if (firstDataHelper.validateServiceResponse(result)) {
                this.token = updateCachedTokenObject(result.object);
            } else {
                Logger.error('Did not get token in service response or error in firstData.auth0.token service. Please check the service logs for details.');
            }
        }

        return this.isValidAuth() && this.token;
    }

/**
 * Token class for checking auth and retrieving valid token
 * @constructor
 * @alias module:models/authToken~AuthToken
 */
    function AuthToken() {
    /**
     * Token object returned by FirstData
     * @type {Object}
     * @property {string} accessToken The token auth string
     * @property {string} tokenType Will be “Bearer”
     * @property {number} expiresIn Expiration in seconds, relative to when requested
     * @property {string} scope Scope values assigned to the client ID and secret pair, returns all the allowed scopes
     */
        this.token = null;
    }

/**
 * @alias module:models/authToken~AuthToken#prototype
 */
    AuthToken.prototype = {
        isValidAuth: function isValid() {
            return isValidAuth.apply(this);
        },

        getValidToken: function getValid() {
            return getValidToken.apply(this);
        },
        refreshToken: function () {
            var firstDataHelper = require('*/cartridge/scripts/firstDataHelper');
            var result = firstDataHelper.getAuthAccessToken();
            if (firstDataHelper.validateServiceResponse(result)) {
                this.token = updateCachedTokenObject(result.object);
            }
        }
    };

    module.exports = AuthToken;
