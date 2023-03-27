'use strict';

var Money = require('dw/value/Money');
var Site = require('dw/system/Site');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var collections = require('*/cartridge/scripts/util/collections');


/**
 * get the total price for the product line item
 * @param {dw.order.ProductLineItem} lineItem - API ProductLineItem instance
 * @returns {Object} an object containing the product line item total info.
 */
function bfPriceTotal(lineItem) {
    var adjustedUnitPrice = '';
    var result = {};
    var price;
    price = lineItem.adjustedPrice;


    // The platform does not include prices for selected option values in a line item product's
    // price by default.  So, we must add the option price to get the correct line item total price.
    collections.forEach(lineItem.optionProductLineItems, function (item) {
        price = price.add(item.adjustedPrice);
    });
    if (lineItem.priceAdjustments.getLength() > 0) {
        adjustedUnitPrice = price / lineItem.quantity;
        result.adjustedUnitPrice = formatMoney(new Money(adjustedUnitPrice, Site.getCurrent().getDefaultCurrency()));
    } else {
        result.adjustedUnitPrice = '';
    }
    return result;
}

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'bfPriceTotal', {
        enumerable: true,
        value: bfPriceTotal(lineItem)
    });
};
