var Site = require('dw/system/Site');

var vertexLogger = require('int_vertex/cartridge/scripts/lib/GeneralLogger');
var moduleName = 'DeleteRequest~';

function getRequestOriginData() {
    return 'httpRemoteAddress: ' + request.httpRemoteAddress +
        ', httpUserAgent: ' + request.httpUserAgent +
        ', Headers: ' + request.httpHeaders.values().toArray().join(',');
}

function getRequestParams(body) {
    var logLocation = moduleName + 'getRequestParams()',
        params;

    try {
        params = JSON.parse(body);
    } catch (e) {
        vertexLogger.error(logLocation, 'JSON Parse error:' + e.message);
        vertexLogger.debug(logLocation, 'JSON Parse error:' + e.message, {
            body: body
        });
        return null;
    }
    // set limit on transaction id lentgh to prevent injections
    if (params.hasOwnProperty('transaction') && params.hasOwnProperty('source')) {
        return params;
    }

    vertexLogger.error(logLocation, 'Required parameters are missed: transaction, source' + getRequestOriginData());
    return null;
}

/**
 * Calculate a Hmac digest and encode it in Base64 String
 *
 * @param   data      {string} data to calculate hmac for
 * @param   stringKey {string} secret key for calculating digest
 * @returns           {string} Base64 encoded string of data digest
 */

function calculateHmac(data, stringKey) {
    var bytesKey,
        macSha256,
        signature,
        signatureBytes;

    var Mac = require('dw/crypto/Mac');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');

    macSha256 = new Mac(Mac.HMAC_SHA_256);
    bytesKey = new Bytes(stringKey);

    signatureBytes = macSha256.digest(data, bytesKey);
    signature = Encoding.toHex(signatureBytes);

    return signature;
}

function isCorrectHMAC(body) {
    var logLocation = moduleName + 'isCorrectHMAC()',
        requestHmac,
        hmacKey,
        calculatedHmac;

    requestHmac = request.getHttpHeaders().get('x-vertex-hmac'); // value or null

    if (requestHmac === null) {
        vertexLogger.error(logLocation, 'HMAC header is absent: \'x-vertex-hmac\' not in the request headers');
        vertexLogger.debug(logLocation, 'HMAC header is absent: \'x-vertex-hmac\' not in the request headers', {
            RequestData: getRequestOriginData()
        });
        return false;
    }

    hmacKey = Site.getCurrent().preferences.custom.Vertex_RemoteRequestToken;
    calculatedHmac = calculateHmac(body, hmacKey);

    if (calculatedHmac === requestHmac) {
        return true;
    }

    vertexLogger.error(logLocation, 'HMAC validation failed: calculated value is different from \'x-vertex-mac\' request header');
    vertexLogger.debug(logLocation, 'HMAC validation failed: calculated value is different from \'x-vertex-mac\' request header.', {
        RequestData: getRequestOriginData(),
        CalculatedHMAC: calculatedHmac,
        RequestBody: body
    });

    return false;
}

function validateRequestParameters() {
    var logLocation = moduleName + 'validateRequestParameters()',
        validationStatus = {
            ok: false,
            message: '',
            httpStatus: 400 // yes, we expect the worst things to happen by default :)
        },
        requestBody,
        requestParams;

    requestBody = request.httpParameterMap.getRequestBodyAsString(); // can be empty

    if (!empty(requestBody)) {
        if (isCorrectHMAC(requestBody)) {
            requestParams = getRequestParams(requestBody);
            if (requestParams !== null) {
                validationStatus.ok = true;
                validationStatus.httpStatus = 200;
                validationStatus.transaction = requestParams.transaction;
                validationStatus.source = requestParams.source;
            } else {
                validationStatus.message = 'We could not process your request: transaction id is absent';
            }
        } else {
            validationStatus.message = 'We could not process your request: authentication failed';
            validationStatus.httpStatus = 401;
        }
    } else {
        validationStatus.message = 'We could not process your request: request body is empty';
        vertexLogger.error(logLocation, 'Request body is empty.');
        vertexLogger.debug(logLocation, 'Request body is empty.', {
            RequestData: getRequestOriginData()
        });
    }

    return validationStatus;
}

exports.validateRequestParameters = validateRequestParameters;