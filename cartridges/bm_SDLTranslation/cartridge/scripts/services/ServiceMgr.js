'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * tMSPost - SDL TMS Post Request
 * @returns {Object} response
 */
function tMSPost() {
    var tmsResult = LocalServiceRegistry.createService('tms.http.post', {
        createRequest: function (service, args) {
            if (args) {
                return args;
            }
            return null;
        },
        parseResponse: function (service, client) {
            return client.text;
        },
        getRequestLogMessage: function (request) {
            return request;
        },
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    return tmsResult;
}

/**
 * tMSGet - SDL TMS GET Request
 * @returns {Object} response
 */
function tMSGet() {
    var tmsResult = LocalServiceRegistry.createService('tms.http.get', {
        createRequest: function (service) {
            service.setRequestMethod('GET');
        },
        parseResponse: function (service, client) {
            return client.text;
        },
        getRequestLogMessage: function (request) {
            return request;
        },
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    return tmsResult;
}

/**
 * tMSDelete - SDL TMS Delete Request
 * @returns {Object} response
 */
function tMSDelete() {
    var tmsResult = LocalServiceRegistry.createService('tms.http.delete', {
        createRequest: function (service) {
            service.setRequestMethod('DELETE');
        },
        parseResponse: function (service, client) {
            return client.text;
        },
        getRequestLogMessage: function (request) {
            return request;
        },
        getResponseLogMessage: function (response) {
            return response.text;
        }
    });

    return tmsResult;
}

module.exports = {
    tMSPost: tMSPost,
    tMSGet: tMSGet,
    tMSDelete: tMSDelete
};
