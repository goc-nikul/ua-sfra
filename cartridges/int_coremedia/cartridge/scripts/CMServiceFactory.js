'use strict';

/**
 * Service factory used to create platform services to call the CoreMedia CMS via http.
 */

/* API Includes */
let Logger = dw.system.Logger.getLogger('coremedia.connector');
let LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
let Site = require('dw/system/Site');
let CMFragmentContext = require('*/cartridge/scripts/models/CMFragmentContext');
let CMServiceFactory = require('*/cartridge/scripts/CMServiceFactory');
let CMDynamicIncludeContext = require('*/cartridge/scripts/models/CMDynamicIncludeContext');
let CMUtil = require('*/cartridge/scripts/util/CMUtil');

const CM_DEV_SUGAR_COOKIE_NAME = "dev.cmFragmentHost";
const CM_FRAGMENT_HOST_HEADER_NAME = "X-FragmentHostDevelopment";
const CM_PREVIEW_ACCESS_TOKEN_HEADER_NAME = "CoreMedia-PreviewAccessToken"; // deprecated will be used only in future setups
const CM_ACCESS_TOKEN_HEADER_NAME = "CoreMedia-AccessToken"; //it is not "CoreMedia-LiveAccessToken", because we want to unify

exports.createFragmentService = function () {

  return LocalServiceRegistry.createService("coremedia.fragment.get", {

    createRequest: function (svc:HTTPService, args:Object) {

    let preview:String = args.preview;

    let cacheTTL = preview ? CMUtil.getPreviewFragmentCacheTTL() : CMUtil.getLiveFragmentCacheTTL();

    svc.setRequestMethod("GET");
    svc.client.enableCaching(cacheTTL);

    let context:CMFragmentContext = args.context;

    let url = CMServiceFactory.buildFragmentUrl(preview, svc.getURL(), context);

    url = CMServiceFactory.addContexts(context, preview, url, svc);

    addAccessToken(preview, url, svc);


    svc.setURL(url);
  },

  parseResponse: function (svc:HTTPService, client:HTTPClient) {
    var headers = client.getResponseHeaders();
    if (headers !== null) {
        return { payload: client.text, headers: headers };
    }
    return { payload: client.text };
  },

  getUrl: function (svc:HTTPService, client:HTTPClient) {
    return client.text;
  }

});
};

/**
 * Service call to get dynamic includes from the CAE.
 * The URL is completely taken from the given context.
 * It is only enriched with contextual information.
 * The result is not cached.
 */
exports.createUrlService = function () {

  return LocalServiceRegistry.createService("coremedia.url.get", {

    createRequest: function (svc:HTTPService, args:Object) {

    svc.setRequestMethod("GET");
    svc.client.enableCaching(0);

    // Personalization cookie addeded to request header
    if (args.personalizationCookie && args.personalizationCookie.value) {
      let personalizationCookie = args.personalizationCookie.name + '=' + args.personalizationCookie.value;
      svc.addHeader('Cookie', personalizationCookie);
    }

    let url:String = svc.getURL();
    if (!url) {
      throw new Error('Unable to initialize CoreMedia URL service, no service URL configured.');
    }

    if (url.indexOf('//') === -1) {
      throw new Error('Unable to initialize CoreMedia URL service, unknown service URL configured: ' + url);
    }

    let context:CMDynamicIncludeContext = args.context;
    let preview:String = args.preview;

    let cmsHost:String = retrieveCmsHost(preview);

    url = url.substring(0, url.indexOf('//')+2);
    url = url + (cmsHost);

    url += decodeHTMLEntities(context.getUrl());

    url = CMServiceFactory.addContexts(context, preview, url, svc);

    addAccessToken(preview, url, svc);


    svc.setURL(url);
  },

  parseResponse: function (svc:HTTPService, client:HTTPClient) {
    var headers = client.getResponseHeaders();
    if (headers !== null) {
        return { payload: client.text, headers: headers };
    }
    return { payload: client.text };
  }

});
};

exports.buildFragmentUrl = function (preview, serviceUrl, context) {

  let url = serviceUrl;
  if (!url) {
    throw new Error('Unable to initialize CoreMedia URL service, no service URL configured.');
  }

  if (url.indexOf('//') === -1) {
    throw new Error('Unable to initialize CoreMedia URL service, unknown service URL configured: ' + url);
  }

  let cmsHost:String = retrieveCmsHost(preview);

  url = url.replace("{cmsHost}", cmsHost);
  url = url.replace("{storeId}", context.getStoreId());
  url = url.replace("{locale}", context.getLocale());

  let matrixParameters = context.getMatrixParameters();
  if (matrixParameters) {
    let matrixParams = [];
    for (let key:String in matrixParameters) {
      if (matrixParameters.hasOwnProperty(key)) {
        matrixParams.push(key + "=" + matrixParameters[key]);
      }
    }
    let matrixParamsStr:String = "params;" + matrixParams.join(';');
    if (context.ajax) {
      matrixParamsStr = matrixParamsStr + ";ajax=true";
    }

    url = url.replace("{params}", matrixParamsStr);

  } else {
    url = url.replace("{params}", "");
  }

  return url;
};

function retrieveCmsHost(preview) {

  let site:Site = dw.system.Site.getCurrent();
  let sitePrefs:SitePreferences = site.getPreferences();
  let isDevelopmentEnabled = sitePrefs.getCustom()["cmDebug"] === true;

  // dev sugar should only be possible if its developer mode is on and it's preview
  if (isDevelopmentEnabled && preview === true) {
    //check if a dev sugar is applicable
    let cookies = request.getHttpCookies();
    for (let i = 0; i < cookies.cookieCount; i++) {
      let cookie = cookies[i];
      if (cookie.name === CM_DEV_SUGAR_COOKIE_NAME) {
        return cookie.value;
      }
    }
  }

  if (isDevelopmentEnabled) {
    let host = getRequestHeader(CM_FRAGMENT_HOST_HEADER_NAME);
    if (host) {
      return host;
    }
  }

  if (preview) {
    return sitePrefs.getCustom()["cmPreviewHost"];
  }
  return sitePrefs.getCustom()["cmLiveHost"];
}

/**
 * Add all available contexts to the request.
 * It depends on which contexts have been provided in the CMContextProvider. There are 3 different
 * types of "contexts":
 * 1. PreviewContext... will only be used in preview, added as headers with prefix "wc.preview."
 * 2. PreviewParams... will only be used in preview, added as request parameters
 * 3. UserContext... used always if available, added as headers with prefix "wc.user."
 *
 * @param context the context that contain all available contexts
 * @param preview flag
 * @param url the starting URL
 * @param svc the service that can be used to add headers
 * @returns the URL potentially being extended by further query parameters
 */
exports.addContexts = function(context, preview, url, svc:HTTPService) {

  let resultUrl = url;

  if (context) {
    // In preview add support for time travel and personalization testing
    if (preview === true) {

      if (svc) {
        let previewContext = context.getPreviewContext();
        if (previewContext) {
          for (let key:String in previewContext) {
            if (previewContext.hasOwnProperty(key)) {
              svc.addHeader("wc.preview." + key, previewContext[key]);
              Logger.debug("CMHttpService: added preview header " + "wc.preview." + key + "=" +  previewContext[key] + " to cae request: " + url);
            }
          }
        }
      }

      let previewParams = context.getPreviewParams();
      if (previewParams) {
        let queryParams = [];
        for (let key:String in previewParams) {
          if (previewParams.hasOwnProperty(key)) {
            queryParams.push(key + "=" + previewParams[key]);
            Logger.debug("CMHttpService: added preview param " + key + "=" +  previewParams[key] + " to cae request: " + url);
          }
        }
        let queryString = queryParams.join('&');
        if (queryString && queryString.length > 0) {
          resultUrl = resultUrl + (resultUrl.indexOf("?") < 0 ? "?" : "&") + queryString;
        }
      }
    }

    if (svc) {
      let userContext = context.getUserContext();
      if (userContext) {
        for (let key:String in userContext) {
          if (userContext.hasOwnProperty(key)) {
            svc.addHeader("wc.user." + key, userContext[key]);
            Logger.debug("CMHttpService: added perso header " + "wc.user." + key + "=" +  userContext[key] + " to cae request: " + url);
          }
        }
      }
    }

    let userParams = context.getUserParams();
    if (userParams) {
      let queryParams = [];
      for (let key:String in userParams) {
        if (userParams.hasOwnProperty(key)) {
          queryParams.push(key + "=" + userParams[key]);
          Logger.debug("CMHttpService: added user param " + key + "=" +  userParams[key] + " to cae request: " + url);
        }
      }
      let queryString = queryParams.join('&');
      if (queryString && queryString.length > 0) {
        resultUrl = resultUrl + (resultUrl.indexOf("?") < 0 ? "?" : "&") + queryString;
      }
    }
  }

  return resultUrl;
};

function addAccessToken(preview, url, svc: HTTPService) {
  // In preview add support for time travel and personalization testing
  if (preview === true) {
    let previewAccessToken = CMUtil.getCmPreviewAccessToken();
    if (previewAccessToken) {
      svc.addHeader(CM_PREVIEW_ACCESS_TOKEN_HEADER_NAME, previewAccessToken);
      Logger.debug("CMHttpService: added preview header " + CM_PREVIEW_ACCESS_TOKEN_HEADER_NAME + " = " + previewAccessToken + " to cae request: " + url);
    }
  } else {
    let liveAccessToken = CMUtil.getCmLiveAccessToken();
    if (liveAccessToken) {
      svc.addHeader(CM_ACCESS_TOKEN_HEADER_NAME, liveAccessToken);
      Logger.debug("CMHttpService: added live header " + CM_ACCESS_TOKEN_HEADER_NAME + " = " + liveAccessToken + " to cae request: " + url);
    }
  }
}

function getRequestHeader(headerName) {
  let value = request.getHttpHeaders().get(headerName);
  if (!value) {
    value = request.getHttpHeaders().get(headerName.toLowerCase());
  }
  return value;
}

function decodeHTMLEntities(text) {
  let entities = [
    ['amp', '&'],
    ['apos', '\''],
    ['#x27', '\''],
    ['#x2F', '/'],
    ['#39', '\''],
    ['#47', '/'],
    ['lt', '<'],
    ['gt', '>'],
    ['nbsp', ' '],
    ['quot', '"']
  ];

  for (let i = 0, max = entities.length; i < max; ++i)
    text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);

  return text;
}
