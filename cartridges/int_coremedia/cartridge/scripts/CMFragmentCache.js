'use strict';

/* API Includes */
let Logger = dw.system.Logger.getLogger('coremedia.cache');

let Cache = function () {
  this.data = {};
  this.timestamp = Math.random();
  this.error = false;
};

/**
 * Provides a cache for cms fragments in the request scope.
 * It encapsulates the usage of request attributes to access it.
 * The structure of the used map to store fragments is well known and follows the format.
 * There is now sorted or canonical order of key items. It must be request in exactly the
 * order it is store in the structure. Null values in keys are stored as '' chars.
 * {
 *   "pageKey" : "externalRef=;categoryId=;productId=;pageId=auroraesite",
 *   "url" : "http://...",
 *   "fragments" : [
 *      {
 *        "fragmentKey" : "externalRef=;categoryId=;productId=;pageId=auroraesite;view=;placement=hero",
 *        "payload" : "... html escaped payload ..."
 *      }
 *   ]
 * }
 */
Cache.prototype = {
  clear: function () {
    this.data = {};
  },
  update: function (object) {
    // if object is null, then don't try to update it
    if (object === null) {
      return;
    }
    // update data
    this.data = object;
//    Logger.debug("### TRACE CMFragmentCache(" + this.timestamp + ") update cache: " + JSON.stringify(this.data));
  },
  isPrefetchAlreadyDone: function () {
    // Logger.debug("### TRACE CMFragmentCache(" + this.timestamp + ") fragments are " + ((this.data.pageKey !== undefined) ? "already prefetched" : "not yet prefetched"));
    return this.data.pageKey !== undefined;
  },
  isErrorCase: function() {
    return this.error;
  },
  setErrorCase: function(errorResult) {
    this.error = true;
    this.errorResult = errorResult;
  },
  getErrorResult: function() {
    return this.errorResult;
  },
  getUrl: function () {
    return this.data.url;
  },
  lookup: function (fragmentKey) {
    let fragments = this.data.fragments;
    for (let i in fragments) {
      let fragment = fragments[i];
      if (fragment.fragmentKey === fragmentKey) {
        Logger.debug("CMFragmentCache(" + this.timestamp + ") lookup for \"" + fragmentKey + "\": FOUND");
        if (fragment.expires) {
          return { payload: fragment.payload, expires: fragment.expires };
        }
        return { payload: fragment.payload };
      }
    }
    Logger.info("CMFragmentCache(" + this.timestamp + ") lookup for \"" + fragmentKey + "\": MISSED");
    return null;
  }
};

module.exports = new Cache();
