var pxLogger = require('./pxLogger');
var pxUtils = require('./pxUtils');

var mobileSdkHeader = 'x-px-authorization';
var mobileSdkOriginalTokenHeader = 'x-px-original-token';

// private methods
/**
 * Method Extracts token from header
 * @param  {string} header header name to extract token from
 * @return {object}        object containing a token or the header value
 */
function getTokenObject(header) {
    if (header.indexOf(':') > -1) {
        var splittedHeader = header.split(':');
        var version = splittedHeader.splice(0, 1);
        if (version === '3') {
            return { key: '_px3', value: splittedHeader.join(':') };
        }
    }
    return { key: '_px3', value: header };
}

/**
 * Method to format headers from request object
 * @return {object} formatted headers
 */
function handleHeaders() {
    var headers = request.getHttpHeaders();
    var result = {};
    var keys = headers.keySet().toArray();
    for (var i = 0; i < keys.length; i++) {
        result[keys[i]] = headers.get(keys[i]);
    }
    return result;
}

/**
 * Method to check whether a route is sensitive or not
 * @param  {array} sensitiveRoutes list of sensitive routes
 * @param  {string} uri             a uri to verify
 * @return {boolean}                 true if a route is sensitive
 */
function checkSensitiveRoute(sensitiveRoutes, uri) {
    for (var i = 0; i < sensitiveRoutes.length; i++) {
        if (uri.toLowerCase().search(sensitiveRoutes[i].toLowerCase()) > -1) {
            return true;
        }
    }
    return false;
}

/**
 * Method to initialize the PerimeterX context object
 * @param  {array} headers  an array of headers
 * @param  {object} pxConfig PerimeterX config object
 */
function init(headers, pxConfig) {
    this.cookieOrigin = 'cookie';
    this.pxCookies = {};
    this.httpMethod = request.getHttpMethod() || '';
    this.headers = handleHeaders();
    this.ip = pxUtils.extractIP(pxConfig, headers);
    this.fullUrl = request.getHttpProtocol() + '://' + request.getHttpHost() + request.getHttpPath();
    this.uri = request.getHttpPath();
    this.hostname = request.getHttpHost();
    this.score = 0;
    this.blockAction = 'c';
    this.userAgent = request.getHttpUserAgent();
    this.sensitiveRoute = checkSensitiveRoute(pxConfig.sensitiveRoutes, this.uri);
    this.requestCookieNames = [];

    var mobileHeader = headers.get(mobileSdkHeader);
    if (mobileHeader) {
        this.originalToken = headers.get(mobileSdkOriginalTokenHeader);
        this.cookieOrigin = 'header';
        pxLogger.debug('Mobile SDK token detected');
        var tokenObject = getTokenObject(mobileHeader);
        this.pxCookies[tokenObject.key] = tokenObject.value;
    } else {
        var cookies = request.getHttpCookies();
        var self = this;

        for (var i = 0; i < cookies.getCookieCount(); i++) {
            var cookie = cookies[i];
            self.requestCookieNames.push(cookie.name);
            if (cookie.name.match(/^_px/)) {
                self.pxCookies[cookie.name] = cookie.value;
            }
        }
    }
}

/**
 * Method to return a _px3 cookie from the pxCookies array
 * @return {string} a PerimeterX cookie
 */
function getPxCookie() {
    return this.pxCookies['_px3'] ? this.pxCookies['_px3'] : '';
}

/**
 * Method to return a pxhd cookie from the pxCookies array
 * @return {string} pxhd cookie
 */
function getPxhdCookie() {
    return this.pxCookies['_pxhd'] ? this.pxCookies['_pxhd'] : '';
}

/**
 * Method to return a _pxvid cookie from the pxCookies array
 * @return {string} _pxvid cookie
 */
function getPxvidCookie() {
    return this.pxCookies['_pxvid'] ? this.pxCookies['_pxvid'] : '';
}

module.exports = {
    init: init,
    getPxCookie: getPxCookie,
    getPxhdCookie: getPxhdCookie,
    getPxvidCookie: getPxvidCookie,
    checkSensitiveRoute: checkSensitiveRoute
};

