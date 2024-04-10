'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;

var collections = require('*/cartridge/scripts/util/collections');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var productPersonlizationHelpers = require('*/cartridge/scripts/helpers/productPersonlizationHelpers');

/**
 * get the total price for the product line item
 * @param {Object} product - product JSON object
 * @param {dw.order.ProductLineItem} lineItem - API ProductLineItem instance
 * @returns {Object} an object containing the product line item total info.
 */
function getTotalPrice(product, lineItem) {
    if (!product || !lineItem) return {};
    var context;
    var price;
    var result = {};
    var template = 'checkout/productCard/productCardProductRenderedTotalPrice';
    var productPrice = product.price;
    var strikeThroughPrice;
    if (!empty(product.price) && productPrice.list != null) {
        strikeThroughPrice = productPrice.list;

        var Money = require('dw/value/Money');
        result.strikeThroughPrice = (typeof strikeThroughPrice.decimalPrice !== undefined && strikeThroughPrice.decimalPrice !== undefined && !empty(strikeThroughPrice.currency)) ? formatMoney(new Money((strikeThroughPrice.decimalPrice * lineItem.quantityValue), strikeThroughPrice.currency)) : '';
    }

    if (lineItem.priceAdjustments.getLength() > 0) {
        result.nonAdjustedPrice = result.strikeThroughPrice || formatMoney(lineItem.getPrice());
        result.strikeThroughPrice = result.strikeThroughPrice || formatMoney(lineItem.getPrice());
    }

    price = lineItem.adjustedPrice;

    var excludeOptionalPrice = price;

    // The platform does not include prices for selected option values in a line item product's
    // price by default.  So, we must add the option price to get the correct line item total price.
    collections.forEach(lineItem.optionProductLineItems, function (item) {
        price = price.add(item.adjustedPrice);
    });

    result.excludeOptionalPrice = formatMoney(excludeOptionalPrice);
    if (price.subtract(excludeOptionalPrice).value >= 0) result.optionalItemPrice = formatMoney(price.subtract(excludeOptionalPrice));
    var isPersonalizationEligible = productPersonlizationHelpers.isPersonalizationEligible(lineItem.product)
            && require('*/cartridge/config/peronslizePreferences').isPersonalizationEnable
            && (!!('jerseyNameText' in lineItem.custom && lineItem.custom.jerseyNameText)
            || !!('jerseyNumberText' in lineItem.custom && lineItem.custom.jerseyNumberText)
            || !!('sponsors' in lineItem.custom && lineItem.custom.sponsors === 'Yes'));
    result.price = formatMoney(price);
    context = { lineItem: { priceTotal: result, isPersonalizationEligible: isPersonalizationEligible } };
    result.renderedPrice = renderTemplateHelper.getRenderedHtml(context, template);

    return result;
}


module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'priceTotal', {
        enumerable: true,
        value: getTotalPrice(object, lineItem)
    });
};
