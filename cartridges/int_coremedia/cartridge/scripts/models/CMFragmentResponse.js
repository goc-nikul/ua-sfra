'use strict';

/**
 * Model representing a fragment response.
 *
 * @module models/CMFragmentResponse
 */
var CMFragmentResponse = (function (){

  function CMFragmentResponse(result, context, url) {
    this.result = result;
    this.context = context;
    this.url = url;
    this.skipped = false;
  }

  CMFragmentResponse.prototype.getResult = function (){
    return this.result;
  };

  CMFragmentResponse.prototype.getContext = function (){
    return this.context;
  };

  CMFragmentResponse.prototype.getURL = function (){
    return this.url;
  };

  // prefetch
  CMFragmentResponse.prototype.setCacheMiss = function(cacheMiss){
    this.cacheMiss = cacheMiss;
  };
  CMFragmentResponse.prototype.isCacheMiss = function(){
    return this.cacheMiss;
  };

  // fragmentKey
  CMFragmentResponse.prototype.setFragmentKey = function(fragmentKey){
    this.fragmentKey = fragmentKey;
  };
  CMFragmentResponse.prototype.getFragmentKey = function(){
    return this.fragmentKey;
  };

  // skipped
  CMFragmentResponse.prototype.setSkipped = function(skipped){
    this.skipped = skipped;
  };
  CMFragmentResponse.prototype.isSkipped = function(){
    return this.skipped;
  };
  CMFragmentResponse.prototype.setExpires = function (expires) {
    this.expires = expires;
  };
  CMFragmentResponse.prototype.getExpires = function () {
    return this.expires;
  };

  return CMFragmentResponse;

})();

module.exports = CMFragmentResponse;
