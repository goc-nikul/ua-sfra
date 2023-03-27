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

module.exports.maskSensitiveInfo = maskSensitiveInfo;
module.exports.maskPIIAuruspayInfo = maskPIIAuruspayInfo;
