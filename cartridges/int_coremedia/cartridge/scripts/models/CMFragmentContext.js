'use strict';

const SEO_SEGMENT_PREFIX = "cm-seosegment:";

/**
 * Model representing a fragment context.
 *
 * @module models/CMFragmentContext
 */
var CMFragmentContext = (function (){

  function CMFragmentContext(storeId, pageId, locale, productId, categoryId,
                             placement, view, externalRef, parameter, exposeErrors, prefetch, ajax) {
    this.storeId = storeId;
    this.pageId = pageId;
    this.locale = locale;
    this.productId = productId;
    this.categoryId = categoryId;
    this.placement = placement;
    this.view = view;
    this.externalRef = externalRef;
    this.parameter = parameter;
    this.exposeErrors = exposeErrors;
    this.prefetch = prefetch;
    this.ajax = ajax;
  }

  // storeId
  CMFragmentContext.prototype.setStoreId = function(storeId){
    this.storeId = storeId;
  };
  CMFragmentContext.prototype.getStoreId = function(){
    return this.storeId;
  };

  // pageId
  CMFragmentContext.prototype.setPageId = function(pageId){
    this.pageId = pageId;
  };
  CMFragmentContext.prototype.getPageId = function(){
    return this.pageId;
  };

  // locale
  CMFragmentContext.prototype.setLocale = function(locale){
    this.locale = locale;
  };
  CMFragmentContext.prototype.getLocale = function(){
    return this.locale;
  };

  // productId
  CMFragmentContext.prototype.setProductId = function(productId){
    this.productId = productId;
  };
  CMFragmentContext.prototype.getProductId = function(){
    return this.productId;
  };

  // categoryId
  CMFragmentContext.prototype.setCategoryId = function(categoryId){
    this.categoryId = categoryId;
  };
  CMFragmentContext.prototype.getCategoryId = function(){
    return this.categoryId;
  };

  // placement
  CMFragmentContext.prototype.setPlacement = function(placement){
    this.placement = placement;
  };
  CMFragmentContext.prototype.getPlacement = function(){
    return this.placement;
  };

  // view
  CMFragmentContext.prototype.setView = function(view){
    this.view = view;
  };
  CMFragmentContext.prototype.getView = function(){
    return this.view;
  };

  // externalRef
  CMFragmentContext.prototype.setExternalRef = function(externalRef){
    this.externalRef = externalRef;
  };
  CMFragmentContext.prototype.getExternalRef = function(){
    return this.externalRef;
  };

  // parameter
  CMFragmentContext.prototype.setParameter = function(parameter){
    this.parameter = parameter;
  };
  CMFragmentContext.prototype.getParameter = function(){
    return this.parameter;
  };

  // exposeErrors
  CMFragmentContext.prototype.setExposeErrors = function(exposeErrors){
    this.exposeErrors = exposeErrors;
  };
  CMFragmentContext.prototype.getExposeErrors = function(){
    return this.exposeErrors;
  };

  // prefetch
  CMFragmentContext.prototype.setPrefetch = function(prefetch){
    this.prefetch = prefetch;
  };
  CMFragmentContext.prototype.getPrefetch = function(){
    return this.prefetch;
  };

  // prefetch
  CMFragmentContext.prototype.setAjax = function(ajax){
    this.ajax = ajax;
  };
  CMFragmentContext.prototype.getAjax = function(){
    return this.ajax;
  };

  // previewContext
  CMFragmentContext.prototype.setPreviewContext = function(previewContext){
    this.previewContext = previewContext;
  };
  CMFragmentContext.prototype.getPreviewContext = function(){
    return this.previewContext;
  };

  // previewParams
  CMFragmentContext.prototype.setPreviewParams = function(previewParams){
    this.previewParams = previewParams;
  };
  CMFragmentContext.prototype.getPreviewParams = function(){
    return this.previewParams;
  };

  // userContext
  CMFragmentContext.prototype.setUserContext = function(userContext){
    this.userContext = userContext;
  };
  CMFragmentContext.prototype.getUserContext = function(){
    return this.userContext;
  };

  // userParams
  CMFragmentContext.prototype.setUserParams = function(userParams){
    this.userParams = userParams;
  };
  CMFragmentContext.prototype.getUserParams = function(){
    return this.userParams;
  };

  /**
   * Returns the matrix parameters of this context.
   */
  CMFragmentContext.prototype.getMatrixParameters = function () {
    var matrixParams = {};

    matrixParams.pageId = this.getPageId();

    if (this.getView()) {
      matrixParams.view = this.getView();
    }

    if (this.getProductId()) {
      matrixParams.productId = encodeURI(this.getProductId());
    }

    if (this.getCategoryId()) {
      matrixParams.categoryId = encodeURI(this.getCategoryId());
    }

    if (this.getPlacement()) {
      matrixParams.placement = this.getPlacement();
    }

    if (this.getExternalRef()) {
      matrixParams.externalRef = (this.getExternalRef().indexOf('cm-') === 0 ? this.getExternalRef() :
              SEO_SEGMENT_PREFIX + this.getExternalRef());
    }

    if (this.getParameter()) {
      matrixParams.parameter = encodeURI(this.getParameter());
    }

    if (this.getExposeErrors() === true) {
      matrixParams.exposeErrors = this.getExposeErrors();
    }

    if (this.getExposeErrors() === true) {
      matrixParams.exposeErrors = this.getExposeErrors();
    }

    return matrixParams;
  };

  CMFragmentContext.prototype.getPageKey = function() {
    return "externalRef=" + (this.getExternalRef() ? (this.getExternalRef().indexOf('cm-') === 0 ? this.getExternalRef() :
            SEO_SEGMENT_PREFIX + this.getExternalRef()) : '') +
            ";categoryId=" + this.getCategoryId() +
            ";productId=" + this.getProductId() +
            ";pageId=" + (this.getExternalRef() || this.getCategoryId() || this.getProductId() ? '' : this.getPageId());
  };

  CMFragmentContext.prototype.getFragmentKey = function() {
    return this.getPageKey() +
            ";view=" + this.getView() +
            ";placement=" + this.getPlacement();
  };

  CMFragmentContext.prototype.clone = function() {
    let clone = new CMFragmentContext(this.getStoreId(), this.getPageId(), this.getLocale(), this.getProductId(),
            this.getCategoryId(), this.getPlacement(), this.getView(), this.getExternalRef(),
            this.getParameter(), this.getExposeErrors(), this.getPrefetch(), this.getAjax());
    clone.setPreviewParams(this.previewParams);
    clone.setPreviewContext(this.previewContext);
    clone.setUserContext(this.userContext);
    return clone;
  };

  CMFragmentContext.prototype.toString = function() {
    return "[object CMFragmentContext {" +
            "storeId:" + this.getStoreId() +
            ", pageId:" + this.getPageId() +
            ", locale:" + this.getLocale() +
            ", categoryId:" + this.getCategoryId() +
            ", productId:" + this.getProductId() +
            ", placement:" + this.getPlacement() +
            ", externalRef:" + this.getExternalRef() +
            ", view:" + this.getView() +
            ", previewContext:" + this.getPreviewContext() +
            ", previewParams:" + this.getPreviewParams() +
            ", userContext:" + this.getUserContext() +
            ", parameter:" + this.getParameter() +
            ", exposeErrors:" + this.getExposeErrors() +
            ", prefetch:" + this.getPrefetch() +
            ", ajax:" + this.getAjax() +
            "}]";
  };

  return CMFragmentContext;
})();

module.exports = CMFragmentContext;
