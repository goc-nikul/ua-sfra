/**
 * Writes a new log.
 * @param moduleName The module name.
 * @param type The type of the log.
 * @param message The log message.
 */
function log(moduleName, type, message) {
  //var logger = require('dw/system/Logger').getLogger('constructor');
  var logger = require('dw/system/Logger').getLogger('jasonp', 'ua1');
  var content = '[' + type + '] ' + moduleName + ': ' + message;

  if (type === 'error') {
    logger.error(content);
  } else {
    logger.info(content);
  }
}

module.exports.log = log;
