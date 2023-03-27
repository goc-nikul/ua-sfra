'use strict';

var URLUtils = require('dw/web/URLUtils');

module.exports = function (object) {
    Object.defineProperty(object, 'someNewAttribute', {
        enumerable: true,
        value: 'This is a brand new attribute'
    });

    Object.defineProperty(object, 'someNewURL', {
        enumerable: true,
        value: URLUtils.staticURL('/images/logo.svg')
    });
};
