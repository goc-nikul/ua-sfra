'use strict';

var getPriceItem = function (lineItem) {
    var lineItemPrice = lineItem.getPrice();
    return {
        currencyCode: lineItemPrice.currencyCode,
        value: lineItemPrice.value / lineItem.quantity
    };
};


module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'priceItem', {
        enumerable: true,
        value: getPriceItem(lineItem)
    });
};
