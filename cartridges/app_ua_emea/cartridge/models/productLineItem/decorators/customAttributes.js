'use strict';
/** This file is to create the custom attributes on the ProductLineItem model object. In future we can use this file to create custom attributes. */

// eslint-disable-next-line no-unused-vars
module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'atsValue', {
        enumerable: true,
        value: 'atsValue' in lineItem.custom && lineItem.custom.atsValue
    });
};

