'use strict';

// API includes
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');

/**
 * Function that returns list of configured values
 * @returns {Object} object containing configured values
 */
function getConfigurations() {
    return {
        username: Site.current.getCustomPreferenceValue('NiceIDUsername'),
        secret: Site.current.getCustomPreferenceValue('NiceIDSecret'),
        productID: Site.current.getCustomPreferenceValue('NiceIDProductID')
    };
}

/**
 * stores list of api endpoints
 * @returns {Object} endpoints
 */
function getEndpoints() {
    return {
        AUTHTOKEN: '/digital/niceid/oauth/oauth/token',
        CRYPTOTOKEN: '/digital/niceid/api/v1.0/common/crypto/token'
    };
}

/**
 * to ge the customObject of the authToken
 * @returns {Object} authToken object
 */
function getTokenCustomObject() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var siteID = Site.getCurrent().getID();
    var tokenObj = CustomObjectMgr.getCustomObject('NiceIDAuthToken', siteID);
    if (empty(tokenObj)) {
        Transaction.wrap(function () {
            tokenObj = CustomObjectMgr.createCustomObject('NiceIDAuthToken', siteID);
        });
    }
    return tokenObj.custom;
}

/**
 * Function will update or create a custom object to store the token and its expiry time
 * @param {Object} tokenResponse token response
 */
function saveTokenInCustomObject(tokenResponse) {
    var custObj = getTokenCustomObject();
    Transaction.wrap(function () {
        custObj.token = tokenResponse.dataBody.access_token; // eslint-disable-line no-param-reassign
        var expiryTimeInMilliSeconds = Date.now() + (parseInt(tokenResponse.dataBody.expires_in, 10) * 1000);
        custObj.expires = expiryTimeInMilliSeconds.toString(); // eslint-disable-line no-param-reassign
    });
}

/**
 * Function will retrieve auth token from NiceID
 * @param {dw.object.CustomObject} custObj custom object to store data
 */
function generateAuthToken() {
    var StringUtils = require('dw/util/StringUtils');
    var NiceIDService = require('*/cartridge/scripts/services/NiceIDService').createNiceIDService();
    var NiceIDConfigs = getConfigurations();
    var username = NiceIDConfigs.username;
    var secret = NiceIDConfigs.secret;
    NiceIDService.URL += getEndpoints().AUTHTOKEN;
    NiceIDService.addParam('grant_type', 'client_credentials');
    NiceIDService.addParam('scope', 'default');
    NiceIDService.setRequestMethod('POST');
    NiceIDService.addHeader('Content-Type', 'application/json');
    NiceIDService.addHeader('Accept', 'application/json');

    var authString = 'Basic ' + StringUtils.encodeBase64(username + ':' + secret);
    NiceIDService.addHeader('Authorization', authString);
    var result = NiceIDService.call();
    if (result.status === 'OK' && result.object && result.object.text) {
        var tokenResponse = JSON.parse(result.object.text);
        if (tokenResponse.dataHeader.GW_RSLT_CD === '1200' && tokenResponse.dataBody.access_token) {
            saveTokenInCustomObject(tokenResponse);
        } else {
            Logger.error('NiceID - Failed to generate auth token. Response: ' + result.object.text);
        }
    }
}

/**
 * Function will check if auth token is present and if it has expired
 * @returns {boolean} token validity
 */
function isValidAuthToken() {
    var tokenObj = getTokenCustomObject();
    return ('token' in tokenObj && 'expires' in tokenObj && !empty(tokenObj.token) && !empty(tokenObj.expires) && Date.now() < parseInt(tokenObj.expires, 10));
}

/**
 * Function will generate crypto token from NiceID
 * @param {string} authToken auth token
 * @returns {Object} object containing token and encryption request data
 */
function generateCryptoToken(authToken) {
    var StringUtils = require('dw/util/StringUtils');
    var Calendar = require('dw/util/Calendar');
    var NiceIDService = require('*/cartridge/scripts/services/NiceIDService').createNiceIDService();
    var NiceIDConfigs = getConfigurations();
    var username = NiceIDConfigs.username;
    var productID = NiceIDConfigs.productID;
    NiceIDService.URL += '/digital/niceid/api/v1.0/common/crypto/token';
    NiceIDService.setRequestMethod('POST');
    NiceIDService.addHeader('Content-Type', 'application/json');
    NiceIDService.addHeader('Accept', 'application/json');
    const now = new Calendar();
    const currentTimestamp = now.getTime().getTime();
    const authCreds = authToken + ':' + currentTimestamp + ':' + username;
    var authString = 'Bearer ' + StringUtils.encodeBase64(authCreds);
    NiceIDService.addHeader('Authorization', authString);
    NiceIDService.addHeader('ProductID', productID);
    const reqDtim = StringUtils.formatCalendar(now, 'yyyyMMddHHmmss');
    const reqNo = StringUtils.formatCalendar(now, 'yyyyMMddHHmmss') + '0000000000000000';
    session.privacy.NiceIDAuthToken = authToken;
    session.privacy.NiceIDReqNo = reqNo;
    session.privacy.NiceIDReqDtim = reqDtim;
    const reqBody = {
        dataHeader: {
            CNTY_CD: 'ko'
        },
        dataBody: {
            req_dtim: reqDtim,
            req_no: reqNo,
            enc_mode: '1'
        }
    };
    var result = NiceIDService.call(JSON.stringify(reqBody));
    if (result.status === 'OK' && result.object && result.object.text) {
        const response = JSON.parse(result.object.text);
        if (response.dataHeader.GW_RSLT_CD === '1200' && response.dataBody.rsp_cd === 'P000') {
            session.privacy.NiceIDCryptoToken = response.dataBody.token_val;
            return {
                authToken: authToken,
                cryptoToken: response.dataBody.token_val,
                site_code: response.dataBody.site_code,
                token_version_id: response.dataBody.token_version_id,
                reqNo: reqNo,
                reqDtim: reqDtim
            };
        }
        Logger.error('NiceID - Failed to generate crypto token. Response: ' + result.object.text);
    }
    return null;
}

/**
 * Computes the SHA-256 hash of the given data.
 *
 * @param {string|Buffer} data - The data to be hashed.
 * @returns {string} The SHA-256 hash.
 */
function sha256(data) {
    var MessageDigest = require('dw/crypto/MessageDigest');
    var digest = new MessageDigest(MessageDigest.DIGEST_SHA_256);
    return digest.digestBytes(data);
}

/**
 * Function will encrypt data to send to NiceID
 * @param {Object} data object containing request data
 * @returns {Object} object containing encrypted data, token version and integrity value to be sent to NiceID
 */
function encryptData(data) {
    var URLUtils = require('dw/web/URLUtils');
    var Cipher = require('dw/crypto/Cipher');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var Mac = require('dw/crypto/Mac');
    const value = data.reqDtim.trim() + data.reqNo.trim() + data.cryptoToken;
    const encodedValue = Encoding.toBase64(sha256(new Bytes(value, 'UTF8')));
    const encryptionValue = {
        key: encodedValue.substring(0, 16),
        iv: encodedValue.substring(encodedValue.length - 16),
        hmac_key: encodedValue.substring(0, 32)
    };

    const reqData = {
        requestno: data.reqNo,
        returnurl: URLUtils.abs('Login-MobileAuthReturn').toString(),
        sitecode: data.site_code,
        methodtype: 'get',
        popupyn: 'Y',
        receivedata: 'xxxxdddeee'
    };

    const cipher = new Cipher();
    const encryptedReqData = cipher.encrypt(
        JSON.stringify(reqData),
        Encoding.toBase64(new Bytes(encryptionValue.key, 'UTF8')),
        'AES/CBC/PKCS5Padding',
        Encoding.toBase64(new Bytes(encryptionValue.iv, 'UTF8')),
        0
    );

    const integrityValue = new Mac(Mac.HMAC_SHA_256).digest(
        encryptedReqData,
        encryptionValue.hmac_key
    );

    return {
        enc_data: encryptedReqData,
        integrity_value: Encoding.toBase64(integrityValue),
        token_version_id: data.token_version_id
    };
}

/**
 * Decrypts data returned from NiceID
 * @param {string} encryptedData encrypted data returned from NiceID
 * @returns {Object} decrypted data
 */
function decryptReturnData(encryptedData) {
    var Cipher = require('dw/crypto/Cipher');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var reqNo = session.privacy.NiceIDReqNo;
    var reqDtim = session.privacy.NiceIDReqDtim;
    var cryptoToken = session.privacy.NiceIDCryptoToken;
    const value = reqDtim.trim() + reqNo.trim() + cryptoToken.trim();
    const encodedValue = Encoding.toBase64(sha256(new Bytes(value, 'UTF8')));
    const encryptionValue = {
        key: encodedValue.substring(0, 16),
        iv: encodedValue.substring(encodedValue.length - 16),
        hmac_key: encodedValue.substring(0, 32)
    };

    const cipher = new Cipher();
    const decryptedRetData = cipher.decrypt(
        encryptedData,
        Encoding.toBase64(new Bytes(encryptionValue.key, 'UTF8')),
        'AES/CBC/PKCS5Padding',
        Encoding.toBase64(new Bytes(encryptionValue.iv, 'UTF8')),
        0
    );
    return decryptedRetData;
}

/**
 * Query customer profiles to find the ones with same ssn
 * @param {string} ci ci information
 * @param {string} email customer email
 * @returns {Array} array of profiles with duplicate ci information
 */
function getProfilesWithDuplicateCI(ci, email) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    if (!empty(email)) {
        return CustomerMgr.searchProfiles('custom.CI = {0} AND email != {1}', null, ci, email).asList().toArray();
    }
    return CustomerMgr.searchProfiles('custom.CI = {0}', null, ci).asList().toArray();
}

/**
 * Fetches data received from NiceID that was saved in session
 * @returns {Object} data to be used in the form
 */
function getDataFromSession() {
    var data = {};
    if (session.privacy.mobileAuthCI) {
        var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
        data.mobileAuthCI = session.privacy.mobileAuthCI;
        data.name = session.privacy.mobileAuthName;
        data.gender = session.privacy.mobileAuthGender;

        data.phone = session.privacy.mobileAuthMobile;
        var splitPhone = addressHelper.splitPhoneField(session.privacy.mobileAuthMobile);
        data.phone1 = splitPhone[0];
        data.phone2 = splitPhone[1];
        data.phone3 = splitPhone[2];

        data.birthYear = session.privacy.mobileAuthBirthDate.substring(0, 4);
        data.birthMonth = session.privacy.mobileAuthBirthDate.charAt(4) === '0' ? session.privacy.mobileAuthBirthDate.substring(5, 6) : session.privacy.mobileAuthBirthDate.substring(4, 6);
        data.birthDay = session.privacy.mobileAuthBirthDate.charAt(6) === '0' ? session.privacy.mobileAuthBirthDate.substring(7) : session.privacy.mobileAuthBirthDate.substring(6);
    }
    return data;
}

/**
 * Checks if customer is of legal age
 * @param {string} birthdateString birthdate as string eg: 20000113
 * @returns {boolean} true if over legal age
 */
function validateAge(birthdateString) {
    const minimumAgeRestriction = require('*/cartridge/config/preferences').MinimumAgeRestriction;
    const year = parseInt(birthdateString.substr(0, 4), 10);
    const month = parseInt(birthdateString.substr(4, 2), 10) - 1;
    const day = parseInt(birthdateString.substr(6, 2), 10);
    const birthdate = new Date(year, month, day);
    const age = new Date().getFullYear() - birthdate.getFullYear();

    return age >= minimumAgeRestriction;
}

module.exports = {
    getConfigurations: getConfigurations,
    getEndpoints: getEndpoints,
    generateAuthToken: generateAuthToken,
    getTokenCustomObject: getTokenCustomObject,
    isValidAuthToken: isValidAuthToken,
    generateCryptoToken: generateCryptoToken,
    encryptData: encryptData,
    decryptReturnData: decryptReturnData,
    getProfilesWithDuplicateCI: getProfilesWithDuplicateCI,
    getDataFromSession: getDataFromSession,
    validateAge: validateAge
};
