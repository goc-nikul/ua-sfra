'use strict';

/* API includes */
var Logger = require('dw/system/Logger');
var Log = Logger.getLogger('util.JsonUtils');

/**
 * General wrapper for JSON.parse(...) with error catching
 * @param {string} jsonString - JSON object in string
 * @return {Object} - Parsed JSON object
 */
function parse(jsonString) {
    var parsed = {};

    if (!empty(jsonString)) {
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            Log.error('JSON object parse failed. Error {0}', e);
            return {};
        }
    }

    return parsed;
}

module.exports = {
    parse: parse
};
