'use strict';

var Log = require('dw/system/Logger').getLogger('product_personalisation', 'product_personalisation');

/**
 * Print error logs
 * @param {string} msg message to log
 */
function error(msg) {
    Log.error(msg);
}

/**
 * Print debug logs
 * @param {string} msg text to log
 */
function debug(msg) {
    Log.debug(msg);
}

module.exports = {
    error: error,
    debug: debug
};
