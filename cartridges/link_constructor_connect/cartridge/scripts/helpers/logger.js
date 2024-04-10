var Logger = require('dw/system/Logger');

/**
 * @param {string} message The log message.
 * @param {Record<string, unknown>} flags Additional flags to be logged.
 */
function build(message, flags) {
  var content = '';

  if (flags) {
    Object.keys(flags).forEach(function (key) {
      var value = flags[key];

      content += '[' + key + '=' + value + '] ';
    });
  }

  if (typeof message === 'object') {
    content += JSON.stringify(message);
  } else {
    content += message;
  }

  return content;
}

/**
 * @returns {dw.system.Logger} The logger instance.
 */
function getLogger() {
  return Logger.getLogger('link_constructor_connect');
}

/**
 * Writes a new `info` log.
 *
 * @param {string} message The log message.
 * @param {Record<string, unknown>} flags Additional flags to be logged.
 */
module.exports.log = function log(message, flags) {
  var content = build(message, flags);

  getLogger().info(content);
};

/**
 * Writes a new `warn` log.
 *
 * @param {string} message The log message.
 * @param {Record<string, unknown>} flags Additional flags to be logged.
 */
module.exports.warn = function warn(message, flags) {
  var content = build(message, flags);

  getLogger().warn(content);
};

/**
 * Writes a new `debug` log.
 *
 * @param {string} message The log message.
 * @param {Record<string, unknown>} flags Additional flags to be logged.
 */
module.exports.debug = function debug(message, flags) {
  var content = build(message, flags);

  getLogger().debug(content);
};

/**
 * Writes a new `error` log.
 *
 * @param {string} message The log message.
 * @param {Record<string, unknown>} flags Additional flags to be logged.
 */
module.exports.error = function error(message, flags) {
  var content = build(message, flags);

  getLogger().error(content);
};
