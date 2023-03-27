/* eslint-disable spellcheck/spell-checker */
/**
 * Initialize HTTP services for a cartridge
 */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var OISHelper = require('../util/OISHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/**
 * Service call to OIS to get token
 * @return {void}
 */
function getTokenData() {
    return LocalServiceRegistry.createService('int_ois.http.tokendata', {
        createRequest: function (svc, options) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');

            return JSON.stringify(options.payload);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, client) {
            return OISHelper.getMockedOISResponse(svc, client);
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

/**
 * Service call to OIS to get order details with GrapghQL
 * @return {void}
 */
function getGraphQL() {
    return LocalServiceRegistry.createService('int_ois.http.graphql', {
        createRequest: function (svc, options) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', options.token);

            return JSON.stringify(options.payload);
        },
        parseResponse: function (svc, client) {
            return OISHelper.parseGraphQLResponse(svc, client);
        },
        mockCall: function (svc, client) {
            return OISHelper.getMockedOISResponse(svc, client);
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}
module.exports.getTokenData = getTokenData;
module.exports.getGraphQL = getGraphQL;
