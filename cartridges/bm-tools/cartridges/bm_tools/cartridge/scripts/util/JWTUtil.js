'use strict';

/**
 * @module JWTUtil
 */

var Signature = require('dw/crypto/Signature');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');
var KeyRef = require('dw/crypto/KeyRef');

/**
 * Encodes in base64, and removes extra characters and trailing "=" as
 * per https://datatracker.ietf.org/doc/html/rfc7515#section-2
 *
 * @param {string} data The raw input data
 * @returns {string} A Base64 string with replaced chars
 */
function base64SafeEncode(data) {
    return safeEncode(Encoding.toBase64(data));
}

/**
 * URL Encode the Base64 string (pseudo-standard)
 *
 * Replace "+" with "-"
 * Replace "/" with "_"
 * Cut off the trailing "=="
 *
 * @param {*} data The input string, expected in base64 format
 * @returns {string} The string with replaced chars
 */
function safeEncode(data) {
    return data.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, ''); // eslint-disable-line no-useless-escape
}

/**
 * Generate a JWT
 * @param {Object} payload The payload the sign
 * @param {Object} privateKeyName Name of the private key (installed on the BM)
 * @returns {String} JWT
 */
function getJWTWithCertificate(payload, privateKeyName) {
    var encoder = new Signature();
    var PRIVATEKEY = new KeyRef(privateKeyName);

    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    // Encode the Header as Base64
    const headerBase64 = base64SafeEncode(new Bytes(JSON.stringify(header)));

    // Encode the Payload as Base64
    const payloadBase64 = base64SafeEncode(new Bytes(JSON.stringify(payload)));

    // Create the content of the JWT Signature
    var signature = base64SafeEncode(
        new Bytes(headerBase64 + '.' + payloadBase64)
    );

    // Encrypt the Signature (in RS256) - returns a Base64 String
    var signatureUrlEncoded = safeEncode(
        encoder.sign(signature, PRIVATEKEY, 'SHA256withRSA')
    );

    // Now, create the signed JWT: Header + Payload + Signature concatenated with a dot
    const jwt = headerBase64 + '.' + payloadBase64 + '.' + signatureUrlEncoded;

    return jwt;
}

module.exports = {
    getJWTWithCertificate: getJWTWithCertificate,
};
