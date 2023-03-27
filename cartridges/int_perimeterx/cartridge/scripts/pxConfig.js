var site = require('dw/system/Site');
var pxUtils = require('./pxUtils');

/**
 * Method that builds the PerimeterX configuration object
 * @return {object} PerimeterX configuration
 */
function getConfig() {
    var sitePreferences = site.current.getPreferences();
    if (sitePreferences) {
        var customPreferences = sitePreferences.getCustom();
        var pxConfig = {
            appId: customPreferences.PX_appID,
            cookieKey: customPreferences.PX_cookieKey,
            authToken: customPreferences.PX_authToken,
            moduleEnabled: customPreferences.PX_moduleEnabled,
            blockingScore: customPreferences.PX_blockingScore,
            sendPageActivities: customPreferences.PX_sendPageActivities,
            sendBlockActivities: customPreferences.PX_sendBlockActivities,
            debugMode: customPreferences.PX_debugMode,
            moduleMode: customPreferences.PX_moduleMode,
            cssRef: customPreferences.PX_cssRef,
            jsRef: customPreferences.PX_jsRef,
            customLogo: customPreferences.PX_customLogo,
            firstPartyEnabled: customPreferences.PX_firstPartyEnabled
        };

        pxConfig.filters = ['./__', '/pxredirect', '/sites-site/'];
        pxConfig.sensitiveHeaders = (empty(customPreferences.PX_sensitiveHeaders) || customPreferences.PX_sensitiveHeaders == null ?
            new Array('cookies', 'cookie') : customPreferences.PX_sensitiveHeaders.split(','));
        pxConfig.sensitiveRoutes = (empty(customPreferences.PX_sensitiveRoutes) || customPreferences.PX_sensitiveRoutes === null ? new Array() : customPreferences.PX_sensitiveRoutes.split(','));
        pxConfig.ipHeaders = (empty(customPreferences.PX_ipHeaders) || customPreferences.PX_ipHeaders == null ? new Array() : customPreferences.PX_ipHeaders.split(','));
        pxConfig.perimeterxServerHost = pxConfig.appId && 'https://sapi-' + pxConfig.appId.toLowerCase() + '.perimeterx.net';
        pxConfig.perimeterxCollectorHost = pxConfig.appId && 'https://collector-' + pxConfig.appId.toLowerCase() + '.perimeterx.net';
        pxConfig.sdkName = 'Salesforce Enforcer v20.1.0';
        pxConfig.captchaScriptHost = 'captcha.px-cdn.net';
        pxConfig.clientHost = 'client.perimeterx.net';
        pxConfig.firstPartyCaptchaPath = '/captcha';
        pxConfig.firstPartyVendorPath = '/init.js';
        pxConfig.ipFilters = [];
        pxConfig.controllersCartridge = (empty(customPreferences.PX_controllersCartridge) || customPreferences.PX_controllersCartridge == null ?
            'app_storefront_controllers' : customPreferences.PX_controllersCartridge);

        var shouldUseDefaultBlockTemplate = empty(customPreferences.PX_customBlockPage) || customPreferences.PX_customBlockPage === null;
        pxConfig.blockPageTemplate = shouldUseDefaultBlockTemplate ? 'block_template' : customPreferences.PX_customBlockPage.toLowerCase().split('.isml')[0];

        try {
            var bypassMonitorModeConfigured = !empty(customPreferences.PX_bypassMonitorHeader) || customPreferences.PX_bypassMonitorHeader !== null;
            if (bypassMonitorModeConfigured) {
                pxConfig.bypassMonitorHeader = customPreferences.PX_bypassMonitorHeader;
            }
        } catch (ex) {
            // PX_bypassMonitorHeader doesn't exists on server
        }


        if (!empty(customPreferences.PX_filters)) {
            var routesToAdd = customPreferences.PX_filters.split(',');
            for (var rIndex = 0; rIndex < routesToAdd.length; rIndex++) {
                pxConfig.filters.push(routesToAdd[rIndex].toLowerCase());
            }
        }

        if (!empty(customPreferences.PX_IP_filters)) {
            var ipsToAdd = customPreferences.PX_IP_filters.split(',');
            for (var i = 0; i < ipsToAdd.length; i++) {
                var ipObj = pxUtils.calculateIPObject(ipsToAdd[i]);
                pxConfig.ipFilters.push(ipObj);
            }
        }

        return pxConfig;
    }

    return null;
}

module.exports = {
    getConfig: getConfig
};
