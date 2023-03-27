/* eslint-disable spellcheck/spell-checker */
/**
 * Initialize HTTP services for a cartridge
 */
'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var VIPCustomerHelper = require('~/cartridge/scripts/util/VIPCustomerHelper');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/**
 * Service call to VIP to get token
 * @return {void}
 */
function getTokenData() {
    return LocalServiceRegistry.createService('int_vip.http.tokendata', {
        createRequest: function (svc, options) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');

            return JSON.stringify(options.payload);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        mockCall: function (svc, client) {
            return VIPCustomerHelper.getMockedVIPResponse(svc, client);
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}

/**
 * Service call to VIP to get order details with GrapghQL
 * @return {void}
 */
function getGraphQL() {
    return LocalServiceRegistry.createService('int_vip.http.graphql', {
        createRequest: function (svc, options) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Authorization', options.token);

            return JSON.stringify(options.payload);
        },
        parseResponse: function (svc, client) {
            return VIPCustomerHelper.parseGraphQLResponse(svc, client);
        },
        mockCall: function (svc, client) {
            return VIPCustomerHelper.getMockedVIPResponse(svc, client);
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}
module.exports = {
    getTokenData: getTokenData,
    getGraphQL: getGraphQL
};
