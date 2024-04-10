/* eslint-disable no-nested-ternary */
'use strict';

var base = module.superModule;
var Money = require('dw/value/Money');
var collections = require('*/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var PriceHelper = require('app_ua_core/cartridge/scripts/util/PriceHelper');

/**
 * Adds discounts to a discounts object
 * @param {dw.util.Collection} collection - a collection of price adjustments
 * @param {Object} discounts - an object of price adjustments
 * @returns {Object} an object of price adjustments
 */
function createDiscountObject(collection, discounts) {
    var result = discounts;
    collections.forEach(collection, function (item) {
        if (!item.basedOnCoupon) {
            var sourceCode = '';
            if (item.promotion !== 'undefined' && item.promotion !== null && item.promotion.basedOnSourceCodes) {
                var sourceCodeGroups = item.promotion.sourceCodeGroups;
                collections.forEach(sourceCodeGroups, function (srcItem) {
                    sourceCode = srcItem.ID;
                });
            }
            result[item.UUID] = {
                UUID: item.UUID,
                lineItemText: item.lineItemText,
                price: formatMoney(item.price),
                type: 'promotion',
                callOutMsg: (typeof item.promotion !== 'undefined' && item.promotion !== null) ? item.promotion.calloutMsg : '',
                sourceCode: sourceCode
            };
        }
    });

    return result;
}

/**
 * make positive discount value
 * @param {number} discountedValue - discounted value
 * @returns {number} return positive discounted value
 */
function makePositiveValue(discountedValue) {
    var discountedNumber = discountedValue;
    if (discountedNumber < 0) {
        discountedNumber *= -1.0;
    }
    return discountedNumber;
}

/**
 * creates an array of discounts.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer) {
    var discounts = {};

    collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
        var priceAdjustments = collections.map(
            couponLineItem.priceAdjustments, function (priceAdjustment) {
                return { callOutMsg: (typeof priceAdjustment.promotion !== 'undefined' && priceAdjustment.promotion !== null) ? priceAdjustment.promotion.calloutMsg : '' };
            });
        discounts[couponLineItem.UUID] = {
            type: 'coupon',
            UUID: couponLineItem.UUID,
            couponCode: couponLineItem.couponCode,
            applied: couponLineItem.applied,
            valid: couponLineItem.valid,
            relationship: priceAdjustments
        };
    });

    discounts = createDiscountObject(lineItemContainer.priceAdjustments, discounts);
    discounts = createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts);

    return Object.keys(discounts).map(function (key) {
        return discounts[key];
    });
}

/**
 * calculate save total which incude order discount, shipping discount, product promotional discount
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @param {Object} orderDiscount - Order Discount
 * @param {Object} shippnigDiscount - Shippnig Total Discount
 * @param {Object} couponsDiscount - Coupons Discount
 * @param {Object} prodDiscount - product promotional discount except coupon dicount
 * @returns {Object} return total saved amount
 */
function getTotalSavedAmount(lineItemContainer, orderDiscount, shippnigDiscount) {
    var currencyCode = lineItemContainer.currencyCode;
    var saveTotal = new Money(0, currencyCode);
    var orderDiscountValue = makePositiveValue(orderDiscount.value);
    var shippnigDiscountValue = makePositiveValue(shippnigDiscount.value);
    saveTotal = saveTotal.add(new Money(orderDiscountValue, currencyCode)).add(new Money(shippnigDiscountValue, currencyCode));
    return {
        value: saveTotal.value,
        formatted: formatMoney(saveTotal)
    };
}

/**
 * On Employee Orders, show total of line-item discounts
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing promotion
 */
function getEmployeeTotalDiscounts(lineItemContainer) {
    var total = new Money(0, lineItemContainer.currencyCode);
    collections.forEach(lineItemContainer.getAllProductLineItems(), function (pli) {
        total = total.add(pli.getPrice().subtract(pli.getProratedPrice()));
    });
    return {
        value: total.value,
        formatted: formatMoney(total)
    };
}

/**
 * calculate save total which incude order discount, shipping discount, product promotional discount
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @param {Object} orderDiscount - Order Discount
 * @param {Object} couponsDiscount - Coupons Discount
 * @param {Object} prodDiscount - product promotional discount except coupon dicount
 * @returns {Object} return total saved amount
 */
function getTotalDiscount(lineItemContainer, orderDiscount) {
    var currencyCode = lineItemContainer.currencyCode;
    var saveTotal = new Money(0, currencyCode);
    var orderDiscountValue = makePositiveValue(orderDiscount.value);
    saveTotal = saveTotal.add(new Money(orderDiscountValue, currencyCode));
    return {
        value: saveTotal.value,
        formatted: formatMoney(saveTotal)
    };
}

/**
 * In cart summary product promotion is not included in discount line and is applied to the subTotal.
 * calculate and update subTotalWithoutAdjustment to include the product level promotion as well.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @param {Object} subTotalWithoutAdjustments - subTotalWithoutAdjustments, for order summary
 * @returns {Object} return subTotalWithoutAdjustments in amount format
 */
function updateSubTotal(lineItemContainer) {
    var currencyCode = lineItemContainer.currencyCode;
    var productDiscount = PriceHelper.getProductTotalDiscount(lineItemContainer);
    var productDiscountValue = makePositiveValue(productDiscount.value);
    var udatedsubTotalWithoutAdjustments = lineItemContainer.getMerchandizeTotalPrice();
    if (productDiscountValue > 0) {
        udatedsubTotalWithoutAdjustments = new Money(udatedsubTotalWithoutAdjustments.value, currencyCode).subtract(new Money(productDiscountValue, currencyCode));
    }

    return formatMoney(udatedsubTotalWithoutAdjustments);
}

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);
    var isAfterPayEnabled = require('*/cartridge/scripts/utils/PreferencesUtil').isCountryEnabled('afterPayEnabled');
    if (require('dw/system/Site').getCurrent().getCustomPreferenceValue('atomeEnabled')) {
        var atomeHelper = require('*/cartridge/scripts/atome/helpers/atomeHelpers');
        var installmentGrossPrice = lineItemContainer.totalGrossPrice.value / 3;
        var currencySymbol = session.currency.symbol;
        this.installmentGrandTotal = currencySymbol + atomeHelper.toFixed(installmentGrossPrice, 2);
    }
    if (isAfterPayEnabled) {
        var afterPayHelper = require('*/cartridge/scripts/helpers/afterPayHelper');
        var totalGrossPrice = lineItemContainer.getTotalGrossPrice();
        this.afterPayCartPrice = afterPayHelper.getAfterPayInstallmentPrice(totalGrossPrice);
    }
    if (lineItemContainer) {
        this.discounts = getDiscounts(lineItemContainer);
        this.saveTotal = getTotalSavedAmount(lineItemContainer, this.orderLevelDiscountTotal, this.shippingLevelDiscountTotal);
        this.totalDiscount = getTotalDiscount(lineItemContainer, this.orderLevelDiscountTotal);
        this.totalEmployeeDiscount = getEmployeeTotalDiscounts(lineItemContainer);
        this.subTotalWithoutAdjustments = updateSubTotal(lineItemContainer);
    }
}

module.exports = totals;
