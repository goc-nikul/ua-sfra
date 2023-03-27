'use strict';

var pxConfig = require('./pxConfig');
var config = pxConfig.getConfig();
var pxCtx = require('./pxContext');
var cookieValidator = require('./pxCookieValidator');
var riskValidator = require('./pxRiskValidator');
var activityClient = require('./pxActivityClient');
var pxLogger = require('./pxLogger');
var pxUtils = require('./pxUtils');
var Cookie = require('dw/web/Cookie');
var pxTelemetry = require('./pxTelemetry');
var URLUtils = require('dw/web/URLUtils');

var telemetryHeader = 'x-px-enforcer-telemetry';

/**
 * Verifies if the current request is whitelisted in PXConfig
 * @param  {array} filters paths to whitelist
 * @return {boolean}         false if path is found in filters
 */
function verifyPath(filters) {
    var path = request.httpPath.toLowerCase();
    for (var i = 0; i < filters.length; i++) {
        if (path.indexOf(filters[i]) > -1) {
            pxLogger.debug('Found whitelisted path: ' + path, config.appId);
            return false;
        }
    }
    return true;
}

/**
 * Verifies if the current request ip is whitelisted in PXConfig
 * @param  {array} whitelistedIPs ips to whitelist
/ */
function verifyIP(whitelistedIPs) {
    var ipAddr = pxUtils.extractIP(config, request.getHttpHeaders());
    var longIP = pxUtils.unsign(pxUtils.calculateIP(ipAddr));
    for (var i = 0; i < whitelistedIPs.length; i++) {
        if ((longIP & whitelistedIPs[i].maskSize) === (whitelistedIPs[i].ip & whitelistedIPs[i].maskSize)) {
            pxLogger.debug('Found whitelisted ip: ' + ipAddr, config.appId);
            return false;
        }
    }
    return true;
}

/**
 * Creates the advanced blocking response JSON
 * @param  {object} blockData object containing block page related data. Generated in handleVerification
 * @return {string}           A stringified dvanced blocking response JSON object
 */
function getJSONResponse(blockData) {
    var result = {
        appId: blockData.appId,
        jsClientSrc: blockData.jsClientSrc,
        firstPartyEnabled: blockData.firstPartyEnabled,
        vid: blockData.vid,
        uuid: blockData.uuid,
        hostUrl: blockData.hostUrl,
        blockScript: blockData.blockScript
    };
    return JSON.stringify(result);
}

/**
 * The main PerimeterX request validation function.
 * @param  {object} resObj      response object (can be 'app' in SGJC or 'res' in SFRA)
 * @param  {object} localConfig PerimeterX config object
 * @return {object}             response object
 */
function handleVerification(resObj, localConfig) {
    var isJsonResponse = false;
    var templateName = localConfig.blockPageTemplate;
    var onRequestResponseObj = {
        verified: true
    };

    var verified = pxCtx.score < localConfig.blockingScore;

    // Handle async activities
    if (verified) {
        activityClient.sendPageRequestedActivity(pxCtx, localConfig);
    } else {
        activityClient.sendBlockActivity(pxCtx, localConfig);
    }

    // handle pxhd cookie
    if (pxCtx.pxhd) {
        var pxhdCookie = new Cookie('_pxhd', pxCtx.pxhd);
        pxhdCookie.setMaxAge(31556952);
        pxhdCookie.setPath('/');
        response.addHttpCookie(pxhdCookie);
    }

    if (localConfig.additionalActivityHandler) {
        var handled = localConfig.additionalActivityHandler(pxCtx, localConfig);
        if (handled) {
            return false;
        }
    }

    // pass request if monitor or score is lower then blocking score
    var shouldBypassMonitor = localConfig.bypassMonitorHeader && request.getHttpHeaders().get(localConfig.bypassMonitorHeader) === '1';
    if (verified || (localConfig.moduleMode === 0 && !shouldBypassMonitor)) {
        return (resObj ? true : onRequestResponseObj);
    }

    var acceptHeaderValue = request.getHttpHeaders().get('accept') || request.getHttpHeaders().get('content-type');
    if (acceptHeaderValue && pxCtx.cookieOrigin === 'cookie') {
        var splittedHeaders = acceptHeaderValue.split(',');
        for (var i = 0; i < splittedHeaders.length; i++) {
            if (splittedHeaders[i].toLowerCase() === 'application/json') {
                isJsonResponse = true;
                break;
            }
        }
    }

    if (pxCtx.blockAction === 'j') {
        templateName = 'javascript_content';
        var contentType = 'application/javascript';
        pxLogger.debug('Enforcing action: challenge page is served', localConfig.appId);
        if (resObj) {
            if (!resObj.getView) { // SFRA used
                resObj.render(templateName, {
                    blockData: pxCtx.blockActionData,
                    contentType: contentType
                });
            } else { // SGJC used
                resObj.getView(templateName, {
                    blockData: pxCtx.blockActionData,
                    contentType: contentType
                }).render(templateName);
            }
        }

        onRequestResponseObj = {
            verified: false,
            blockAction: pxCtx.blockAction,
            blockData: pxCtx.blockActionData
        };
        return onRequestResponseObj;
    }

    if (pxCtx.blockAction === 'r') {
        templateName = 'ratelimit';
        response.setStatus(429);
        if (resObj) {
            if (!resObj.getView) { // SFRA used
                resObj.render(templateName);
                next();
            } else { // SGJC used
                resObj.getView(templateName).render(templateName);
            }
            return false;
        }

        onRequestResponseObj = {
            verified: false,
            blockAction: pxCtx.blockAction,
            templateName: templateName
        };
        return onRequestResponseObj;
    }

    var jsClientSrc = '//' + localConfig.clientHost + '/' + localConfig.appId + '/main.min.js';
    var captchaSrc = '//' + localConfig.captchaScriptHost + '/' + localConfig.appId + '/captcha.js?a=' + pxCtx.blockAction + '&u=' + pxCtx.uuid + '&v=' +
        (pxCtx.vid || '') + '&m=' + (pxCtx.cookieOrigin === 'header' ? '1' : '0');
    if (localConfig.firstPartyEnabled && pxCtx.cookieOrigin !== 'header') {
        var fullPath = URLUtils.https('PXFP-Handle').toString() + '?src=';

        jsClientSrc = fullPath + encodeURIComponent(localConfig.appId.substring(2) + localConfig.firstPartyVendorPath);
        captchaSrc = fullPath + encodeURIComponent(localConfig.appId.substring(2) + localConfig.firstPartyCaptchaPath + '?a=' + pxCtx.blockAction + '&u=' + pxCtx.uuid +
            '&v=' + (pxCtx.vid || '') + '&m=' + (pxCtx.cookieOrigin === 'header' ? '1' : '0'));
    }

    var blockData = {
        refId: pxCtx.uuid,
        appId: localConfig.appId,
        vid: pxCtx.vid || '',
        uuid: pxCtx.uuid,
        logoVisibility: localConfig.customLogo ? 'visible' : 'hidden',
        customLogo: localConfig.customLogo,
        hostUrl: 'https://collector-' + localConfig.appId.toLowerCase() + '.perimeterx.net',
        refUrl: request.getHttpURL(),
        cssRef: localConfig.cssRef,
        jsRef: localConfig.jsRef,
        firstPartyEnabled: localConfig.firstPartyEnabled,
        jsClientSrc: jsClientSrc,
        blockScript: captchaSrc
    };

    pxLogger.debug('Enforcing action: ' + pxUtils.parseAction(pxCtx.blockAction) + ' page is served' + (isJsonResponse ? ' using advanced protection mode' : ''), localConfig.appId);

    response.setStatus(403);

    if (resObj) {
        if (isJsonResponse) { // advanced blocking response enabled for this request
            var jsonResponse = getJSONResponse(blockData);
            templateName = 'abr';
            if (!resObj.getView) { // SFRA used
                resObj.json(JSON.parse(jsonResponse));
            } else { // SGJC used
                resObj.getView(templateName, {
                    blockData: jsonResponse
                }).render(templateName);
            }

            return false;
        }

        if (!resObj.getView) { // SFRA used
            resObj.render(templateName, {
                blockData: blockData
            });
        } else { // SGJC used
            resObj.getView(templateName, {
                blockData: blockData
            }).render(templateName);
        }
    } else { // OnRequest used
        onRequestResponseObj = {
            verified: false,
            blockAction: (isJsonResponse ? 'jsonResponse' : pxCtx.blockAction),
            blockData: (isJsonResponse ? getJSONResponse(blockData) : blockData),
            templateName: templateName
        };

        return onRequestResponseObj;
    }
    return false;
}

/**
 * An optional validation function to be used with SFRA. Can be used in controllers if onRequest is not wanted.
 * @param  {object}   req  SFRA request object
 * @param  {object}   res  SFRA response object
 * @param  {Function} next SFRA function to call the next middleware in the chain
 * @return {object}        response
 */
function pxVerifySFRA(req, res, next) {
    if (!config) {
        next();
    }
    var appId = config.appId;
    //pxLogger.debug('Starting request verification', appId);
    try {
        if (!verifyPath(config.filters) || !verifyIP(config.ipFilters)) {
            next();
        }
        if (!config.moduleEnabled) {
            pxLogger.debug('Request will not be verified, module is disabled.', appId);
            next();
        }

        pxCtx.init(request.getHttpHeaders(), config);
        //pxLogger.debug('Request context created successfully', appId);

        var telemetryHeaderValue = request.getHttpHeaders().get(telemetryHeader);
        if (telemetryHeaderValue) {
            pxTelemetry.sendTelemetryActivity(telemetryHeaderValue, config);
        }

        if (!cookieValidator.verify(pxCtx, config)) {
            riskValidator.verify(pxCtx, config);
        }

        handleVerification(res, config);
        next();
    } catch (ex) {
        pxLogger.error('error in PerimeterX: ' + ex.message, config.appId);
        next();
    }
}

/**
 * An optional validation function to be used with SGJC. Can be used in controllers if onRequest is not wanted.
 * @param  {object} app SGJC app object.
 * @return {object}     response object.
 */
function pxVerify(app) {
    if (config) {
        var appId = config.appId;
        //pxLogger.debug('Starting request verification', appId);
        try {
            if (!verifyPath(config.filters) || !verifyIP(config.ipFilters)) {
                return 1;
            }
            if (!config.moduleEnabled) {
                pxLogger.debug('Request will not be verified, module is disabled.', appId);
                return 1;
            }

            pxCtx.init(request.getHttpHeaders(), config);
           // pxLogger.debug('Request context created successfully', appId);

            var telemetryHeaderValue = request.getHttpHeaders().get(telemetryHeader);
            if (telemetryHeaderValue) {
                pxTelemetry.sendTelemetryActivity(telemetryHeaderValue, config);
            }

            if (!cookieValidator.verify(pxCtx, config)) {
                riskValidator.verify(pxCtx, config);
            }

            return handleVerification(app, config);
        } catch (ex) {
            pxLogger.error('error in PerimeterX: ' + ex.message, config.appId);
        }
    }
    return 1;
}

/**
 * Validation function used by the onRequest hook.
 * @return {object} response object.
 */
function pxVerifyOnRequest() {
    if (!config) {
        return null;
    }
    var appId = config.appId;
    //pxLogger.debug('Starting request verification', appId);
    try {
        if (!verifyPath(config.filters) || !verifyIP(config.ipFilters)) {
            return null;
        }
        if (!config.moduleEnabled) {
            pxLogger.debug('Request will not be verified, module is disabled.', appId);
            return null;
        }

        pxCtx.init(request.getHttpHeaders(), config);
       // pxLogger.debug('Request context created successfully', appId);

        var telemetryHeaderValue = request.getHttpHeaders().get(telemetryHeader);
        if (telemetryHeaderValue) {
            pxTelemetry.sendTelemetryActivity(telemetryHeaderValue, config);
        }

        if (!cookieValidator.verify(pxCtx, config)) {
            riskValidator.verify(pxCtx, config);
        }

        return handleVerification(null, config);
    } catch (ex) {
        pxLogger.error('error in PerimeterX: ' + ex.message, config.appId);
        return null;
    }
}

module.exports = {
    pxVerify: pxVerify,
    pxVerifySFRA: pxVerifySFRA,
    pxVerifyOnRequest: pxVerifyOnRequest
};
