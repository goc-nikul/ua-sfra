'use strict';

/**
 * Controller that renders CoreMedia fragments and pages.
 */

/* API Includes */
let ISML = require('dw/template/ISML');
let Site = require('dw/system/Site');
var cmCacheControl = require('*/cartridge/scripts/cmCacheControl');
let CMFragmentService = require('*/cartridge/scripts/CMFragmentService');
let CMVtlProcessor = require('*/cartridge/scripts/CMVtlProcessor');
let CMIncludeProcessor = require('*/cartridge/scripts/CMIncludeProcessor');
let Logger = dw.system.Logger.getLogger('coremedia.connector');
let CMUtil = require('*/cartridge/scripts/util/CMUtil');
let URLUtils = require('dw/web/URLUtils');

/* Constants */

// Content page template
const CONTENT_PAGE_TEMPLATE = "coremedia/content/contentpage.isml";

// Error template
const FRAGMENT_ERROR_TEMPLATE = "coremedia/error/fragment-error.isml";

const INCOMPLETE_SEO_SEGMENT = 'incomplete-seo-segment';

/**
 * Set an expiry date on response if caching is enabled.
 * @param {Object} fragmentResponse - the fragment response
 * @param {boolean} isError - true if an error occurred
 * @param {Object} request - the request object
 * @param {Object} response - the response object
 */
 function setPageCacheExpiry(fragmentResponse, isError, request, response) {
  var fragmentUrl = fragmentResponse.getURL() + '#' + fragmentResponse.getFragmentKey();
  if (!cmCacheControl.shouldBeCached(fragmentUrl, request)) {
      Logger.debug('CM: fragment should not be cached: ' + fragmentUrl);
      return;
  }
  if (isError) {
      var pageCacheOnErrorTTL = CMUtil.getPageCacheOnErrorTTL();
      if (pageCacheOnErrorTTL > -1) {
          cmCacheControl.setPageCacheExpiryOnError(fragmentUrl, pageCacheOnErrorTTL, request, response);
      }
  } else {
      var pageCacheTTLDefaultTTL = CMUtil.getPageCacheDefaultTTL();
      if (pageCacheTTLDefaultTTL > -1) {
          var expiryDateStr = fragmentResponse.expires ? fragmentResponse.expires : null;
          var result = fragmentResponse.getResult();
          var headers = (result && result.object && result.object.headers) ? result.object.headers : null;
          cmCacheControl.setPageCacheExpiryOnSuccess(fragmentUrl, expiryDateStr, pageCacheTTLDefaultTTL, headers, request, response);
      }
  }
}

/**
 * Renders an HTML-fragment retrieved from the CoreMedia CMS.
 */
function includeFragment(pdict, request, response, exposeError) {
  let site = Site.getCurrent();
  let sitePrefs = site.getPreferences();
  let isDebug = sitePrefs.getCustom()["cmDebug"] === true;
  let exposeErrors = sitePrefs.getCustom()["cmExposeErrors"] === true && exposeError;

  let context = CMFragmentService.buildFragmentContext(request, pdict);

  let fragmentResponse = CMFragmentService.fetchFragment(context);
  if (!fragmentResponse) {
    return null;
  }

  let result = fragmentResponse.getResult();
  let outputWriter = new dw.io.StringWriter();

  if (isDebug) {
    outputWriter.write(debugStartComment(fragmentResponse));
  }

  if (result.error || !result.ok) {
    if (exposeErrors) {
      renderErrorTemplate(fragmentResponse.getURL(), result);
    } else if (isDebug) {
      // Render error comment
      outputWriter.write("<!-- ERROR: " + result.error + " " + result.msg + " -->");
    }
    setPageCacheExpiry(fragmentResponse, true, request, response);

  } else {
    if (result.object && result.object.payload) {
      // write parsed fragment
      let parsedPayload = CMVtlProcessor.processPlaceholders(result.object.payload);
      parsedPayload = CMIncludeProcessor.processPlaceholders(parsedPayload);
      outputWriter.write(parsedPayload);
    }
    setPageCacheExpiry(fragmentResponse, false, request, response);
  }

  if (isDebug) {
    outputWriter.write(debugEndComment(fragmentResponse));
  }

  let status = result.error ? result.error.toString() : "200";
  return  {'payload':outputWriter.toString(),'status':status};
}

function includeRemoteFragment(pdict) {
  let result = includeFragment(pdict, request, response);
  response.setContentType('text/html');
  response.getWriter().print(result.payload);
}

/**
 * Controller that renders a content (e.g. an article detail page) retrieved from the CoreMedia CMS.
 */
function showContent() {


  let site = Site.getCurrent();
  let sitePrefs = site.getPreferences();
  let isDebug = sitePrefs.getCustom()["cmDebug"] === true;

  let context = CMFragmentService.buildFragmentContext(request);
  context.setPrefetch(true);

  //empty or incomplete seo segment
  if (!context.getExternalRef() || context.getExternalRef() === INCOMPLETE_SEO_SEGMENT) {
    response.setStatus(404);
    // Render error template
    renderErrorTemplate('', {'error':'404','msg':'Not found'});
    return;
  }

  //replace forward slashes to CoreMedia internal delimiter '--'
  let externalRef = context.getExternalRef().replace(/%2F/g, '--');
  context.setExternalRef(externalRef);

  let fragmentResponse = CMFragmentService.fetchFragment(context);
  if (!fragmentResponse) {
    return;
  }

  let result = fragmentResponse.getResult();

  if (result.error || !result.ok) {
    response.setStatus(404);
    // Render error template
    renderErrorTemplate(fragmentResponse.getURL(), result);
    setPageCacheExpiry(fragmentResponse, true, request, response);

  } else {
    if (result.object && result.object.payload) {
      let parsedPayload = CMVtlProcessor.processPlaceholders(result.object.payload);
      parsedPayload = CMIncludeProcessor.processPlaceholders(parsedPayload);
      if (isDebug) {
        parsedPayload = debugStartComment(fragmentResponse) + parsedPayload + debugEndComment(fragmentResponse);
      }
      let templateData = {CMContent: result, CMContext: context, html: parsedPayload, url: fragmentResponse.getURL()};
      ISML.renderTemplate(CONTENT_PAGE_TEMPLATE, templateData);
    }
    setPageCacheExpiry(fragmentResponse, false, request, response);
  }
}

/**
 * Renders an dynamic Include retrieved from the CoreMedia CMS.
 */
function showDynamic() {

  let site = Site.getCurrent();
  let sitePrefs = site.getPreferences();
  let isDebug = sitePrefs.getCustom()["cmDebug"] === true;
  let exposeErrors = sitePrefs.getCustom()["cmExposeErrors"] === true;

  let context = CMFragmentService.buildDynamicIncludeContext(request);
  let fragmentResponse = CMFragmentService.fetchUrl(context);
  let result = fragmentResponse.getResult();

  response.setContentType('text/html');

  if (isDebug) {
    response.getWriter().println(debugStartComment(fragmentResponse));
  }

  if (result.error || !result.ok) {
    if (exposeErrors) {
      // Render error template
      renderErrorTemplate(fragmentResponse.getURL(), result);

    } else if (isDebug) {
      // Render error comment
      response.getWriter().println("<!-- ERROR: " + result.error + " " + result.msg + " -->");
    }
  } else {
    if (result.object && result.object.payload) {
      // write parsed fragment
      let parsedPayload = CMVtlProcessor.processPlaceholders(result.object.payload);
      parsedPayload = CMIncludeProcessor.processPlaceholders(parsedPayload);
      response.getWriter().print(parsedPayload);
      response.getWriter().print("<html><script>$('body').trigger('product:hasElevatedContent')</script></html>"); // Tealium Content
    }
  }

  if (isDebug) {
    response.getWriter().println(debugEndComment(fragmentResponse));
  }
}

/**
 * Includes an ISML Template from the coremedia/cms folder.
 */
function includeTemplate() {
  let params = request.httpParameterMap;
  ISML.renderTemplate("coremedia/cms/" + params.template);
}

/**
 * A method to show to a demandware URL. The format is pretty simple to split it easily into URLUtils.abs()
 * parameters (all parameters are separated by "," char).
 */
function showUrl() {
  let url = computeUrl();
  response.writer.print(url);
}

/**
 * A method to redirect to a demandware URL. The format is pretty simple to split it easily into URLUtils.abs()
 * parameters (all parameters are separated by "," char).
 */
function redirectUrl() {
  let url = computeUrl();
  response.setHttpHeader("Location", url);
  response.setStatus(302);
}

// --- private
function computeUrl() {
  let parameterMap = request.httpParameterMap;
  let parameters = parameterMap.link.stringValue;
  let tokens = parameters.split(",");
  let parameterNames = parameterMap.getParameterNames();
  for (let i = 0; i < parameterNames.length; i++) {
    let name = parameterNames[i];
    if (name && name !== 'link') {
      let value = parameterMap.get(name).stringValue;
      if (value) {
        tokens.push(name);
        tokens.push(value);
      }
    }
  }
  let url = URLUtils.url.apply(URLUtils, tokens).toString();
  url = CMUtil.sanitizeContentUrl(url);
  return url;
}

/**
 * Renders an error template for the given fragment URL and error response.
 *
 * @param fragmentUrl URL of the requested fragment
 * @param errorResponse response object that holds the error code and message
 */
function renderErrorTemplate(fragmentUrl, errorResponse) {
  let templateParams = {url: fragmentUrl, error: errorResponse.error, message: errorResponse.msg};
  ISML.renderTemplate(FRAGMENT_ERROR_TEMPLATE, templateParams);
}

/**
 * Set a expiration date on response.
 *
 * @param fragmentUrl URL of the requested fragment
 * @param expireInSeconds cache expiry time in seconds
 */
function setPageCacheExpiryDate(fragmentUrl, expireInSeconds) {
  if (expireInSeconds > -1) {
    Logger.debug("CM: set cache expiry time for requested cms fragment '" + fragmentUrl + "' to " + expireInSeconds + " seconds.");
    var currentTime = new Date(Date.now());
    var untilTime = currentTime.setSeconds(currentTime.getSeconds() + expireInSeconds);
    response.setExpires(untilTime);
  }
}

function debugStartComment(fragmentResponse) {
  if (fragmentResponse.isSkipped()) {
    return "<!-- SKIP COREMEDIA FRAGMENT (url=" + fragmentResponse.getURL() + ") -->\n";
  }
  else if (fragmentResponse.getFragmentKey()) {
    return "<!-- START COREMEDIA FRAGMENT (url=" + fragmentResponse.getURL() +
            ", cacheHit=" + !fragmentResponse.isCacheMiss() +
            ", fragmentKey=" + fragmentResponse.getFragmentKey() + ") -->\n";
  }
  return "<!-- START COREMEDIA FRAGMENT (url=" + fragmentResponse.getURL() + 
          ", fragmentKey=" + fragmentResponse.getFragmentKey() + ") -->\n";
}

function debugEndComment(fragmentResponse) {
  return !fragmentResponse.isSkipped() ? "\n<!-- END COREMEDIA FRAGMENT -->" : "";
}

// --- exports
exports.Template = includeTemplate;
exports.Template.public = true;
exports.Fragment = includeFragment;
exports.Fragment.public = true;
exports.RemoteFragment = includeRemoteFragment;
exports.RemoteFragment.public = true;
exports.Content = showContent;
exports.Content.public = true;
exports.Dynamic = showDynamic;
exports.Dynamic.public = true;
exports.RedirectUrl = redirectUrl;
exports.RedirectUrl.public = true;
exports.Url = showUrl;
exports.Url.public = true;
