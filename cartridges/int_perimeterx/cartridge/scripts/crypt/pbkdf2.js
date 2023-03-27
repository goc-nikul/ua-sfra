var utils = require('./utils');
var MAC = require('dw/crypto/Mac');
var Encoding = require('dw/crypto/Encoding');

/**
 * Returns PBKDF2 deriviation in bytes.
 *
 * @param {string} password Password to use for the hashing
 * @param {string} salt The salt value to use for the hashing
 * @param {number} iterations The number of iterations to use for the hashing
 * @param {number} keylen The length of the key
 * @return {array} PBKDF2 deriviation in bytes.
 */
function PBKDF2(password, salt, iterations, keylen) {
    var decodedSalt = utils.bytesToArray(Encoding.fromBase64(salt));
    var hmac = new MAC(MAC.HMAC_SHA_256);
    var saltBytes;

    // Convert to Bytes
    var passwordBytes = Encoding.fromHex(utils.bytesToHex(utils.stringToBytes(password)));

    // Generate key
    var derivedKeyBytes = [];
    var blockindex = 1;
    while (derivedKeyBytes.length < keylen) {
        saltBytes = Encoding.fromHex(utils.bytesToHex(decodedSalt.concat(utils.wordsToBytes([blockindex]))));
        var block = hmac.digest(saltBytes, passwordBytes);
        var blockByteArray = utils.hexToBytes(Encoding.toHex(block));

        for (var u = blockByteArray, i = 1; i < iterations; i++) {
            var uBytes = Encoding.fromHex(utils.bytesToHex(u));
            var newHmac = hmac.digest(uBytes, passwordBytes);
            u = utils.hexToBytes(Encoding.toHex(newHmac));
            for (var j = 0; j < blockByteArray.length; j++) blockByteArray[j] ^= u[j];
        }
        derivedKeyBytes = derivedKeyBytes.concat(blockByteArray);
        blockindex++;
    }

    // Truncate excess bytes
    derivedKeyBytes.length = keylen;
    return derivedKeyBytes;
}

module.exports = PBKDF2;
