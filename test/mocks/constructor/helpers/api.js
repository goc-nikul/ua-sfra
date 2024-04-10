'use strict';

var moduleName = 'api.js';
var DELTA_INGESTION_URL = 'https://ac.cnstrc.com';
var MAX_FAILED_CHUNKS = 1;
var feedTypes = {
    facet: 'facets'
};

var serviceDefinition = {
    url: '',
    method: '',
    auth: '',
    init: function() {
        var self = this;
        return {
            setURL: function(url) {
                self.url = url;
            },
            setRequestMethod: function(method) {
                self.method = method;
            },
            setAuthentication: function(method) {
                self.auth = method;
            },
            addHeader: function(header) {},
            addParam: function(param) {},
            call: function(data) {
                var theData = JSON.parse(data);
                if (theData.success) {
                    return {
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        msg: 'OK',
                        object: {
                            headers: null,
                            response: {
                                value: "4",
                                value_alias: null,
                                display_name: "4",
                                hidden: false,
                                position: null,
                                data: {
                                    values: [
                                        "4/5.5"
                                    ]
                                }
                            },
                            statusCode: 200
                        },
                        ok: true,
                        status: 'OK',
                        unavailableReason: null,
                        isOk: function() {
                            return true;
                        },
                        getErrorMessage: function() {
                            return null;
                        }
                    };
                } else {
                    return {
                        error: 1,
                        errorMessage: "error message",
                        mockResult: false,
                        msg: 'ERROR',
                        object: {
                            headers: null,
                            response: null,
                            statusCode: 404
                        },
                        ok: false,
                        status: 'ERROR',
                        unavailableReason: null,
                        isOk: function() {
                            return false;
                        },
                        getErrorMessage: function() {
                            return 'error message';
                        }
                    };
                }
            }
        }
    }
}

function makeRequest(params) {
    var Bytes = require('../../dw/dw_util_Bytes');
    var encoding = require('../../dw/dw_crypto_Encoding');
    var logger = require('./logger');

    var service = serviceDefinition.init();
    var apiCallResult = null;
    var tokenBytes = new Bytes(params.credentials.apiToken + ':', 'UTF8');
    var authCode = 'Basic ' + encoding.toBase64(tokenBytes);
    var url = DELTA_INGESTION_URL + '/v1/' + params.type;
    url = 'path' in params && params.path ? url + params.path : url;

    service.setURL(url);
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
        path: parameters.path,
        data: JSON.stringify(parameters.data),
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
