'use strict';

var base = module.superModule;
var Site = dw.system.Site;
const mockData = require('../mocks/mockHelper');
/**
* Adding Keep-Alive headers to service
* @param {Object} svc - service
*/
function addKeepAliveHeader(svc) {
    if (empty(Site.current.getCustomPreferenceValue('aurus_keep_alive'))
        || !Site.current.getCustomPreferenceValue('aurus_keep_alive')) {
        svc.addHeader('Connection', 'close');
        return;
    }

    svc.addHeader('Connection', 'keep-alive');
    svc.addHeader('Keep-Alive', 'timeout=10');
}

/**
* Initilizes 'aurusPay.https.getSession' LocalService service and returns it
* @returns {Object} - Service
*/
function initSessionService() {
    // Import LocalServiceRegistry Lib
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    // Aurus Pay Session Id
    var sessionService = LocalServiceRegistry.createService('aurusPay.https.getSession', {
        createRequest: function (svc, reqParams) {
            // Set HTTP Method and headers
            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
            addKeepAliveHeader(svc);
            return reqParams;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    return sessionService;
}

/**
* Initilizes 'aurusPay.https.preAuth' LocalService service and returns it
* Handles preAuth ans postAuth
* @returns {Object} - Service
*/
function initAuthService() {
    // Import LocalServiceRegistry Lib
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    // Aurus Pay Session Id
    var authService = LocalServiceRegistry.createService('aurusPay.https.preAuth', {
        createRequest: function (svc, reqParams) {
            // Set HTTP Method and headers
            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
            addKeepAliveHeader(svc);
            return reqParams;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        },
        mockCall: function (svc, params) {
            // return the response object which will pass to the parseResponse callback
            return {
                statusCode: 200,
                statusMessage: 'success',
                text: mockData.respondAurusInitAuthServiceMock(svc, params)
            };
        }
        // mockFull: function (params) {
        //     // return the response object which will directly return to the caller methor with out going to parseResponse callback
        //   }
    });

    return authService;
}

/**
 * Initializes Billing Token Service
 * @param {*} params - params
 * @returns {Object} authService
 */
function initBillingTokenService() {
    // Import LocalServiceRegistry Lib
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    // Aurus Pay Session Id
    var authService = LocalServiceRegistry.createService('aurusPay.https.getBillerToken', {
        createRequest: function (svc, reqParams) {
            // Set HTTP Method and headers
            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
            addKeepAliveHeader(svc);
            return reqParams;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    return authService;
}

/**
 * Initilizes 'aurusPay.https.getSessionToken' LocalService service and returns it
 * @returns {Object} - Service
 */
function initSessionTokenService() {
    // Import LocalServiceRegistry Lib
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    // Aurus Pay Session Id
    var sessionTokenService = LocalServiceRegistry.createService('aurusPay.https.getSessionToken', {
        createRequest: function (svc, reqParams) {
            // Set HTTP Method and headers
            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
            addKeepAliveHeader(svc);
            return reqParams;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });

    return sessionTokenService;
}

base.getSessionService = initSessionService;
base.getAuthService = initAuthService;
base.getBillingToken = initBillingTokenService;
base.getSessionTokenService = initSessionTokenService;

module.exports = base;
