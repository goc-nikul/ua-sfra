'use strict';

/**
 * This module offers utility methods for use within the CoreMedia LiveContext integration.
 */

/* API Includes */
let Site = require('dw/system/Site');
let Logger = dw.system.Logger.getLogger('coremedia.util');

const CM_PREVIEW_HEADER_NAME = "cm_preview";
const CM_PREVIEW_PARAM_NAME = "preview";

const SEO_CONTROLLER_NAME = "cm";
const SEO_URL_PARAM = "contentId";
const SEO_URL_PARAM_LEGACY = "pageid";

const DEFAULT_LIVE_FRAGMENT_CACHE_TTL = 3600;
const DEFAULT_PREVIEW_FRAGMENT_CACHE_TTL = 0;
const DEFAULT_PAGE_CACHE_ON_ERROR_TTL = -1;
const DEFAULT_PAGE_CACHE_DEFAULT_TTL = -1;

/**
 * Returns the value of the given custom preference from the current site.
 *
 * @param prefName preference name
 * @returns {*} value of the given preference or null if the value could not be found
 */
function getSitePreference(prefName) {
  try {
    let site = Site.getCurrent();
    let sitePrefs = site.getPreferences();
    return sitePrefs.getCustom()[prefName];
  } catch (e) {
    Logger.error("Unable to read site preference '" + prefName + "' (" + e + ").");
  }
  return null;
}

/**
 * Returns true if the CoreMedia LiveContext integration
 * has been enabled for the current site, false otherwise.
 */
exports.isLiveContextEnabled = function () {
  let enabled = getSitePreference('CoreMediaEnabled');
  if (enabled === null) {
    enabled = false;
  }
  return enabled;
};

/**
 * Returns true if debugging for CoreMedia integration is enabled.
 */
exports.isDebugEnabled = function () {
  let enabled = getSitePreference('cmDebug');
  if (enabled === null) {
    enabled = false;
  }
  return enabled;
};

/**
 * Returns true if fragment prefetch for CoreMedia integration is enabled.
 */
exports.isPrefetchEnabled = function () {
  let enabled = getSitePreference('cmPrefetch');
  if (enabled === null) {
    enabled = false;
  }
  return enabled;
};

/**
 * Returns true if exposing errors during rendering is enabled.
 */
exports.isExposeErrorsEnabled = function () {
  let enabled = getSitePreference('cmExposeErrors');
  if (enabled === null) {
    enabled = false;
  }
  return enabled;
};

/**
 * Returns the Preview Access Token
 */
exports.getCmPreviewAccessToken = function () {
  return getSitePreference('cmPreviewAccessToken');
};

/**
 * Returns the CAE Access Token (currently used for live cae only)
 */
exports.getCmLiveAccessToken = function () {
  return getSitePreference('cmLiveAccessToken');
};

/**
 * Return the time a fragment is cached on live side (in seconds).
 * If not set, the default value is 3600.
 */
exports.getLiveFragmentCacheTTL = function () {
  let value = getSitePreference('cmLiveFragmentCacheTTL');
  return value !== null ? value : DEFAULT_LIVE_FRAGMENT_CACHE_TTL;
};

/**
 * Return the time a fragment is cached on live side (in seconds).
 * If not set, the default value is 0 (no caching).
 */
exports.getPreviewFragmentCacheTTL = function () {
  let value = getSitePreference('cmPreviewFragmentCacheTTL');
  return value !== null ? value : DEFAULT_PREVIEW_FRAGMENT_CACHE_TTL;
};

/**
 * Return the time the page is cached if an error is occurred (in seconds).
 * If not set, the default value is -1.
 */
exports.getPageCacheOnErrorTTL = function () {
  let value = getSitePreference('cmPageCacheOnErrorTTL');
  return value !== null && value !== '' ? value : DEFAULT_PAGE_CACHE_ON_ERROR_TTL;
};

/**
 * Return the time the page is cached if an error is occurred (in seconds).
 * If not set, the default value is -1.
 */
exports.getPageCacheDefaultTTL = function () {
  let value = getSitePreference('cmPageCacheDefaultTTL');
  return value !== null && value !== '' ? value : DEFAULT_PAGE_CACHE_DEFAULT_TTL;
};

/**
 * Initializes the cmContext session variable.
 */
exports.initSessionContext = function () {
  let httpParameterMap = request.httpParameterMap;

  // PreviewDate
  if (httpParameterMap.previewDate) {
    session.custom.cmPreviewDate = httpParameterMap.previewDate.stringValue;
  }

  // Personalization Testing
  if (httpParameterMap.p13n_test && httpParameterMap.p13n_testcontext) {
    session.custom.cmP13nTest = httpParameterMap.p13n_test.booleanValue;
    session.custom.cmP13nTestcontext = httpParameterMap.p13n_testcontext.stringValue;
  }

  // Developer Mode Support
  if (!empty(httpParameterMap.userVariant)) {
    session.custom.cmUserVariant = httpParameterMap.userVariant.stringValue;
  }

};

/**
 * Returns true if the current session is a preview session, false otherwise.
 * @returns {boolean}
 */
exports.isPreviewSession = function () {
  return session.custom.cmPreview === true;
};

/**
 * Check if this is a preview request or not.
 * Preview request can be triggerd by the following:
 *   - Providing a query param 'preview=true'
 *   - Providing an HTTP header 'CM_PREVIEW=true'
 *
 * Note: Providing a query parameter will override the HTTP header if provided.
 *
 * If no param or header is provided the value from the session is taken. If no session
 * is available isPreview is set to false.
 *
 * @returns {boolean}
 */
exports.isPreviewRequest = function (request) {
  let httpParameterMap = request.httpParameterMap;
  let isPreview = httpParameterMap.get(CM_PREVIEW_PARAM_NAME).booleanValue;

  if (isPreview === null) {
    let httpHeaders = request.httpHeaders;
    if (httpHeaders.containsKey(CM_PREVIEW_HEADER_NAME)) {
      isPreview = httpHeaders.get(CM_PREVIEW_HEADER_NAME);
    }
  }

  // Check if session param already exists
  if (isPreview === null) {
    isPreview = session.custom.cmPreview;
  }

  if (!isPreview) {
    isPreview = false;
  }

  return isPreview;
};

/**
 * Returns the current cmContext session variable.
 *
 * @returns {{categoryId: string, pageId: string, productId: string, previewDate: null, p13n: {test: boolean, testcontext: null}}|*}
 */
exports.sessionContext = function() {
  return {
    previewDate: session.custom.cmPreviewDate,
    p13n: {
      test: session.custom.cmP13nTest,
      testcontext: session.custom.cmP13nTestcontext
    },
    userVariant: session.custom.cmUserVariant
  };
};

exports.pageId = function(pdict) {
  if (pdict.CMContext && !empty(pdict.CMContext.pageId)) {
    return pdict.CMContext.pageId;
  }
  return '';
};

exports.productId = function(pdict) {
  if (pdict.Product && !empty(pdict.Product.ID)) {
    return pdict.Product.ID;
  }
  if (!empty(pdict.productid)) {
    return pdict.productid;
  }
  if (!empty(pdict.productId)) {
    return pdict.productId;
  }
  if (request.httpParameterMap.pid.stringValue) {
    return request.httpParameterMap.pid.stringValue;
  }
  return '';
};

exports.categoryId = function(pdict) {
  if (pdict.Category && !empty(pdict.Category.ID)) {
    return pdict.Category.ID;
  }
  if (!empty(pdict.categoryid)) {
    return pdict.categoryid;
  }
  if (!empty(pdict.categoryId)) {
    return pdict.categoryId;
  }
  //the template of a content slot of category context can access the current category
  //via the contextAUID
  if (!empty(pdict.contextAUID) && pdict.contextAUIDType === 'CATEGORY') {
    return pdict.contextAUID;
  }
  if (request.httpParameterMap.cgid.stringValue) {
    return request.httpParameterMap.cgid.stringValue;
  }
  return '';
};

exports.externalRef = function(pdict) {
  return pdict.CMContext && !empty(pdict.CMContext.externalRef) ? pdict.CMContext.externalRef : '';
};

/**
 * Checks if the given URL is a content URL and rewrites it to a very beautiful SEO URL.
 * @param URL the URL to rewrite.
 * @returns the sanitized SEO URL if the given URL is a content URL
 */
exports.sanitizeContentUrl = function(url) {
// example input URL:  /s/SiteGenesisGlobal/cm?preview=true&lang=en_GB&pageid=the-difference-between-style-and-fashion-142
  if (url.indexOf('/' + SEO_CONTROLLER_NAME + '?') !== -1 && (url.indexOf(SEO_URL_PARAM + '=') !== -1 || url.indexOf(SEO_URL_PARAM_LEGACY + '=') !== -1)) {
    let urlPrefix = url.substr(0, url.indexOf('?'));
    let queryString = url.substr(url.indexOf('?')+1);
    let params = parseQuery(queryString);
    let result = urlPrefix + "/";
    let seoSegment = params[SEO_URL_PARAM];
    if (!seoSegment) {
      seoSegment = params[SEO_URL_PARAM_LEGACY]
    }
    // in case of vanity URLs with multiple path tokens they can contain "--" as path delimiter
    seoSegment = seoSegment.replace(/--/g, '/');
    result += seoSegment + '?';
    for (let param in params) {
      if (params.hasOwnProperty(param) && param !== SEO_URL_PARAM && param !== SEO_URL_PARAM_LEGACY) {
        // !endsWith('?')
        if (result.indexOf('?', result.length - 1) < 0) {
          result += '&';
        }
        result += param + '=' + params[param];
      }
    }
    return result;
  }
  return url;
};

exports.ensurePreviewParam = function(url) {
  if (url.indexOf("preview=true") <= 0) {
    if (session.custom.cmPreview === true) {
      return url + (url.indexOf("?") < 0 ? "?" : "&") + "preview=true";
    }
  }
  return url;
};

function parseQuery(queryString) {
  let query = {};
  let pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (let i = 0; i < pairs.length; i++) {
    let pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}
