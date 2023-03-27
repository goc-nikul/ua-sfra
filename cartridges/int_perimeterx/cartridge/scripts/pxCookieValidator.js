var CookieV3 = require('./cookieV3');
var TokenV3 = require('./tokenV3');
var pxLogger = require('./pxLogger');
var originalTokenValidator = require('./pxOriginalTokenValidator');

/**
 * Method that verifies a PerimeterX cookie or token
 * @param  {object} pxCtx    PerimeterX context object
 * @param  {object} pxConfig PerimeterX config object
 * @return {boolean}          true if verified
 */
function verify(pxCtx, pxConfig) {
    var appId = pxConfig.appId;
    try {
        var pxCookie = pxCtx.getPxCookie();
        if (!pxCookie) {
            pxLogger.debug('Cookie is missing', appId);
            pxCtx.s2sCallReason = pxCtx.getPxhdCookie() ? 'no_cookie_w_vid' : 'no_cookie';
            return false;
        }

        // Mobile SDK traffic
        if (pxCookie && pxCtx.cookieOrigin === 'header') {
            if (pxCookie.match(/^\d+$/)) {
                pxCtx.s2sCallReason = 'mobile_error_' + pxCookie;
                if (pxCtx.originalToken) {
                    originalTokenValidator.verify(pxCtx, pxConfig);
                }
                return false;
            }
        }
        var payload;
        if (pxCtx.cookieOrigin === 'cookie') {
            payload = new CookieV3(pxCtx, pxConfig);
        } else {
            payload = new TokenV3(pxCtx, pxConfig, pxCtx.getPxCookie());
        }

        pxLogger.debug('Cookie V3 found, Evaluating', appId);

        if (!payload.deserialize()) {
            pxLogger.debug('Cookie decryption failed, value: ' + pxCookie, appId);
            pxCtx.s2sCallReason = 'cookie_decryption_failed';
            return false;
        }

        pxCtx.decodedCookie = payload.decodedCookie;
        pxCtx.uuid = payload.decodedCookie.u;
        pxCtx.vid = payload.decodedCookie.v;
        pxCtx.hmac = payload.getHmac();
        pxCtx.blockAction = payload.getBlockAction();
        pxCtx.score = payload.getScore();

        if (payload.isExpired()) {
            var cookieAge = Date.now() - payload.getTime();
            pxLogger.debug('Cookie TTL is expired, value: ' + JSON.stringify(pxCtx.decodedCookie) + ', age: ' + cookieAge, appId);
            pxCtx.s2sCallReason = 'cookie_expired';
            return false;
        }

        if (payload.isHighscore()) {
            pxLogger.debug('Cookie evaluation ended successfully, risk score: ' + pxCtx.score, appId);
            pxCtx.blockReason = 'cookie_high_score';
            return true;
        }

        if (!payload.isSecure()) {
            pxLogger.debug('Cookie HMAC validation failed, value: ' + JSON.stringify(pxCtx.decodedCookie) + ', user-agent: ' + pxCtx.userAgent, appId);
            pxCtx.s2sCallReason = 'cookie_validation_failed';
            return false;
        }

        if (pxCtx.checkSensitiveRoute(pxConfig.sensitiveRoutes, pxCtx.uri)) {
            pxLogger.debug('Sensitive route match, sending Risk API. path: ' + pxCtx.uri);
            pxCtx.s2sCallReason = 'sensitive_route';
            return false;
        }

        pxLogger.debug('Cookie evaluation ended successfully, risk score: ' + pxCtx.score, appId);
        pxCtx.passReason = 'cookie';
        return true;
    } catch (ex) {
        pxLogger.error('Unexpected exception while evaluating Risk cookie: ' + ex.message, appId);
        return false;
    }
}

module.exports = {
    verify: verify
};
