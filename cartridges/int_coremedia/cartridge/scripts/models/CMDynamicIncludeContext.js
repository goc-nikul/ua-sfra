'use strict';

/**
 * Model representing a fragment context.
 *
 * @module models/CMDynamicIncludeContext
 */
var CMDynamicIncludeContext = (function (){

  function CMDynamicIncludeContext(url, storeId, locale, exposeErrors) {
    this.url = url;
    this.storeId = storeId;
    this.locale = locale;
    this.exposeErrors = exposeErrors;
  }

  // url
  CMDynamicIncludeContext.prototype.setUrl = function(url){
    this.url = url;
  };
  CMDynamicIncludeContext.prototype.getUrl = function(){
    return this.url;
  };

  // storeId
  CMDynamicIncludeContext.prototype.setStoreId = function(storeId){
    this.storeId = storeId;
  };
  CMDynamicIncludeContext.prototype.getStoreId = function(){
    return this.storeId;
  };

  // locale
  CMDynamicIncludeContext.prototype.setLocale = function(locale){
    this.locale = locale;
  };
  CMDynamicIncludeContext.prototype.getLocale = function(){
    return this.locale;
  };

  // exposeErrors
  CMDynamicIncludeContext.prototype.setExposeErrors = function(exposeErrors){
    this.exposeErrors = exposeErrors;
  };
  CMDynamicIncludeContext.prototype.getExposeErrors = function(){
    return this.exposeErrors;
  };

  // previewContext
  CMDynamicIncludeContext.prototype.setPreviewContext = function(previewContext){
    this.previewContext = previewContext;
  };
  CMDynamicIncludeContext.prototype.getPreviewContext = function(){
    return this.previewContext;
  };

  // previewParams
  CMDynamicIncludeContext.prototype.setPreviewParams = function(previewParams){
    this.previewParams = previewParams;
  };
  CMDynamicIncludeContext.prototype.getPreviewParams = function(){
    return this.previewParams;
  };

  // userContext
  CMDynamicIncludeContext.prototype.setUserContext = function(userContext){
    this.userContext = userContext;
  };
  CMDynamicIncludeContext.prototype.getUserContext = function(){
    return this.userContext;
  };

  // userParams
  CMDynamicIncludeContext.prototype.setUserParams = function(userParams){
    this.userParams = userParams;
  };
  CMDynamicIncludeContext.prototype.getUserParams = function(){
    return this.userParams;
  };

  CMDynamicIncludeContext.prototype.toString = function() {
    return "[object CMDynamicIncludeContext {" +
            "url:" + this.getUrl() +
            ", storeId:" + this.getStoreId() +
            ", locale:" + this.getLocale() +
            ", previewContext:" + this.getPreviewContext() +
            ", previewParams:" + this.getPreviewParams() +
            ", userContext:" + this.getUserContext() +
            "}]";
  };

  return CMDynamicIncludeContext;
})();

module.exports = CMDynamicIncludeContext;
