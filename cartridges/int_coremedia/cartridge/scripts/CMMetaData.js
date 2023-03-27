'use strict';

/* API Includes */
let Logger = dw.system.Logger.getLogger('coremedia.metadata');

let MetaData = function () {
  this.data = {};
};

MetaData.prototype = {
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
  },
  getTitle: function () {
    return this.data.title;
  },
  getKeywords: function () {
    return this.data.keywords ;
  },
  getDescription: function () {
    return this.data.description;
  }
};

module.exports = new MetaData();
