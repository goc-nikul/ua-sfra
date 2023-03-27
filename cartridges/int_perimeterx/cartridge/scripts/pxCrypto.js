var pbkdf2Hasher = require('./crypt/pbkdf2');
var utils = require('./crypt/utils');
var MAC = require('dw/crypto/Mac');
var hmac = new MAC(MAC.HMAC_SHA_256);
var Encoding = require('dw/crypto/Encoding');

/**
 * Returns PBKDF2 deriviation in byte array.
 * @param  {string} password   hash password
 * @param  {string} salt       hash salt
 * @param  {number} iterations number of iterations
 * @param  {number} keylen     length of key
 * @return {[array]}            PBKDF2 deriviation in byte array
 */
function pbkdf2(password, salt, iterations, keylen) {
    return pbkdf2Hasher(password, salt, iterations, keylen);
}

/**
 * Method for calculating an HMAC based on key and message
 * @param  {string} message the HMAC content
 * @param  {string} key     the HMAC key
 * @return {string}         the calcuated HMAC as hex string
 */
function hmacSign(message, key) {
    var encodedKey = Encoding.fromHex(utils.bytesToHex(utils.stringToBytes(key)));
    var encodedMessage = Encoding.fromHex(utils.bytesToHex(utils.stringToBytes(message)));

    var newHmac = hmac.digest(encodedMessage, encodedKey);
    return Encoding.toHex(newHmac);
}

module.exports = {
    pbkdf2: pbkdf2,
    hmacSign: hmacSign
};
