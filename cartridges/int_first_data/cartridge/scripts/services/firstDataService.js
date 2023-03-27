'use strict';
/*
 * API Includes
 */

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Site = require('dw/system/Site');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/**
 * Service to get access token.
 * [Authorization is handled by Auth0.]
 * @return {void}
 */
function createAuthTokenService() {
    return LocalServiceRegistry.createService('firstData.auth0.token', {
        createRequest: function (svc, params) {
            svc.setRequestMethod('POST');
            svc.setAuthentication('NONE');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Accept', 'application/json');
            svc.setURL(params.authHostname);
            return JSON.stringify(params.requestBody);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}
/**
 * GraphQL Service to generate gift card, check balance, reverse gift card amount and check balance.
 * [The Gift Card data and FDMS actions are exposed thru GraphQL queries and mutations.]
 * @return {void}
 */
function createGraphQLService() {
    return LocalServiceRegistry.createService('firstData.graphQL', {
        createRequest: function (svc, params) {
            svc.setRequestMethod('POST');
            svc.setAuthentication('NONE');
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('Accept', 'application/json');
            svc.addHeader('ua-site-code', Site.current.ID);
            svc.addHeader('Authorization', 'Bearer ' + params.token);
            svc.setURL(params.graphQLApiUrl);
            return JSON.stringify(params.requestBody);
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        }
    });
}
module.exports.createAuthTokenService = createAuthTokenService;
module.exports.createGraphQLService = createGraphQLService;
