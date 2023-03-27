'use strict';

const LOG_TYPE = {
    WARN: 'warn',
    INFO: 'info',
    ERROR: 'error',
    DEBUG: 'debug'
};

/**
 * 2c2p Logger file
 * @param {string} logType Log type
 * @param {string} message message to be logged
 */
function writelog(logType, message) {
    var log = require('dw/system/Logger').getLogger('2c2p', '2c2p');
    log[logType](message);
}

module.exports = {
    writelog: writelog,
    LOG_TYPE: LOG_TYPE
};
