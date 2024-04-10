/**
 * Writes a new log.
 * @param {string} moduleName The module name.
 * @param {string} type The type of the log.
 * @param {string} message The log message.
 */
function log(moduleName, type, message) {
    var logger = require('dw/system/Logger').getLogger('constructor', 'constructor');
    var content = '[' + type + '] ' + moduleName + ': ' + message;

    if (type === 'error') {
        logger.error(content);
    } else {
        logger.info(content);
    }
}

module.exports.log = log;
