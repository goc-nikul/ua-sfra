/**
 * Class to generate signed JWT
 *
 * @module int_mao/scripts
 */
'use strict';

var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');
var Signature = require('dw/crypto/Signature');

/**
 * Base64 URL encodes the given bytes.
 * @param {Bytes} bytes - The bytes to encode.
 * @returns {string} The base64 URL encoded string.
 */
function base64UrlEncodeBytes(bytes) {
    return Encoding.toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, ''); // eslint-disable-line
}

/**
 * Base64 URL encodes the given string.
 * @param {string} string - The base64 string to encode.
 * @returns {string} The base64 URL encoded string.
 */
function base64UrlEncode(string) {
    return string.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/m, ''); // eslint-disable-line
}

/**
 * Generates a JSON Web Token (JWT) using the provided payload and private key.
 * @param {Object} payload - The payload to include in the JWT.
 * @param {string} privateKeyId - The private key ID to include in the JWT.
 * @param {string} privateKey - The private key used for signing.
 * @returns {string} The generated JWT.
 */
function generateJWT(payload, privateKeyId, privateKey) {
    if (!payload || !privateKeyId || !privateKey) {
        return '';
    }
    // Encode the header and payload as base64 URL strings
    var header = base64UrlEncodeBytes(new Bytes(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: privateKeyId })));
    var payloadEncoded = base64UrlEncodeBytes(new Bytes(JSON.stringify(payload)));

    // Concatenate the encoded header and payload with a period separator
    var token = header + '.' + payloadEncoded;
    var contentToSign = Encoding.toBase64(new Bytes(token));

    var signature = new Signature();
    var cleanPrivatKey = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace(/\n/gi, '').replace('-----END PRIVATE KEY-----', '');
    var signatureJWT = signature.sign(contentToSign, cleanPrivatKey, 'SHA256withRSA');
    var signedJWT = token + '.' + base64UrlEncode(signatureJWT);

    return signedJWT;
}

exports.generateJWT = generateJWT;
