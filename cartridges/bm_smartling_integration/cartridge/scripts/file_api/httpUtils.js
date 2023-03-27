"use strict";

var smartlingConfig = require('/bm_smartling_integration/cartridge/scripts/dao/configuration.ds');
var dwCrypto = require('dw/crypto');
var dwSystem = require('dw/system');
var dwNet = require('dw/net');
var ExceptionLog = require('/bm_smartling_integration/cartridge/scripts/utils/ExceptionLog.ds').ExceptionLog;
var LOGGER = new ExceptionLog(dwSystem.Logger.getLogger("smartling", "httpUtils"));
var tokenProvider = require ('./tokenProvider');

var version = require("/bm_smartling_integration/cartridge/scripts/version.js");
var USER_AGENT_HEADER = "demandware-connector/" + version.getVersion();
var VALIDATION_ERROR = "VALIDATION_ERROR";
var FILE_NOT_FOUND_ERROR_KEY = "file.not.found";
var APPLICATION_JSON_TYPE = "application/json";
var SAMRTLING_API_URL = "https://api.smartling.com";

/**
 * Custom exception
 */
function SmartlingApiError(statusCode, errorText) {
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorText = errorText;
    this.message = 'SmartlingApiError: statusCode=' + statusCode + ', errorText=' + dwCrypto.Encoding.toURI(errorText);
    Error.call(this, this.message);
    this.stack = (new Error()).stack;
}
SmartlingApiError.prototype = Object.create(Error.prototype);
SmartlingApiError.prototype.constructor = SmartlingApiError;

function SmartlingFileNotFoundError(message, errorText) {
    this.name = this.constructor.name;
    this.message = dwCrypto.Encoding.toURI(message);
    SmartlingApiError.call(this, message, errorText);
    this.stack = (new Error()).stack;
}
SmartlingFileNotFoundError.prototype = Object.create(SmartlingApiError.prototype);
SmartlingFileNotFoundError.prototype.constructor = SmartlingFileNotFoundError;

/**
 * Sends request with stored credentials
 */
function sendHttpRequest(method, basePath, requestParameters) {

    var urlToSend = SAMRTLING_API_URL + buildUrl(basePath, requestParameters);
    var httpClient = getHttpClient(method, urlToSend);

    LOGGER.debug("Sending request to: {0} {1}", method, urlToSend);
    httpClient.send();

    return processResponse(httpClient);
}

function sendMultipartHttpRequest(method, basePath, request, delimiter) {

    var urlToSend = SAMRTLING_API_URL + buildUrl(basePath, {}); //buildUrl(requestParameters);
    var httpClient = enrichClientWithMultipartParams(getHttpClient(method, urlToSend), delimiter);

    LOGGER.debug("Sending request to: {0} {1}", method, urlToSend);
    httpClient.send(request);

    return processResponse(httpClient);
}

function enrichClientWithMultipartParams(httpClient, delimiter) {
    // Add 10 seconds to whatever the Smartling timeout is configured to (to better support large file uploads).
    httpClient.setTimeout(smartlingConfig.getTimeOut() + 10000);
    httpClient.setRequestHeader('Content-Type', "multipart/form-data; boundary=" + delimiter);
    return httpClient;
}

function getHttpClient(method, url) {
    try {
        var httpClient  = new dwNet.HTTPClient();
        httpClient.setTimeout(smartlingConfig.getTimeOut());
        httpClient.open(method, url);
        httpClient.setRequestHeader("User-Agent", USER_AGENT_HEADER);
        httpClient.setRequestHeader("Authorization", "Bearer " + tokenProvider.getAuthenticationToken());

        return httpClient;
    } catch (e) {
        LOGGER.errorException("Failed creating HTTPClient for method='{0}' and request='{1}'", method, request);
        throw new Error(e);
    }
}

function processResponse(client) {
    if (client.statusCode !== 200) {
        LOGGER.error('Sending request failed statusCode={0}, errorText={1}, body="{2}"', client.statusCode, client.errorText, client.text);
        if (client.statusCode == 400) {
            var errorText = JSON.parse(client.errorText);
            if (VALIDATION_ERROR == errorText['response']['code'] && FILE_NOT_FOUND_ERROR_KEY == errorText['response']['errors'][0]['key']) {
                throw new SmartlingFileNotFoundError("File not found");
            }
        } else if (client.statusCode == 401) {
            tokenProvider.resetTokens();
            LOGGER.debug('Tokens have been reset');
        }
        throw new SmartlingApiError(client.statusCode, client.errorText);
    }

    LOGGER.debug("Got successful response: {0}", client.text);

    return parseResponse(client);
}

/**
 * Parse smartling FAPI response
 */
function parseResponse(client) {
    var message = client.text;
    if (client.getResponseHeader("Content-Type").indexOf(APPLICATION_JSON_TYPE)>-1) {
        return JSON.parse(message);
    } else {
        return message;
    }
}

function buildUrl(basePath, params) {

    basePath = basePath.replace("projects/%s", "projects/" + smartlingConfig.getProjectId());

    var paramsString = '';
    for (var param in params) {
        if (params.hasOwnProperty(param)) {
            var entry = param + '=' + dwCrypto.Encoding.toURI(params[param]);
            if (!empty(paramsString)) {
                paramsString += '&'
            }

            paramsString += entry;
        }
    }

    return basePath + "?"+ paramsString;
}

exports.SmartlingFileNotFoundError = SmartlingFileNotFoundError;
exports.SmartlingApiError = SmartlingApiError;
exports.sendHttpRequest = sendHttpRequest;
exports.sendMultipartHttpRequest = sendMultipartHttpRequest;
exports.parseResponse = parseResponse;