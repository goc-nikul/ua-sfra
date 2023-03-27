/* eslint-disable spellcheck/spell-checker */
/**
 * Initialize HTTP services for a cartridge
 */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var serviceHelper = require('*/cartridge/scripts/services/serviceHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper');

/**
 * Service call to OIS to get token
 * @return {void}
 */
function getTokenData() {
    return LocalServiceRegistry.createService('UACAPI.http.tokendata', {
        createRequest: function (svc, options) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('ua-site-code', dw.system.Site.current.ID);

            return JSON.stringify(options.payload);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function () {
            return serviceHelper.getMockedUACAPITokenResponse();
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

/**
 * Service call to UACAPI to get order details with GrapghQL
 * @param {string} requestType - Request Type of Response
 * @param {string} token - Authentication Bearer Token
 * @return {dw.svc.Service} Service
 */
function getGraphQL(requestType, token) {
    return LocalServiceRegistry.createService('UACAPI.http.loyalty', {
        createRequest: function (svc, options, numberOfCoupons) {
            const url = svc.getConfiguration().credential.URL;
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', token);
            svc.setRequestMethod('POST');
            svc.setURL(url);
            var payload = serviceHelper.getGraphQLRequest(requestType, options, numberOfCoupons);
            return JSON.stringify(payload);
        },
        parseResponse: function (svc, client) {
            return serviceHelper.parseGraphQLResponse(svc, client);
        },
        mockCall: function () {
            return serviceHelper.getMockedUACAPIResponse(requestType);
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}
module.exports.getGraphQL = getGraphQL;
module.exports.getTokenData = getTokenData;
