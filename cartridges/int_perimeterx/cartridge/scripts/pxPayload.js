var Cipher = require('dw/crypto/Cipher');
var pxCrypto = require('./pxCrypto');
var utils = require('./crypt/utils');
var Encoding = require('dw/crypto/Encoding');
var CacheMgr =require('dw/system/CacheMgr');

/**
 * PerimeterX payload handling constructor
 */
function PXPayload() {
    // cookie string
    this.pxCookie = '';

    // decoded cookie string
    this.decodedCookie = '';

    // cookie secret string
    this.cookieSecret = '';

    // cookie hmac
    this.hmac = '';
}

/**
 * Returns the timestamp from PerimeterX _px3 cookie
 * @return {string} timestamp in unix
 */
PXPayload.prototype.getTime = function () {
    return this.decodedCookie.t;
};

/**
 * Method that deserialize the PerimeterX cookie
 * @return {boolean} true if cookie successfully deserialized
 */
PXPayload.prototype.deserialize = function () {
    if (this.decodedCookie) {
        return true;
    }

    var cookie;

    try {
        cookie = this.decrypt();
    } catch (e) {
        cookie = '';
    }

    if (cookie === '' || !this.isCookieFormatValid(cookie)) {
        return false;
    }

    this.decodedCookie = cookie;
    return true;
};

/**
 * Method that decrypt the PerimeterX cookie
 * @return {object} Decrypted cookie content as JSON
 */
PXPayload.prototype.decrypt = function () {
    var data = this.pxCookie.split(':');
    var crypto = new Cipher();
    var ivlen = 16;
    var keylen = 32;

    if (data.length !== 3) {
        return '';
    }

    var iterations = parseInt(data[1], 10);
    var encryptedCookie = data[2];

    /* iterations value is not a number */
    if (!iterations) {
        return '';
    }

    var salt = data[0];

    /* iterations value is not in the legit range */
    if (iterations > 5000 || iterations < 500) {
        return '';
    }

    /* salt value is not as expected */
    if (!salt || typeof salt !== 'string' || salt.length > 100) {
        return '';
    }

    /* cookie value is not as expected */
    if (!encryptedCookie || typeof encryptedCookie !== 'string') {
        return '';
    }

    var pxCache = CacheMgr.getCache('PXHash');
    var cacheKey = pxCache.get(salt);
    var parsedIV;
    var parsedKey;
    if (cacheKey !== undefined) {
        try{
            var cacheObject = JSON.parse(cacheKey);
            parsedKey = cacheObject.key;
            parsedIV = cacheObject.iv;
        } catch(e) {
            pxLogger.debug('failed to use cache for: '+ salt);
        }
    } else {
        var derivation = pxCrypto.pbkdf2(this.cookieSecret, salt, iterations, ivlen + keylen);
        var key = derivation.slice(0,32);
        var iv = derivation.slice(32);
        parsedIV = Encoding.toBase64(Encoding.fromHex(utils.bytesToHex(iv)));
        parsedKey = Encoding.toBase64(Encoding.fromHex(utils.bytesToHex(key)));
        var value = {
            key: parsedKey,
            iv: parsedIV
        };
        pxCache.put(salt, JSON.stringify(value));
    }

    var decrypted = crypto.decrypt(encryptedCookie, parsedKey, 'AES/CBC/NOPADDING', parsedIV, 0);
    decrypted = decrypted.substring(0, decrypted.lastIndexOf('}') + 1);
    return JSON.parse(decrypted);
};

/**
 * Verifies if a PerimeterX cookie is expred
 * @return {Boolean} true if expired
 */
PXPayload.prototype.isExpired = function () {
    return this.decodedCookie.t < Date.now();
};

/**
 * Verifies if the score of the PerimeterX cookie is higher/equals to the blocking score configured in pxConfig object
 * @return {Boolean} true if higher/equals to the pxConfig blocking score
 */
PXPayload.prototype.isHighscore = function () {
    return this.getScore() >= this.pxConfig.blockingScore;
};

/**
 * Verifies the PerimeterX cookie HMAC
 * @param  {string}  hmacStr    hmac extracted from the PerimeterX cookie
 * @param  {string}  cookieHmac calculated hmac based on the cookie fields
 * @return {Boolean}            true if valid
 */
PXPayload.prototype.isHmacValid = function (hmacStr, cookieHmac) {
    try {
        var hmac = pxCrypto.hmacSign(hmacStr, this.cookieSecret);
        return hmac === cookieHmac;
    } catch (err) {
        return false;
    }
};

module.exports = PXPayload;
