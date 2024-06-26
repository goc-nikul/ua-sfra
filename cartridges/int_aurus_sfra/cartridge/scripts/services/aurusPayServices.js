'use strict';

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
 * Initializes Billing Token Service
 * @param {*} params - params
 * @returns {Object} authService
 */
function initBillingTokenService() {
    // Import LocalServiceRegistry Lib
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

    // Aurus Pay Session Id
    var authService = LocalServiceRegistry.createService('aurusPay.https.getPayPalToken', {
        createRequest: function (svc, reqParams) {
            // Set HTTP Method and headers
            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
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


module.exports = {
    getSessionService: initSessionService,
    getAuthService: initAuthService,
    getBillingToken: initBillingTokenService,
    getSessionTokenService: initSessionTokenService
};
