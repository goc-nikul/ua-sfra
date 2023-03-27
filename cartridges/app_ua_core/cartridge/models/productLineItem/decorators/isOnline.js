'use strict';

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'isOnline', {
        enumerable: true,
        value: lineItem && lineItem.product ? lineItem.product.online : false
    });
};
