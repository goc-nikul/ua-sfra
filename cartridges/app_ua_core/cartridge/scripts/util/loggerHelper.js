'use script';
var Site = require('dw/system/Site');

/**
 * Check string is of JSON format
 * @param {string} logMessage - logMessage
 * @returns {boolean} - confirms string is of type JSON
 */
function isJsonString(logMessage) {
    try {
        JSON.parse(logMessage);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Log message will be processed and masked with specific information configured.
 * @param {string} logMessage - Raw logMessage
 * @param {Object} siteprefValues - Raw logMessage
 * @returns {string} - Masked logMessage
 */
function logDataMasked(logMessage, siteprefValues) {
    var ArrayList = require('dw/util/ArrayList');
    var Logger = require('dw/system/Logger');
    var maskedLogMessage = '';
    try {
        if (logMessage && isJsonString(logMessage)) {
            maskedLogMessage = JSON.stringify(JSON.parse(logMessage));
            var serviceLogValuesToBeMasked = new ArrayList(siteprefValues);
            serviceLogValuesToBeMasked = serviceLogValuesToBeMasked.iterator();
            while (serviceLogValuesToBeMasked.hasNext()) { // eslint-disable-next-line spellcheck/spell-checker
                var regExp = new RegExp('(\"' + serviceLogValuesToBeMasked.next() + '\":)(.*?)(,|})', 'gim'); // eslint-disable-line no-useless-escape
                // Regex above will not be useful. Term is wrapped in quotes, and JSON.stringify escapes quotes in the message.
                maskedLogMessage = maskedLogMessage.replace(regExp, '$1"******"$3');
            }
        }
    } catch (e) {
        // istanbul ignore next
        Logger.error('Exception while masking log message in loggerHelper.js . {0}', e.message); // This is not reachable
        // istanbul ignore next
        maskedLogMessage = '';
    }
    return maskedLogMessage;
}

/**
 * Log message will be processed and masked with specific information configured.
 * @param {string} logMessage - Raw logMessage
 * @returns {string} - Masked logMessage
 */
function maskSensitiveInfo(logMessage) {
    var siteprefValues = Site.getCurrent().getCustomPreferenceValue('serviceLogValuesToBeMasked');
    var maskedLogMessage = logMessage;
    if (siteprefValues && siteprefValues.length > 0) {
        maskedLogMessage = logDataMasked(logMessage, siteprefValues);
    }
    return maskedLogMessage;
}
/**
 * Aurus payment Log message will be processed and masked PII information which are configured in site pref.
 * @param {string} aurusPayLogMessage - aurus pay helper log Message
 * @returns {string} - maskedAurusPayLogMessage
 */
function maskPIIAuruspayInfo(aurusPayLogMessage) {
    var aurusMaskedSitePrefValues = Site.getCurrent().getCustomPreferenceValue('aurusPayTobeMasked');
    var maskedAurusPayLogMessage = aurusPayLogMessage;
    if (aurusMaskedSitePrefValues && aurusMaskedSitePrefValues.length > 0) {
        maskedAurusPayLogMessage = logDataMasked(aurusPayLogMessage, aurusMaskedSitePrefValues);
    }
    return maskedAurusPayLogMessage;
}

/**
* returns json object for logging
* @param {Object} order - order of customer if exists
* @returns {Object} responseObject - returns true or false
*/
function getLoggingObject(order) {
    var responseObject = {};

    try {
        var BasketMgr = require('dw/order/BasketMgr');
        var lineItemCtnr = BasketMgr.getCurrentBasket();

        if (lineItemCtnr) {
            responseObject.customerEmail = lineItemCtnr.getCustomerEmail();
        }

        if (order && order instanceof dw.order.Order) {
            responseObject.customerEmail = order.getCustomerEmail();
            responseObject.orderNo = order.getOrderNo();
        }

        responseObject.SessionId = session.sessionID.toString();
        if (session.customer) {
            responseObject.customerID = session.customer.getID();
            if (session.customer.profile) {
                responseObject.profile = session.customer.profile.email;
            }
        }
    } catch (error) {
        var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
        errorLogger.error('getLoggingObject {0}', JSON.stringify(error));
        responseObject.error = error;
    }

    return JSON.stringify(responseObject);
}

/**
 * Generic error logging for try and catch exceptions
 * @param {string} logType - Logging type such as OCAPI / ORDER / CATALOG
 * @param {string} customMsg - Custom message to be logged.
 * @param {Object} e - Error object
 */
function logException(logType, customMsg, e) {
    const Logger = require('dw/system/Logger').getLogger(logType);
    Logger.error('{0} - {1}: {2} ({3}:{4}) \n{5}', customMsg, e.name, e.message, e.fileName, e.lineNumber, e.stack);
}

// Exporting the class for use in other files
module.exports.logException = logException;
module.exports.getLoggingObject = getLoggingObject;
module.exports.maskSensitiveInfo = maskSensitiveInfo;
module.exports.maskPIIAuruspayInfo = maskPIIAuruspayInfo;
