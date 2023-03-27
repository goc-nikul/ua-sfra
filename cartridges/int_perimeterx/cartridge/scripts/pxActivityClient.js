var pxConstants = require('./pxConstants');
var pxUtils = require('./pxUtils');
var PXServices = require('./services/PXServiceInit.js');

/**
 * Method that sends cartridge activities to PerimeterX services. Uses Services Framework.
 * @param  {string} activityType type of activity to send (page_requested/block)
 * @param  {object} details      activity data
 * @param  {object} pxCtx        PerimeterX context object
 * @param  {object} pxConfig     PerimeterX config object
 */
function postActivity(activityType, details, pxCtx, pxConfig) {
    var url = pxConfig.perimeterxServerHost + pxConstants.ACTIVITY_API;

    details.cookie_origin = pxCtx.cookieOrigin;
    details.module_version = pxConfig.sdkName;
    details.http_method = pxCtx.httpMethod;

    var requestBody = {
        type: activityType,
        headers: pxUtils.formatHeaders(pxCtx.headers, pxConfig),
        socket_ip: pxCtx.ip,
        px_app_id: pxConfig.appId,
        url: pxCtx.fullUrl,
        details: details
    };

    if (pxCtx.vid) {
        requestBody.vid = pxCtx.vid;
    }

    if (pxCtx.pxhd) {
        requestBody.pxhd = pxCtx.pxhd;
    }

    if (pxConfig.enrichCustomParameters && (typeof pxConfig.enrichCustomParameters === 'function')) {
        var riskCustomParams = pxUtils.handleCustomParams(pxConfig);
        for (var key in riskCustomParams) {
            if (Object.prototype.hasOwnProperty.call(riskCustomParams, key)) {
                requestBody.details[key] = riskCustomParams[key];
            }
        }
    }

    PXServices.collectorAPIService.setURL(url).setRequestMethod('POST')
        .addHeader('Authorization', 'Bearer ' + pxConfig.authToken)
        .addHeader('Content-Type', 'application/json')
        .call(JSON.stringify(requestBody));
}

/**
 * Method that builds a page_requested activity
 * @param  {object} pxCtx    PerimeterX context object
 * @param  {object} pxConfig PerimeterX config object
 */
function sendPageRequestedActivity(pxCtx, pxConfig) {
    if (!pxConfig.sendPageActivities) {
        return;
    }

    var details = {
        client_uuid: pxCtx.uuid,
        http_version: pxCtx.httpVersion,
        pass_reason: pxCtx.passReason,
        risk_rtt: pxCtx.riskRtt
    };

    postActivity('page_requested', details, pxCtx, pxConfig);
}

/**
 * Method that builds a block activity
 * @param  {object} pxCtx    PerimeterX context object
 * @param  {object} pxConfig PerimeterX config object
 */
function sendBlockActivity(pxCtx, pxConfig) {
    if (!pxConfig.sendBlockActivities) {
        return;
    }

    var details = {
        block_uuid: pxCtx.uuid,
        block_reason: pxCtx.blockReason,
        block_score: pxCtx.score,
        risk_rtt: pxCtx.riskRtt,
        block_action: pxCtx.blockAction,
        simulated_block: pxConfig.moduleMode === 0
    };

    postActivity('block', details, pxCtx, pxConfig);
}

module.exports = {
    sendPageRequestedActivity: sendPageRequestedActivity,
    sendBlockActivity: sendBlockActivity
};
