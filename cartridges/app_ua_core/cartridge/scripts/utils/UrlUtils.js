'use strict';

/* API includes */
var Site = require('dw/system/Site');
var URLAction = require('dw/web/URLAction');
var URLParameter = require('dw/web/URLParameter');
var URLUtils = require('dw/web/URLUtils');

/**
 * Returns site url
 * @param {string} siteID - Site ID
 * @param {string} locale - Locale ID
 * @return {string} url - Generated URL
 */
function getWebsiteURL(siteID, locale) {
    var actionUrl = new URLAction('Home-Show', siteID, locale);
    var url = URLUtils.url(actionUrl);

    return url;
}

/**
 * Generate URL for the current request with locale
 * @param {PipelineDictionary} pdict the pipeline dictionary object of current request
 * @param {string} locale the locale
 * @return {string} url - Generated URL
 */
function getCurrent(pdict, locale) {
    var currentAction = pdict.CurrentSession.clickStream.last.pipelineName;
    var siteId = Site.getCurrent().getID();

    var urlAction = new URLAction(currentAction, siteId, locale || 'default');
    var args = [urlAction];
    var parameterMap = pdict.CurrentHttpParameterMap;
    var parameterNames = parameterMap.getParameterNames();

    // Iterate over current request's parameters, put them into the URL
    for (var i = 0; i < parameterNames.length; i++) {
        var key = parameterNames[i];
        var val = parameterMap.get(key).getValue();
        if (key !== 'lang') {
            args.push(new URLParameter(key, val));
        }
    }

    return URLUtils.url.apply(null, args);
}

module.exports = {
    getWebsiteURL: getWebsiteURL,
    getCurrent: getCurrent
};
