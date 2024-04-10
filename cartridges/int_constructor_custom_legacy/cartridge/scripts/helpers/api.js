var moduleName = 'api.js';

/**
 * The URL to be used to perform a delta ingestion.
 */
var DELTA_INGESTION_URL = 'https://ac.cnstrc.com';

/**
 * Maximum number of failed chunks before aborting the job.
 */
var MAX_FAILED_CHUNKS = 1;

/**
 * Defines possible feed types to send via API.
 */
var feedTypes = {
    facet: 'facets'
};

/**
 * Posts the ingestion files to the backend API.
 * @param {Object} params The function parameters.
 * @returns {*} The api service call result object.
 */
function makeRequest(params) {
    var Bytes = require('dw/util/Bytes');
    var encoding = require('dw/crypto/Encoding');
    var serviceDefinition = require('link_constructor_connect_legacy/cartridge/scripts/services/serviceDefinition');
    var logger = require('./logger');

    var service = serviceDefinition.init();
    var apiCallResult = null;
    var tokenBytes = new Bytes(params.credentials.apiToken + ':', 'UTF8');
    var authCode = 'Basic ' + encoding.toBase64(tokenBytes);
    var url = DELTA_INGESTION_URL + '/v1/' + params.type;
    url = 'path' in params && params.path ? url + params.path : url;

    service.setURL(encodeURI(url));
    service.setRequestMethod(params.requestMethod);
    service.setAuthentication('BASIC');

    service.addHeader('Authorization', authCode);
    service.addHeader('Content-Type', 'application/json');
    service.addParam('key', params.credentials.apiKey);

    var keys = Object.keys(params.params);
    keys.forEach(function (key) {
        service.addParam(key, params.params[key]);
    });

    var data = 'data' in params && !empty(params.data) ? params.data : '';
    apiCallResult = service.call(data);

    if (apiCallResult.isOk()) {
        logger.log(moduleName, 'info', 'Successfully made request');
    } else {
        logger.log(moduleName, 'error', '.');
        logger.log(moduleName, 'error', 'Error while sending data: ' + apiCallResult.getErrorMessage());
        logger.log(moduleName, 'error', '.');
        logger.log(moduleName, 'error', 'Request URL: ' + url);
        logger.log(moduleName, 'error', 'Request Body: ' + data);
        logger.log(moduleName, 'error', 'Request Method: ' + params.requestMethod);
        logger.log(moduleName, 'error', '.');
    }

    return apiCallResult;
}

/**
 * Sends batched delta files to the backend API, respecting the maximum heap size.
 * @param {string} type The feed type.
 * @param {Object} credentials The credentials object.
 * @param {*} data The object that contains the data to be sent.
 * @param {string} section The Constructor index section
 * @param {Object} parameters The parameters
 * @returns {*} The status according to the response.
 */
function sendData(type, credentials, data, section, parameters) {
    var logger = require('./logger');
    var apiCallResult = null;

    var failedChunksCount = 0;
    var sentChunksCount = 0;
    var dataLength = Array.isArray(data) ? data.length : Object.keys(data).length;

    logger.log(moduleName, 'info', 'Sending one chunk of ' + dataLength + ' records');

    // send data
    apiCallResult = makeRequest({
        data: JSON.stringify(data),
        credentials: credentials,
        requestMethod: parameters.method,
        type: type,
        params: {
            section: section
        },
        path: parameters.path
    });

    if (!apiCallResult.isOk()) {
        failedChunksCount += 1;

        // Abort if too many chunks failed
        if (failedChunksCount >= MAX_FAILED_CHUNKS) {
            logger.log(moduleName, 'error', 'Aborting api requests since too many chunks failed.');
            return apiCallResult;
        }
    }

    sentChunksCount += 1;

    logger.log(moduleName, 'info', 'Failed chunks count: ' + failedChunksCount);
    logger.log(moduleName, 'info', 'Sent chunks count: ' + sentChunksCount);
    logger.log(moduleName, 'info', 'Finished sending facet metadata');

    return apiCallResult;
}

/**
 * Gets data from Constructor
 * @param {string} type The data type.
 * @param {Object} credentials The credentials object.
 * @param {string} section The Constructor index section
 * @param {Object} parameters The parameters
 * @returns {*} The status according to the response.
 */
function getData(type, credentials, section, parameters) {
    var apiCallResult = null;
    var response;

    // send data
    apiCallResult = makeRequest({
        credentials: credentials,
        requestMethod: 'GET',
        type: type,
        params: {
            section: section,
            num_results_per_page: 'num_results_per_page' in parameters ? parameters.num_results_per_page : 100
        },
        path: parameters.path
    });

    if (apiCallResult.isOk()) {
        if ('object' in apiCallResult && !empty(apiCallResult.object)) {
            if ('response' in apiCallResult.object && !empty(apiCallResult.object.response)) {
                response = apiCallResult.object.response;
            }
        }
    } else {
        response = apiCallResult;
    }

    return response;
}

module.exports = {
    sendData: sendData,
    getData: getData,
    feedTypes: feedTypes
};
