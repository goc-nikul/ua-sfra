'use strict';
var pxConfig = require('int_perimeterx/cartridge/scripts/pxConfig');
var PXServices = require('int_perimeterx/cartridge/scripts/services/PXServiceInit.js');
var pxLogger = require('int_perimeterx/cartridge/scripts/pxLogger');
var pxUtils = require('int_perimeterx/cartridge/scripts/pxUtils');
var Encoding = require('dw/crypto/Encoding');
var pxConstants = require('int_perimeterx/cartridge/scripts/pxConstants');

var server = require('server');

/**
 * Returns a VID value
 * @param  {string} cookies request cookies
 * @return {string}         pxvid value
 */
function getPXVID(cookies) {
    var result = '';
    var cookieArray = cookies != null ? cookies.split(/;\s?/) : new Array();
    cookieArray.forEach(function (cookie) {
        var splittedCookie = cookie.split('=');
        if (splittedCookie[0] === 'pxvid' || splittedCookie[0] === '_pxvid') {
            result = 'pxvid=' + splittedCookie[1] + ';';
        }
    });
    return result;
}

/**
 * Handles first-party captcha related POST requests.
 */
server.post('CAPTCHA', function (req, res, next) {
    var config = pxConfig.getConfig();
    try {
        if (!config.firstPartyEnabled) {
            res.setStatusCode(200);
            if (req.path.indexOf('.gif') > -1) {
                res.setHttpHeader('Content-Type', 'image/gif');
                res.print(Encoding.fromBase64('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='));
            } else {
                res.setHttpHeader('Content-Type', 'application/javascript');
                res.print('{}');
            }
        } else {
            var cookieValue = getPXVID(req.httpHeaders.get('cookie'));
            var body;

            var url = config.perimeterxCollectorHost + pxConstants.CAPTCHA_API;
            pxLogger.debug('Forwarding CAPTCHA request to ' + url, config.appId);

            var svc = PXServices.collectorFirstPartyAPIService.setURL(url).setRequestMethod('POST')
            .addHeader('Host', config.perimeterxCollectorHost)
            .addHeader('X-PX-FIRST-PARTY', '1')
            .addHeader('X-PX-ENFORCER-TRUE-IP', pxUtils.extractIP(config, req.httpHeaders));

            if (cookieValue) {
                svc.addHeader('Cookie', cookieValue);
            }

            var filteredHeaders = pxUtils.handleProxyHeaders(req.httpHeaders, config);
            if (filteredHeaders && typeof filteredHeaders === 'object' && Object.keys(filteredHeaders).length > 0) {
                for (var key in filteredHeaders) {
                    if (Object.prototype.hasOwnProperty.call(filteredHeaders, key)) {
                        svc.addHeader(key, filteredHeaders[key]);
                    }
                }
            }

            if (req.form) {
                var k;
                var formContentType = req.httpHeaders.get('content-type');
                if (formContentType === 'application/x-www-form-urlencoded') {
                    body = '';
                    for (k in req.form) {
                        if (Object.prototype.hasOwnProperty.call(req.form, k)) {
                            body += k + '=' + req.form[k] + '&';
                        }
                    }
                    body = body.substring(0, body.length - 1);
                } else {
                    body = {};
                    for (k in req.form) {
                        if (Object.prototype.hasOwnProperty.call(req.form, k)) {
                            body[k] = req.form[k];
                        }
                    }
                }
            }

            var result = svc.call(body);
            if (result && result.object) {
                var contentTypeRaw = result.object.headers.get('Content-Type');
                var contentType = contentTypeRaw.getLength() > 0 ? contentTypeRaw.get(0) : 'application/javascript';
                res.setStatusCode(result.object.statusCode);
                res.setContentType(contentType);
                res.print(result.object.text);
            } else {
                res.print('');
            }
        }
    } catch (ex) {
        pxLogger.debug('PXFP CAPTCHA Error: ' + ex, config.appId);
    }

    next();
});

/**
 * Handles first-party XHR POST requests (browser activities).
 */
server.post('XHR', function (req, res, next) {
    var config = pxConfig.getConfig();
    try {
        if (!config.firstPartyEnabled) {
            res.setStatusCode(200);
            if (req.path.indexOf('.gif') > -1) {
                res.setHttpHeader('Content-Type', 'image/gif');
                res.print(Encoding.fromBase64('R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='));
            } else {
                res.setHttpHeader('Content-Type', 'application/javascript');
                res.print('{}');
            }
        } else {
            var cookieValue = getPXVID(req.httpHeaders.get('cookie'));
            var body;

            var url = config.perimeterxCollectorHost + pxConstants.XHR_API;
            pxLogger.debug('Forwarding XHR request to ' + url, config.appId);

            var svc = PXServices.collectorFirstPartyAPIService.setURL(url).setRequestMethod('POST')
            .addHeader('Host', config.perimeterxCollectorHost)
            .addHeader('X-PX-FIRST-PARTY', '1')
            .addHeader('X-PX-ENFORCER-TRUE-IP', pxUtils.extractIP(config, req.httpHeaders));

            if (cookieValue) {
                svc.addHeader('Cookie', cookieValue);
            }

            var filteredHeaders = pxUtils.handleProxyHeaders(req.httpHeaders, config);
            if (filteredHeaders && typeof filteredHeaders === 'object' && Object.keys(filteredHeaders).length > 0) {
                for (var key in filteredHeaders) {
                    if (Object.prototype.hasOwnProperty.call(filteredHeaders, key)) {
                        svc.addHeader(key, filteredHeaders[key]);
                    }
                }
            }

            if (req.form) {
                var k;
                var formContentType = req.httpHeaders.get('content-type');
                if (formContentType === 'application/x-www-form-urlencoded') {
                    body = '';
                    for (k in req.form) {
                        if (Object.prototype.hasOwnProperty.call(req.form, k)) {
                            body += k + '=' + req.form[k] + '&';
                        }
                    }
                    body = body.substring(0, body.length - 1);
                } else {
                    body = {};
                    for (k in req.form) {
                        if (Object.prototype.hasOwnProperty.call(req.form, k)) {
                            body[k] = req.form[k];
                        }
                    }
                }
            }

            var result = svc.call(body);
            if (result && result.object) {
                var contentTypeRaw = result.object.headers.get('Content-Type');
                var contentType = contentTypeRaw.getLength() > 0 ? contentTypeRaw.get(0) : 'application/javascript';
                res.setStatusCode(result.object.statusCode);
                res.setContentType(contentType);
                res.print(result.object.text);
            } else {
                res.print('');
            }
        }
    } catch (ex) {
        pxLogger.debug('PXFP XHR Error: ' + ex, config.appId);
    }

    next();
});

/**
 * Handles first-party scripts fetching requests.
 */
server.use('Handle', function (req, res, next) {
    var config = pxConfig.getConfig();
    try {
        var queryParams = req.querystring;
        var fpAppId = config.appId.substring(2);
        var result;
        var contentType;
        var contentTypeRaw;

        if (queryParams.src) {
            // first party JavaScript sensor
            if (queryParams.src === fpAppId + '/init.js') {
                if (!config.firstPartyEnabled) {
                    res.setStatusCode(200);
                    res.setHttpHeader('Content-Type', 'application/javascript');
                    res.print('');
                } else {
                    var url = PXServices.clientAPIService.getURL() + '/' + config.appId + '/main.min.js';
                    pxLogger.debug('Forwarding client request to ' + url, config.appId);

                    result = PXServices.clientAPIService.setURL(url).setRequestMethod('GET')
                    .addHeader('X-PX-FIRST-PARTY', '1')
                    .addHeader('X-PX-ENFORCER-TRUE-IP', pxUtils.extractIP(config, req.httpHeaders))
                    .call();

                    if (result && result.object) {
                        contentTypeRaw = result.object.headers.get('Content-Type');
                        contentType = contentTypeRaw.getLength() > 0 ? contentTypeRaw.get(0) : 'application/javascript';
                        res.setStatusCode(result.object.statusCode);
                        res.setContentType(contentType);
                        res.print(result.object.text);
                    } else {
                        res.print('');
                    }
                }
            }
            // first party challenge sensor
            if (queryParams.src.indexOf(fpAppId + '/captcha') > -1) {
                if (!config.firstPartyEnabled) {
                    res.setStatusCode(200);
                    res.setHttpHeader('Content-Type', 'application/javascript');
                    res.print('');
                } else {
                    var filteredQuery = queryParams.src.replace(/(^_|(&_)).*?(?=&|$)/gm, '');
                    filteredQuery = filteredQuery[0] === '&' ? filteredQuery.substr(1) : filteredQuery;
                    var captchaUrl = PXServices.captchaScriptService.getURL() + '/' + config.appId + '/captcha.js?' + filteredQuery;
                    pxLogger.debug('Forwarding captcha script request to ' + captchaUrl, config.appId);
                    result = PXServices.clientAPIService.setURL(captchaUrl).setRequestMethod('GET').call();
                    if (result && result.object) {
                        contentTypeRaw = result.object.headers.get('Content-Type');
                        contentType = contentTypeRaw.getLength() > 0 ? contentTypeRaw.get(0) : 'application/javascript';
                        res.setStatusCode(result.object.statusCode);
                        res.setContentType(contentType);
                        res.print(result.object.text);
                    } else {
                        res.print('');
                    }
                }
            }
        }
    } catch (ex) {
        pxLogger.debug('PXFP Handle Error: ' + ex, config.appId);
    }

    next();
});

module.exports = server.exports();

