'use strict';
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var LoggerHelper = require('*/cartridge/scripts/util/loggerHelper.js');

/**
 * Makes service calls to IDM.
 * @return {void}
 */
function createNiceIDService() {
    return LocalServiceRegistry.createService('niceid.http', {
        createRequest: function (svc, params) {
            return params || null;
        },
        parseResponse: function (svc, response) {
            return response;
        },
        filterLogMessage: function (logMsg) {
            return !empty(logMsg)
                ? LoggerHelper.maskSensitiveInfo(logMsg)
                : logMsg;
        }
    });
}
module.exports.createNiceIDService = createNiceIDService;
