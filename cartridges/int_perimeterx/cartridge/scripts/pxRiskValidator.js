var pxLogger = require('./pxLogger');
var pxConstants = require('./pxConstants');
var pxUtils = require('./pxUtils');

var PXServices = require('./services/PXServiceInit.js');

/**
 * Method to send a risk_api request to PerimeterX cloud using Services Framework
 * @param  {object} pxCtx    PerimeterX context object
 * @param  {object} pxConfig PerimeterX config object
 * @return {object}          result of risk api request
 */
function sendRiskRequest(pxCtx, pxConfig) {
    var url = pxConfig.perimeterxServerHost + pxConstants.RISK_API;

    var riskMode = 'active_blocking';
    if (pxConfig.moduleMode === 0) {
        riskMode = 'monitor';
    }

    var vidSource = 'none';
    if (pxCtx.vid) {
        vidSource = 'risk_cookie';
    } else if (pxCtx.getPxvidCookie()) {
        vidSource = 'vid_cookie';
    }

    var requestBody = {
        request: {
            ip: pxCtx.ip,
            headers: pxUtils.formatHeaders(pxCtx.headers, pxConfig),
            url: pxCtx.fullUrl,
            firstParty: pxConfig.firstPartyEnabled
        },
        additional: {
            s2s_call_reason: pxCtx.s2sCallReason,
            module_version: pxConfig.sdkName,
            http_method: pxCtx.httpMethod,
            request_cookie_names: pxCtx.requestCookieNames,
            risk_mode: riskMode,
            px_cookie_hmac: pxCtx.hmac,
            cookie_origin: pxCtx.cookieOrigin,
            enforcer_vid_source: vidSource
        }
    };

    requestBody.vid = pxCtx.vid || pxCtx.getPxvidCookie() || '';

    if (pxCtx.getPxhdCookie()) {
        requestBody.pxhd = pxCtx.getPxhdCookie();
    }

    if (pxCtx.uuid) {
        requestBody.uuid = pxCtx.uuid;
    }

    if (pxCtx.originalUuid) {
        requestBody.additional.original_uuid = pxCtx.originalUuid;
    }

    if (pxCtx.s2sCallReason === 'cookie_decryption_failed') {
        requestBody.additional.px_orig_cookie = pxCtx.getPxCookie();
    } else if (pxCtx.s2sCallReason === 'cookie_expired' || pxCtx.s2sCallReason === 'cookie_validation_failed') {
        requestBody.additional.px_cookie = JSON.stringify(pxCtx.decodedCookie);
    }

    if (pxCtx.originalTokenError) {
        requestBody.additional.original_token_error = pxCtx.originalTokenError;
    }

    if (pxCtx.originalToken) {
        requestBody.additional.original_token = pxCtx.originalToken;
    }

    if (pxCtx.decodedOriginalToken) {
        requestBody.additional.px_decoded_original_token = pxCtx.decodedOriginalToken;
    }

    if (pxConfig.enrichCustomParameters && (typeof pxConfig.enrichCustomParameters === 'function')) {
        var riskCustomParams = pxUtils.handleCustomParams(pxConfig);
        for (var key in riskCustomParams) {
            if (Object.prototype.hasOwnProperty.call(riskCustomParams, key)) {
                requestBody.additional[key] = riskCustomParams[key];
            }
        }
    }

    var startRiskRtt = Date.now();

    var result = PXServices.collectorAPIService.setURL(url).setRequestMethod('POST')
    .addHeader('Authorization', 'Bearer ' + pxConfig.authToken)
    .addHeader('Content-Type', 'application/json')
    .call(JSON.stringify(requestBody));

    pxCtx.riskRtt = Date.now() - startRiskRtt;

    return result;
}

/**
 * Calls to and verifies risk_api requests
 * @param  {object} pxCtx    PerimeterX context object
 * @param  {object} pxConfig PerimeterX config object
 */
function verify(pxCtx, pxConfig) {
    pxLogger.debug('Evaluating Risk API request, call reason: ' + pxCtx.s2sCallReason + ', round_trip_time: ' + pxCtx.riskRtt, pxConfig.appId);
    var riskResponse = sendRiskRequest(pxCtx, pxConfig);
    pxCtx.madeS2SCall = true;

    if (riskResponse && riskResponse.status && riskResponse.status === 'OK') {
        var riskResponseResult = riskResponse.object;
        pxLogger.debug('Risk API response returned successfully, risk score: ' + riskResponseResult.score, pxConfig.appId);
        var score = riskResponseResult.score;
        pxCtx.score = score;
        pxCtx.uuid = riskResponseResult.uuid;
        pxCtx.blockAction = riskResponseResult.action;
        pxCtx.pxhd = riskResponseResult.pxhd || '';
        if (riskResponseResult.action === 'j' && riskResponseResult.action_data && riskResponseResult.action_data.body) {
            pxCtx.blockActionData = riskResponseResult.action_data.body;
            pxCtx.blockReason = 'challenge';
        } else if (riskResponseResult.action === 'r') {
            pxCtx.blockReason = 'exceeded_rate_limit';
        } else if (score >= pxConfig.blockingScore) {
            pxLogger.debug('Risk score is higher or equal to blocking score. score: ' + score + ', blocking score: ' + pxConfig.blockingScore, pxConfig.appId);
            pxCtx.blockReason = 's2s_high_score';
        } else {
            pxLogger.debug('Risk score lower than blocking score. score: ' + score + ', blocking score: ' + pxConfig.blockingScore, pxConfig.appId);
            pxCtx.passReason = 's2s';
        }
    } else {
        pxLogger.error('Unexpected exception in Risk API call.');
        pxCtx.passReason = 's2s_error';
    }
}

module.exports = {
    verify: verify
};

