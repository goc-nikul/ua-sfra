'use strict';
var videoModel = require('../productVideoMaterial');

var getVideoMaterial = function (apiProduct, colorObject, images) { // eslint-disable-line
    return videoModel(apiProduct, colorObject, images);
};

module.exports = function (object, apiProduct, colorObject) {
    Object.defineProperty(object, 'video360Material', {
        enumerable: true,
        value: getVideoMaterial(apiProduct, colorObject, object.images) // eslint-disable-line
    });
};
