'use strict';

/**
 * Service used to retrieve fragments from the CoreMedia CMS.
 */

const INCOMPLETE_SEO_SEGMENT = 'incomplete-seo-segment';

/* API Includes */
let Logger = dw.system.Logger.getLogger('coremedia.connector');
let Site = require('dw/system/Site');
let URLRedirectMgr = require('dw/web/URLRedirectMgr');
let CMFragmentResponse = require('*/cartridge/scripts/models/CMFragmentResponse');
let CMFragmentContext = require('*/cartridge/scripts/models/CMFragmentContext');
let CMDynamicIncludeContext = require('*/cartridge/scripts/models/CMDynamicIncludeContext');
let CMUtil = require('*/cartridge/scripts/util/CMUtil');
let CMContextProvider = require('*/cartridge/scripts/context/CMContextProvider');
let CMFragmentCache = require('*/cartridge/scripts/CMFragmentCache');
let CMServiceFactory = require('*/cartridge/scripts/CMServiceFactory');
let URLUtils = require('dw/web/URLUtils');

/**
 * Builds a fragment context object from the provided request.
 *
 * @param request current request
 * @param pdict optional pdict
 */
exports.buildFragmentContext = function (request, pdict) {

  let site = Site.getCurrent();
  let exposeErrors = CMUtil.isExposeErrorsEnabled();

  let locale = request.locale;
  if (locale) {
    locale = locale.replace("_", "-");
  }

  let storeId = site.ID;

  let productId = pdict && pdict.productid ? pdict.productid : (request.httpParameterMap.productid.stringValue ? request.httpParameterMap.productid.stringValue : '');
  let categoryId = pdict && pdict.categoryid ? pdict.categoryid : (request.httpParameterMap.categoryid.stringValue ? request.httpParameterMap.categoryid.stringValue : '');
  let pageId = pdict && pdict.pageid ? pdict.pageid : (request.httpParameterMap.pageid.stringValue ? request.httpParameterMap.pageid.stringValue : '');
  let placement = pdict && pdict.placement ? pdict.placement : (request.httpParameterMap.placement.stringValue ? request.httpParameterMap.placement.stringValue : '');
  let view = pdict && pdict.view ? pdict.view : (request.httpParameterMap.view.stringValue ? request.httpParameterMap.view.stringValue : '');
  let externalRef = pdict && pdict.externalref ? pdict.externalref : (request.httpParameterMap.externalref.stringValue ? request.httpParameterMap.externalref.stringValue: '');
  let prefetch = !!(pdict && pdict.prefetch && pdict.prefetch === 'true');
  let ajax = !!(pdict && pdict.ajax && pdict.ajax === 'true');
  let parameter = pdict && pdict.parameter ? pdict.parameter : (request.httpParameterMap.parameter.stringValue ? request.httpParameterMap.parameter.stringValue : '');

  if (!externalRef && !productId && !categoryId && !pageId) {
    //in non-SEO context, a contentId parameter should be there
    externalRef = request.httpParameterMap.contentId.stringValue ? request.httpParameterMap.contentId.stringValue: '';
    if (!externalRef) {
    //in the SEO context, the pageId is not a request parameter, but part of the URL, so we have to parse it manually
      externalRef = getPageIdFromSeoUrl();
    }
  }

  Logger.debug("### TRACE CMFragmentService: buildFragmentContext, pageId: " + pageId + ", placement: " + placement + ", view: " + view + ", productId: " + productId + ", categoryId: " + categoryId + ", externalRef: " + externalRef);

  let context = new CMFragmentContext(storeId, pageId, locale, productId, categoryId, placement, view, externalRef, parameter, exposeErrors, prefetch, ajax);

  let isPreview = request.session.custom['cmPreview'];
  if (isPreview) {
    context.setPreviewContext(CMContextProvider.getPreviewContext(request));
    context.setPreviewParams(CMContextProvider.getPreviewParams(request));
  }
  context.setUserContext(CMContextProvider.getUserContext(request));
  context.setUserParams(CMContextProvider.getUserParams(request));

  return context;
};

/**
 * Builds a dynamic include context object from the provided request.
 *
 * @param request current request
 */
exports.buildDynamicIncludeContext = function (request) {

  let site = Site.getCurrent();
  let exposeErrors = CMUtil.isExposeErrorsEnabled();

  let locale = request.locale;
  if (locale) {
    locale = locale.replace("_", "-");
  }

  let storeId = site.ID;
  let url = request.httpParameterMap.url.stringValue;

  // Logger.debug("### TRACE CMFragmentService: buildDynamicIncludeContext, url: " + url + ", storeId: " + storeId + ", locale: " + locale);

  let context = new CMDynamicIncludeContext(url, storeId, locale, exposeErrors);

  let isPreview = request.session.custom['cmPreview'];
  if (isPreview) {
    context.setPreviewContext(CMContextProvider.getPreviewContext(request));
    context.setPreviewParams(CMContextProvider.getPreviewParams(request));
  }
  context.setUserContext(CMContextProvider.getUserContext(request));
  context.setUserParams(CMContextProvider.getUserParams(request));

  return context;
};

function getPageIdFromSeoUrl() {
  //we have to intercepted a redirect to retrieve the URL, see RedirectURL.js controller
  let location = URLRedirectMgr.getRedirect().getLocation();
  //TODO: remove special handling for global slots: 404 handling
  if (location && location.indexOf("404") < 0) {
    location = location.replace("%3F", "%26");
    let segment;
    if (location.indexOf('pageid=') > -1) {
      segment = location.substring(location.indexOf('pageid=') + 'pageid'.length + 1, location.length);
    }
    if (segment && segment.indexOf('%26') !== -1) {
      segment = segment.substring(0, segment.indexOf('%26'));
      //replace forward slashes to CoreMedia internal delimiter '--'
      segment = segment.replace(/%2F/g, '--');
    }
    if (segment && segment.lastIndexOf('//', 0) === 0) {
      segment = INCOMPLETE_SEO_SEGMENT;
    }
    return segment ? segment : '';
  }
  return '';
}

function prefetchAllFragments(context) {
  // is it a preview request?
  let isPreview = request.session.custom['cmPreview'];
  let service = CMServiceFactory.createFragmentService();
  let result = service.call({context: context, preview: isPreview});
  return new CMFragmentResponse(result, context, service.getURL());
}

function fetchSingleFragment(context) {

  Logger.debug("CMFragmentService: fetching single fragment for context " + context);

  // is it a preview request?
  let isPreview = request.session.custom['cmPreview'];
  let service = CMServiceFactory.createFragmentService();
  let result = service.call({context: context, preview: isPreview});
  return new CMFragmentResponse(result, context, service.getURL());
}

function getPersonalizationCookie() {
  let cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
  let cookieName = Site.current.getCustomPreferenceValue('cmPersonalizationCookie');
  let cookieValue = cookieHelper.read(cookieName);
  let personalizationCookie = {
    name: cookieName,
    value: ''
  };
  if (cookieValue) {
    personalizationCookie.value = cookieValue;
  }
  return personalizationCookie;
}

exports.fetchUrl = function (context) {

  Logger.debug("CMFragmentService: fetching URL for context " + context);

  // is it a preview request?
  let isPreview = request.session.custom['cmPreview'];
  let personalizationCookie = getPersonalizationCookie();
  let service = CMServiceFactory.createUrlService();
  let result = service.call({context: context, preview: isPreview, personalizationCookie: personalizationCookie});
  return new CMFragmentResponse(result, context, service.getURL());
};

exports.fetchFragment = function (context) {

  if (!CMUtil.isLiveContextEnabled()) {
    Logger.info("LiveContext is disabled");
    return null;
  }

  let pageKey = context.getPageKey();
  let fragmentKey = context.getFragmentKey();

  if (context.getAjax()) {
    Logger.debug("CMFragmentService: writing ajax stub, fragmentKey=" + fragmentKey);
    let fragmentResponse = generateAjaxStub(fragmentKey, context);
    if (fragmentResponse !== null) {
      return fragmentResponse;
    }
  }

  if (CMFragmentCache.isErrorCase()) {
    // there was an error in a prefetch before, no further request should be tried in this request scope...
    // simulate an empty fragment and write an appropriate log and debug
    Logger.error("Skipping fragment call because of an previous error.");
    let fragmentResponse = new CMFragmentResponse({
      'object': '',
      'error': 0,
      'msg': '',
      'ok': true
    }, context, CMFragmentCache.getUrl() + "#" + fragmentKey);
    fragmentResponse.setSkipped(true);
    return fragmentResponse;
  }

  // 1. Lookup fragmentKey in cache
  Logger.debug("CMFragmentService: looking for fragment in cache, fragmentKey=" + fragmentKey);
  let fragmentResponse = lookupFragmentInCache(fragmentKey, context);
  if (fragmentResponse !== null && context.getPrefetch()) {
    return fragmentResponse;
  }

  // 2. Lookup page in content asset library and load it into cache (if it was found)
  // 3. Do prefetch if it's enabled and not already done and load it into cache
  if (CMUtil.isPrefetchEnabled() && context.getPrefetch() && !CMFragmentCache.isPrefetchAlreadyDone()) {
    Logger.debug("CMFragmentService: prefetch page, pageKey=" + pageKey);
    let errorResponse = prefetchPageAndLoadIntoCache(pageKey, context);
    if (errorResponse !== null) {
      return errorResponse;
    }
    // 3a. Lookup fragmentKey in cache
    Logger.debug("CMFragmentService: looking for fragment in cache, fragmentKey=" + fragmentKey);
    let fragmentResponse = lookupFragmentInCache(fragmentKey, context);
    if (fragmentResponse !== null) {
      return fragmentResponse;
    }
  }

  // 4. If it's still not found, fetch the fragment in the traditional way
  Logger.debug("CMFragmentService: fetch single fragment legacywise, fragmentKey=" + fragmentKey);
  fragmentResponse = fetchSingleFragment(context);
  fragmentResponse.setFragmentKey(fragmentKey);
  fragmentResponse.setCacheMiss(true);
  return fragmentResponse;
};

function generateAjaxStub(fragmentKey, context) {

  if (!context.ajax) {
    return null;
  }

  Logger.debug("CMFragmentService: writing ajax fragment for context " + context);

  let isPreview = request.session.custom['cmPreview'];
  let service = CMServiceFactory.createUrlService();
  let fragmentUrl = CMServiceFactory.buildFragmentUrl(isPreview, service.getURL(), context);
  let relativeFragmentUrl = fragmentUrl.substring(fragmentUrl.split('/', 3).join('/').length);
  relativeFragmentUrl = CMServiceFactory.addContexts(context, isPreview, relativeFragmentUrl, null);
  let cmDynamicUrl = URLUtils.url('CM-Dynamic', 'url', relativeFragmentUrl);
  let fragmentResponse = new CMFragmentResponse({
    'object': { payload : '<div class="cm-fragment" data-cm-fragment=\"'+cmDynamicUrl+'\"></div>' },
    'error': 0,
    'msg': '',
    'ok': true
  }, context, fragmentUrl);
  fragmentResponse.setFragmentKey(fragmentKey);
  return fragmentResponse;
}

function lookupFragmentInCache(fragmentKey, context) {
  let fragmentPayload = CMFragmentCache.lookup(fragmentKey);
  if (fragmentPayload !== null) {
    // the fragment was found in cache...
    Logger.debug("CMFragmentService: Fragment was found in cache, fragmentKey=" + fragmentKey);
    let fragmentResponse = new CMFragmentResponse({
      'object': { payload: fragmentPayload.payload },
      'error': 0,
      'msg': '',
      'ok': true
    }, context, CMFragmentCache.getUrl());
    fragmentResponse.setFragmentKey(fragmentKey);
    fragmentResponse.setExpires(fragmentPayload.expires);
    return fragmentResponse;
  }
  return null;
}

function prefetchPageAndLoadIntoCache(pageKey, context) {
  let contextClone = context.clone();
  contextClone.setView("prefetchFragments");
  contextClone.setPlacement("");
  let prefetchResponse = prefetchAllFragments(contextClone);
  let prefetchUrl = prefetchResponse.getURL();
  let result = prefetchResponse.getResult();
  if (result.ok) {
    try {
      let parsedJson = JSON.parse(result.object.payload);
      if (parsedJson) {
        parsedJson['url'] = prefetchUrl;
        CMFragmentCache.update(parsedJson);
      }
    }
    catch (error) {
      Logger.error("Fragment prefetch result cannot be parsed, url: " + prefetchResponse.getURL() + "#" + pageKey + ", error: " + error);
      // prefetch should't be tried again in this request scope...
      // mark the fragment cache as "faulty"
      CMFragmentCache.update({'pageKey':pageKey,'url':prefetchUrl});
      CMFragmentCache.setErrorCase(result);
      return new CMFragmentResponse(result, context, prefetchUrl);
    }

  } else {
    Logger.error("Fragment prefetch call failed, url: " + prefetchResponse.getURL() + "#" + pageKey + ", error: " + result.error + ", msg: " + result.msg);
    // prefetch should't be tried again in this request scope...
    // mark the fragment cache as "faulty"
    CMFragmentCache.update({'pageKey':pageKey,'url':prefetchUrl});
    CMFragmentCache.setErrorCase(result);
    return new CMFragmentResponse(result, context, prefetchUrl);
  }
  return null;
}
