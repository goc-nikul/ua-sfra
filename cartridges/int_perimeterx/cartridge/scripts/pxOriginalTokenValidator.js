var TokenV3 = require('./tokenV3');
var pxLogger = require('./pxLogger');

/**
 * Method that verifies a PerimeterX mobile SDK original token
 * @param  {object} pxCtx    PerimeterX context object
 * @param  {object} pxConfig PerimeterX config object
 * @return {boolean}          true if verified
 */
function verify(pxCtx, pxConfig) {
    var appId = pxConfig.appId;
    try {
        var payload = new TokenV3(pxCtx, pxConfig, pxCtx.originalToken);
        pxLogger.debug('Original token found, Evaluating', appId);

        if (!payload.deserialize()) {
            pxLogger.debug('Original Token decryption failed, value: ' + pxCtx.originalToken, appId);
            pxCtx.originalTokenError = 'cookie_decryption_failed';
            return false;
        }

        pxCtx.decodedOriginalToken = payload.decodedCookie;
        pxCtx.originalUuid = payload.decodedCookie.u;
        pxCtx.vid = payload.decodedCookie.v;

        if (!payload.isSecure()) {
            pxLogger.debug('Cookie HMAC validation failed, value: ' + JSON.stringify(payload.decodedCookie) + ', user-agent: ' + pxCtx.userAgent, appId);
            pxCtx.originalTokenError = 'cookie_validation_failed';
            return false;
        }

        return true;
    } catch (ex) {
        pxLogger.error('Unexpected exception while evaluating original token: ' + ex.message, appId);
        return false;
    }
}

module.exports = {
    verify: verify
};
