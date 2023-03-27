var pxLogger = require('./pxLogger');
var pxCrypto = require('./pxCrypto');
var pxConstants = require('./pxConstants');
var PXServices = require('./services/PXServiceInit');
var Encoding = require('dw/crypto/Encoding');

/**
 * Verifies a givenHMAC against a calculated value
 * @param  {string}  hmacStr      timestamp extracted from telemetry header
 * @param  {string}  givenHmac    hmac extracted from telemetry header
 * @param  {string}  cookieSecret PerimeterX cookie secret
 * @return {Boolean}              true if valid
 */
function isHmacValid(hmacStr, givenHmac, cookieSecret) {
    try {
        var hmac = pxCrypto.hmacSign(hmacStr, cookieSecret);
        return hmac === givenHmac;
    } catch (err) {
        return false;
    }
}

/**
 * Filters sensitive keys from the config
 * @param  {object} curConfig PerimeterX config object
 * @return {object}           filtered config object
 */
function getConfigWithoutSensetiveKeys(curConfig) {
    var filteredConfig = {};
    for (var key in curConfig) {
        if (key !== 'cookieKey' && key !== 'authToken') {
            filteredConfig[key] = curConfig[key];
        }
    }
    return filteredConfig;
}

/**
 * Method to send a telemetry request to PerimeterX cloud using Services Framework
 * @param  {object} payload  payload to send
 * @param  {object} pxConfig PerimeterX configuration object
 */
function sendTelemetryActivityToServer(payload, pxConfig) {
    var url = pxConfig.perimeterxServerHost + pxConstants.TELEMETRY_API;

    PXServices.collectorAPIService.setURL(url).setRequestMethod('POST')
        .addHeader('Authorization', 'Bearer ' + pxConfig.authToken)
        .addHeader('Content-Type', 'application/json')
        .call(JSON.stringify(payload));

    pxLogger.debug('Sent enforcer telemetry');
}

/**
 * Method that creates the payload for the telemetry request
 * @param  {string} headerValue base64 value from the telemetry header
 * @param  {object} pxConfig    PerimeterX configuration object
 */
function sendTelemetryActivity(headerValue, pxConfig) {
    pxLogger.debug('Received command to send enforcer telemetry');
    var decodedHeader = Encoding.fromBase64(headerValue).toString();

    var splitValue = decodedHeader.split(':');
    if (splitValue.length !== 2) {
        pxLogger.debug('Malformed telemetry header:' + decodedHeader);
        return;
    }
    var timestamp = splitValue[0];
    var givenHmac = splitValue[1];
    var curUnixTime = +new Date();

    if (!isHmacValid(timestamp, givenHmac, pxConfig.cookieKey)) {
        pxLogger.debug('Telemetry header hmac validation failed. original hmac: ' + givenHmac + ', timestamp: ' + timestamp);
        return;
    }

    var timestampNumber = parseInt(timestamp, 10);
    if (isNaN(timestampNumber) || timestampNumber < curUnixTime) {
        pxLogger.debug('Telemetry header timestamp expired: ' + timestamp + ' < ' + curUnixTime);
        return;
    }

    var payload = {
        type: 'enforcer_telemetry',
        px_app_id: pxConfig.appId,
        timestamp: +new Date(),
        details: {
            enforcer_configs: getConfigWithoutSensetiveKeys(pxConfig),
            module_version: pxConfig.sdkName,
            update_reason: 'command'
        }
    };

    sendTelemetryActivityToServer(payload, pxConfig);
}

module.exports = {
    sendTelemetryActivity: sendTelemetryActivity
};
