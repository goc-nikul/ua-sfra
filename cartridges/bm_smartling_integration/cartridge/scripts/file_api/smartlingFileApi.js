'use strict';

var HttpUtils = require ('./httpUtils');
var tokenProvider = require ('./tokenProvider');
var ExceptionLog = require ('/bm_smartling_integration/cartridge/scripts/utils/ExceptionLog').ExceptionLog;
var smartlingConfig = require('/bm_smartling_integration/cartridge/scripts/dao/configuration.ds');
var LOGGER = new ExceptionLog(dw.system.Logger.getLogger("smartling", "smartlingFileApi"));

var GET_REQUEST = "GET";
var POST_REQUEST = "POST";

/**
 * Get file status for specific locale
 */
function fileStatus(fileUri, locale) {
    return HttpUtils.sendHttpRequest(GET_REQUEST, "/files-api/v2/projects/%s/locales/" + locale + "/file/status",
            {
                "fileUri": fileUri
            });
}
/**
 * Get file statuses for all locales
 */
function fileStatuses(fileUri) {
    return HttpUtils.sendHttpRequest(GET_REQUEST, "/files-api/v2/projects/%s/file/status",
            {
                "fileUri": fileUri
            });
}

/**
 * Get file last modified time from smartling
 */
function lastModified(fileUri) {
    return HttpUtils.sendHttpRequest(GET_REQUEST, "/files-api/v2/projects/%s/file/last-modified",
            {
                "fileUri": fileUri
            });
}

/**
 * Uploads file to Smartling Dashboard
 */
function uploadFile(request, delimiter) {
    return HttpUtils.sendMultipartHttpRequest(POST_REQUEST, "/files-api/v2/projects/%s/file", request, delimiter);
}

/**
 * Downloads translated file from Smartling
 */
function getFile(fileUri, localeId) {
    return HttpUtils.sendHttpRequest(GET_REQUEST, "/files-api/v2/projects/%s/locales/"+localeId+"/file",
        {
            "fileUri": fileUri,
            "retrievalType": smartlingConfig.getRetrivalType()
        });
}

/**
 * Makes test connection to Smartling APIsendProduct
 */
function checkConnection(userIdentifier, userSecret) {
    return tokenProvider.checkConnection(userIdentifier, userSecret);
}

if (typeof (exports) !== 'undefined') {
    exports.fileStatus = fileStatus;
    exports.fileStatuses = fileStatuses;
    exports.lastModified = lastModified;
    exports.uploadFile = uploadFile;
    exports.getFile = getFile;
    exports.checkConnection = checkConnection;
}
