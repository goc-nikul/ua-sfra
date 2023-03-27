var logger = require('dw/system/Logger');

/**
 * Writes a debug level message to the logs
 * @param  {string} message message to write
 * @param  {string} appId   PerimeterX appid to use
 */
function debug(message, appId) {
    logger.debug('[PerimeterX - DEBUG][' + appId + '] - ' + message);
}

/**
 * Writes an error level message to the logs
 * @param  {string} message message to write
 * @param  {string} appId   PerimeterX appid to use
 */
function error(message, appId) {
    logger.error('[PerimeterX - ERROR][' + appId + '] - ' + message);
}

module.exports = {
    debug: debug,
    error: error
};
