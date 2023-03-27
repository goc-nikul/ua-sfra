/**
 * General Logging Constructor
 *
 */
function GeneralLogger() {
    var vertexLogger,
        beginTime = [],
        constants = require('int_vertex/cartridge/scripts/constants');

    var doNothing = function(arg1, arg2, arg3) {
        return null;
    }; // eslint-disable-line no-unused-vars

    this.error = doNothing;
    this.trace = doNothing;
    this.debug = doNothing;
    this.begin = doNothing;
    this.end = doNothing;

    if (constants.generalLogLevel == constants.GENERAL_LOG_NONE) return;

    vertexLogger = require('dw/system/Logger').getLogger('VertexInc', 'Vertex.General');

    /* eslint-disable default-case, no-fallthrough */
    switch (constants.generalLogLevel) {
        case constants.GENERAL_LOG_DEBUG:
            this.begin = function(logLocation, message, varsDump) {
                var logMessage;

                beginTime[logLocation] = new Date().getTime();
                logMessage = 'Enter [' + logLocation + '] at ' + beginTime[logLocation] + '. ' + message;

                if (typeof varsDump != 'undefined') {
                    logMessage += '\n' + this.jsonHideSensitiveInfo(JSON.stringify(varsDump));
                }

                vertexLogger.debug(logMessage);
                return null;
            };
            this.end = function(logLocation, message) {
                var executionTime = new Date().getTime() - beginTime[logLocation];
                vertexLogger.debug('Exit [{0}], execution time: {1}ms.{2}', logLocation, executionTime, (typeof message == 'undefined') ? '' : message);
                return null;
            };
            this.debug = function(logLocation, message, varsDump) {
                var logMessage;
                logMessage = '[' + logLocation + '] ' + message;

                if (typeof varsDump != 'undefined') {
                    logMessage += '\n' + this.jsonHideSensitiveInfo(JSON.stringify(varsDump));
                }

                vertexLogger.debug(logMessage);
            };

        case constants.GENERAL_LOG_TRACE:
            this.trace = function(logLocation, message, varsDump) {
                var logMessage;
                logMessage = '[' + logLocation + '] ' + message;

                if (typeof varsDump != 'undefined') {
                    logMessage += '\n' + this.jsonHideSensitiveInfo(JSON.stringify(varsDump));
                }

                vertexLogger.info(logMessage);
            };

        case constants.GENERAL_LOG_ERROR:
            this.error = function(logLocation, message) {
                vertexLogger.error('[{0}] {1}', logLocation, (typeof message == 'undefined') ? '' : message);
            };
    }
    /* eslint-enable default-case, no-fallthrough */
}

GeneralLogger.prototype.jsonHideSensitiveInfo = function(stringToCheck) {
    /**
     * this works with json strings
     */
    var hideMe = new RegExp('(\"password\":|\"trustedId\":)(.*?)(,|})', 'gim'); // eslint-disable-line no-useless-escape
    return stringToCheck.replace(hideMe, '$1"*masked*"$3');
};

module.exports = new GeneralLogger();