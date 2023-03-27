    'use strict';

/**
 * Custom object name
 * @const {string}
 * @private
 */
    const customObjectName = 'UACAPIAuthToken';
    var Calendar = require('dw/util/Calendar');
    var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
    const LoyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    var LoyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');

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
        var id = 'UACAPIAuthTokenValue';
        return getCustomObject(id, true);
    }

/**
 * Puts token into custom object storage
 * @param {Object} object A plain JS object with the token
 * @returns {Object} Returns the same plain JS object
 */
    function updateCachedTokenObject(object) {
    // eslint-disable-next-line no-param-reassign
        var obj = object;
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
            issued: obj.issued,
            expires: tokenExpiryTime.getTime()
        };

        require('dw/system/Transaction').wrap(function () {
            customObject.token = JSON.stringify(tokenObject);
            customObject.expires = tokenExpiryTime.getTime();
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
        if (!this.isValidAuth()) {
            var payload = LoyaltyServiceHelper.getUACAPITokenServiceRequest();
            var createOauthTokenService = LoyaltyDataService.getTokenData();
            var result = createOauthTokenService.call({
                payload: payload
            });
            if (result.status === 'OK' && result.object) {
                this.token = updateCachedTokenObject(result.object);
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
     * Token object returned by OIS
     * @type {Object}
     * @property {string} accessToken The token auth string
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
        }
    };

    module.exports = AuthToken;
