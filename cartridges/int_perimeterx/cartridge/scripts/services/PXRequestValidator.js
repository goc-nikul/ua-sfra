'use strict';

var pxManager = require('../perimeterx');
var Status = require('dw/system/Status');
var URLUtils = require('dw/web/URLUtils');
var pxLogger = require('../pxLogger');
var StringUtils = require('dw/util/StringUtils');

/**
 * Verifies if a request shuold be exampt from PX validation
 * @return {boolean} true if request should be exempt from PX validation
 */
function verifyExempt() {
    var pathParts = request.getHttpPath().replace(/\/$/, '').split('/');
    var controller = pathParts[pathParts.length - 1];

    return (controller.indexOf('__') === 0 ||
        controller.toUpperCase().indexOf('PX') === 0 ||
        controller === 'beacon');
}

/**
 * Intercepts all incoming requests and validate them if they meet a set of predefined criterias
 * @return {object} Status
 */
function validate() {
    if (request.httpRequest && !request.includeRequest && !verifyExempt()) {
        try {
            var pxResult = pxManager.pxVerifyOnRequest();
            if (pxResult && !pxResult.verified) {
                var obj = {
                    template: pxResult.templateName,
                    originalURL: request.getHttpURL(),
                    templateData: pxResult.blockData
                };
                session.privacy.PXObj = JSON.stringify(obj);
                if (pxResult.blockAction === 'jsonResponse') {
                    response.redirect(URLUtils.url('PX-ABR'));
                } else {
                    response.redirect(URLUtils.url('PX-Show', 'url', StringUtils.encodeBase64(request.getHttpURL()).toString()));
                }
            }
        } catch (e) {
            pxLogger.debug('PXRequestValidator error: ' + e);
        }
    }

    return new Status(Status.OK);
}

module.exports = {
    onRequest: validate
};
