/* eslint-disable spellcheck/spell-checker */
/**
 * Initialize HTTP services for a cartridge
 */
'use strict';

var Site = require('dw/system/Site');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var UACAPIHelper = require('../helpers/util/UACAPIHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/**
 * Service call to OIS to get token
 * @return {void}
 */
function getTokenData() {
    return LocalServiceRegistry.createService('UACAPI.http.tokendata', {
        createRequest: function (svc, options) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('ua-site-code', Site.current.ID);

            return JSON.stringify(options.payload);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function () {
            return UACAPIHelper.getMockedUACAPITokenResponse();
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

/**
 * Service call to UACAPI to get order details with GrapghQL
 * @param {string} requestType - Request Type of Response
 * @return {dw.svc.Service} Service
 */
function getGraphQL(requestType) {
    return LocalServiceRegistry.createService('UACAPI.http.graphql', {
        createRequest: function (svc, options) {
            const url = svc.getConfiguration().credential.URL;
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', options.token);
            svc.addHeader('ua-site-code', Site.current.ID);
            svc.setRequestMethod('POST');
            svc.setURL(url);

            return JSON.stringify(options.payload);
        },
        parseResponse: function (svc, client) {
            return UACAPIHelper.parseGraphQLResponse(svc, client);
        },
        mockCall: function () {
            return UACAPIHelper.getMockedUACAPIResponse(requestType);
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}
module.exports.getGraphQL = getGraphQL;
module.exports.getTokenData = getTokenData;
