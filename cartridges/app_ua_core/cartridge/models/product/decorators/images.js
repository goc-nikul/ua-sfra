'use strict';

var ImageModel = require('~/cartridge/models/product/productImages');

module.exports = function (object, product, config, fitModelViewPreference) {
    Object.defineProperty(object, 'images', {
        enumerable: true,
        writable: true,
        value: new ImageModel(product, config, fitModelViewPreference)
    });
};
