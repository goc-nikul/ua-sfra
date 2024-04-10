'use strict';

var AbstractMobileAuthProvider = require('./AbstractMobileAuthProvider');
var NiceIDHelpers = require('*/cartridge/scripts/helpers/NiceIDHelpers');
var Logger = require('dw/system/Logger').getLogger('NiceID');

var NiceIDMobileAuthProvider = AbstractMobileAuthProvider.extend({
    /**
     * Gets authentication token
     * @returns {dw.object.CustomObject} custom object containing token and expiry time.
     */
    getValidToken: function () {
        try {
            if (!NiceIDHelpers.isValidAuthToken()) {
                NiceIDHelpers.generateAuthToken();
            }
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js getValidToken() -> Failed to get valid token ' + e.message + e.stack);
        }
        var token = NiceIDHelpers.getTokenCustomObject();
        return token;
    },

    /**
     * Calls helper to generate new auth token
     */
    refreshToken: function () {
        try {
            NiceIDHelpers.generateAuthToken();
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js refreshToken() -> Failed to refresh token ' + e.message + e.stack);
        }
    },

    /**
     * Gets NiceID crypto token used for encryption
     * @param {string} authToken auth token
     * @returns {Object} crypto token
     */
    getCryptoToken: function (authToken) {
        try {
            return NiceIDHelpers.generateCryptoToken(authToken);
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js getCryptoToken() -> Failed to generate crypto token ' + e.message + e.stack);
        }
        return null;
    },

    encryptData: function (data) {
        var encryptedData;
        try {
            encryptedData = NiceIDHelpers.encryptData(data);
            session.privacy.NiceIDTokenVersion = encryptedData.token_version_id;
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js encryptData() -> Failed to encrypt data ' + e.message + e.stack);
        }
        return encryptedData || null;
    },

    decryptData: function (encryptedData) {
        var decryptedData;
        try {
            decryptedData = JSON.parse(NiceIDHelpers.decryptReturnData(encryptedData));
            decryptedData.utf8_name = decodeURIComponent(decryptedData.utf8_name);
            session.privacy.mobileAuthCI = decryptedData.ci;
            session.privacy.mobileAuthName = decryptedData.utf8_name;
            session.privacy.mobileAuthMobile = decryptedData.mobileno;
            session.privacy.mobileAuthGender = decryptedData.gender;
            session.privacy.mobileAuthBirthDate = decryptedData.birthdate;
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js decryptData() -> Failed to decrypt data ' + e.message + e.stack);
        }
        return decryptedData || null;
    },

    checkCIDuplication: function (returnData, email) {
        var profiles = null;
        try {
            profiles = NiceIDHelpers.getProfilesWithDuplicateCI(returnData.ci, email);
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js checkCIDuplication() -> ' + e.message + e.stack);
        }
        return profiles;
    },

    getDataFromSession: function () {
        var data = null;
        try {
            data = NiceIDHelpers.getDataFromSession();
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js getDataFromSession() -> ' + e.message + e.stack);
        }
        return data;
    },

    validateAge: function (birthdateString) {
        var isValidAge = false;
        try {
            isValidAge = NiceIDHelpers.validateAge(birthdateString);
        } catch (e) {
            Logger.error('NiceIDMobileAuthProvider.js validateAge() -> ' + e.message + e.stack);
        }
        return isValidAge;
    }
});

module.exports = NiceIDMobileAuthProvider;
