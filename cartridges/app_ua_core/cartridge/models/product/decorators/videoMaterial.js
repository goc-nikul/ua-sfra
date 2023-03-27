'use strict';
var videoModel = require('~/cartridge/models/product/productVideoMaterial');

var getVideoMaterial = function (apiProduct, colorObject) { // eslint-disable-line
    return videoModel(apiProduct, colorObject);
};

module.exports = function (object, apiProduct, colorObject) {
    Object.defineProperty(object, 'video360Material', {
        enumerable: true,
        value: getVideoMaterial(apiProduct, colorObject) // eslint-disable-line
    });
};
