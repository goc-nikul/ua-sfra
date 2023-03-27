'use strict';
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/**
* Retrieve the current type of the service call for IDM.
* @param {Object} service - dw.svc.Service
* @returns {Object} - provides the type of the current service call.
*/
function getCallType(service) {
    const CALL_TYPES = { // to be expanded to other types.
        AUTH: '/oauth/authorize'
    };
    let callType;

    if (CALL_TYPES && service && service.URL) {
        Object.keys(CALL_TYPES).forEach(function (key) {
            if (service.URL.includes(CALL_TYPES[key])) {
                callType = key;
            }
        });
    }
    return callType;
}

/**
* Retrieve the mock response based on the custom service type.
* @param {Object} service - dw.svc.Service
* @returns {Object} - Mock API response.
*/
function getMockResponse(service) {
    let currentCallType = getCallType(service);
    let response = {};
    switch (currentCallType) {
        case 'AUTH':
            response = {
                statusCode: 200,
                statusMessage: 'Success',
                text: '{"action":"Login-OAuthReentry","queryString":"error=access_denied&error_description=Access%20denied%20by%20resource%20owner%20or%20authorization%20server&reason=100","locale":"en_US","tracking_consent":null,"reason":"100","error":"access_denied","error_description":"Access denied by resource owner or authorization server"}'
            };
            break;
        default:
            break;
    }

    return response;
}

/**
 * Makes service calls to IDM.
 * @return {void}
 */
function createIDMService() {
    return LocalServiceRegistry.createService('idm.http', {
        createRequest: function (svc, params) {
            return params || null;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg) ? LoggerHelper.maskSensitiveInfo(logMsg) : logMsg;
        },
        mockCall: function (svc) {
            return getMockResponse(svc);
        }
    });
}
module.exports.createIDMService = createIDMService;
