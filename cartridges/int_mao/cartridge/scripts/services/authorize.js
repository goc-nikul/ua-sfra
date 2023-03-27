/* eslint vars-on-top: 0 */
/* eslint new-cap: 0 */

/**
 * Class to calculate signature
 *
 * @module int_mao/scripts
 */
'use strict';

var Utils = require('~/cartridge/scripts/helper/utils');
const Logger = require('dw/system/Logger').getLogger('MaoOrderExport', 'MaoOrderExport');

var Mac = require('dw/crypto/Mac');
var MessageDigest = require('dw/crypto/MessageDigest');
var Bytes = require('dw/util/Bytes');
var Encoding = require('dw/crypto/Encoding');

/**
 * @param {Object} headers  Header key-value pairs.
 * @returns {string}  Processed headers for canonical request.
 */
function createHeaders(headers) {
    // eslint-disable-next-line no-param-reassign
    headers = Utils.arrayChangeKeyCase(headers);
    // Sorting the headers by key
    // eslint-disable-next-line no-param-reassign
    headers = Utils.ksort(headers);
    // Creating the result string
    var canonicalHeaders = '';

    Object.keys(headers).forEach(function mapHeaders(headerKey) {
        canonicalHeaders += headerKey + ':' + ('' + headers[headerKey]).trim() + '\n';
    });

    return canonicalHeaders + '\n' + Object.keys(headers)
        .join(';');
}

/**
 * @param {string} method  Method to use in request.
 * @param {string} url  URL to send the request to.
 * @param {Object} headers  List of the used request headers.
 * @returns {string}  The formatted canonical request
 */
function createRequest(method, url, headers) {
    var hasher = new MessageDigest(MessageDigest.DIGEST_SHA_256);
    // Parsing the query string of the url to an associative object
    var query = Utils.parseUrl(url, 'query');

    if (query) {
        query = Utils.ksort(Utils.parseStr(query));
    }

    var CanonicalRequest = [
        method,
        Utils.parseUrl(url, 'path'),
        query ? Utils.httpBuildQuery(query) : '',
        createHeaders(headers),
        hasher.digest(new Bytes('', 'UTF-8'))
    ].join('\n');

    Logger.debug('CanonicalRequest :: {0}', CanonicalRequest);

    return CanonicalRequest;
}

/**
 * @param {string} method  Method to use in request.
 * @param {string} url  URL to send the request to.
 * @param {string} region  aws region
 * @param {string} service  service name
 * @param {string} time  time formatted
 * @returns {string}  The formatted signature string
 */
function generateSignatureString(method, url, region, service, time) {
    var hasher = new MessageDigest(MessageDigest.DIGEST_SHA_256);
    var canonicalRequest = createRequest(method, url, {
        Host: Utils.parseUrl(url, 'host'),
        Date: Utils.gmdate("yyyy-MM-dd'T'HH:mm:ss+00:00", time)
    });

    var SignatureString = [
        'AWS4-HMAC-SHA256',
        Utils.gmdate('yyyyMMdd', time) + 'T' + Utils.gmdate('HHmmss', time) + 'Z',
        [
            Utils.gmdate('yyyyMMdd', time),
            region,
            service,
            'aws4_request'
        ].join('/'),
        hasher.digest(new Bytes(canonicalRequest, 'UTF-8'))
    ].join('\n');

    Logger.debug('SignatureString :: {0}', SignatureString);
    return SignatureString;
}

/**
 * Derives signing key based on current date, secret key, used region
 * and service.
 *
 * @param {string} service  service name
 * @param {string} region  aws region
 * @param {string} time  time formatted
 * @param {string} secret  aws account secret key
 * @returns {string}  Hash value in raw binary representation.
 */
function generateSigningKey(service, region, time, secret) {
    var signingKey = Mac(Mac.HMAC_SHA_256)
        .digest(
            'aws4_request',
            Mac(Mac.HMAC_SHA_256)
            .digest(
                service,
                Mac(Mac.HMAC_SHA_256)
                .digest(
                    region,
                    Mac(Mac.HMAC_SHA_256)
                    .digest(
                        Utils.gmdate('yyyyMMdd', time),
                        'AWS4' + secret
                    )
                )
            )
        );

    return signingKey;
}

/**
 * @param {Object} params - parameters for service
 * @returns {Object}  The InitializeSignature class' instance.
 */
function InitializeSignature(params) {
    var region = params.awsRegion;
    var key = params.accessKey;
    var secret = params.secretKey;
    var service = params.servicename;
    var time = params.time;
    var authorization = params.authorization;

    /**
     * @param {string} method  Method to use in request.
     * @param {string} url  URL to send the request to.
     * use as request body for others.
     * @returns {string}  The calculated signature string what will be appended
     * to the request.
     */
    function calculateServiceSignature(method, url) {
        var signatureString = generateSignatureString(
            method,
            url,
            region,
            service,
            time
        );
        var signingKey = generateSigningKey(service, region, time, secret);

        var serviceSignature = Encoding.toHex(
            Mac(Mac.HMAC_SHA_256)
            .digest(
                signatureString,
                signingKey
            )
        );

        return serviceSignature;
    }

    /**
     * @param {string} signature  The calculated signature string.
     * @returns {string}  The entire "Authorization" header with API scopes.
     */
    function getServiceAuthorizationHeader(signature) {
        var authHeader = (authorization)
            .replace('{apiKey}', key)
            .replace('{date}', Utils.gmdate('yyyyMMdd', time))
            .replace('{region}', region)
            .replace('{service}', service)
            .replace('{signature}', signature);

        return authHeader;
    }

    return {
        calculateServiceSignature: calculateServiceSignature,
        getServiceAuthorizationHeader: getServiceAuthorizationHeader
    };
}

exports.InitializeSignature = InitializeSignature;
