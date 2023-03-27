/**
 * errorLogHelper.js
 * This helper is for creating consistent error logging for all OCAPI hooks
 */

exports.handleOcapiHookErrorStatus = function handleOcapiHookErrorStatus(e, customErrorCode, customErrorMessage) {
    var Status = require('dw/system/Status');
    // Create an instance of custom log so one can look into all the OCAPI related errors in one log file.
    var Logger = require('dw/system/Logger').getLogger('OCAPI', 'OCAPI');
    var responseErrorCode = !empty(customErrorCode) ? customErrorCode : e.name; // send custom error code if provided, else send e.name
    var responseErrorMessage = !empty(customErrorMessage) ? customErrorMessage : 'Error while executing OCAPI hook'; // send custom error message if provided else send hard coded value
    Logger.error('{0}:{1}: {2} ({3}:{4}) \n{5}', responseErrorMessage, e.name, e.message, e.fileName, e.lineNumber, e.stack);
    return new Status(Status.ERROR, responseErrorCode, responseErrorMessage);
};
