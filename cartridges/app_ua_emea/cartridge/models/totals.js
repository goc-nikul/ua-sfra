/* eslint-disable spellcheck/spell-checker */
'use strict';

var base = require('app_storefront_base/cartridge/models/totals');
// var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;

/**
 * Calculates the Klarna order total
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 * @returns {number} The Klarna order total
 */
function getKlarnaTotal(lineItemContainer) {
    var totalGrossPrice = lineItemContainer.getTotalGrossPrice();
    var KlarnaOSM = require('*/cartridge/scripts/marketing/klarnaOSM');

    return KlarnaOSM.formatPurchaseAmount(totalGrossPrice);
}

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @returns {string} the formatted money value
 */
function getTotals(total) {
    return !total.available ? '-' : formatMoney(total);
}

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
 * On Employee Orders, show total of line-item discounts
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing promotion
 */
function getEmployeeTotalDiscounts(lineItemContainer) {
    var Money = require('dw/value/Money');
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
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    base.call(this, lineItemContainer);
    var Site = require('dw/system/Site');
    var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
    var paazlDeliveryInfo = 'paazlDeliveryInfo' in lineItemContainer.defaultShipment.custom ? lineItemContainer.defaultShipment.custom.paazlDeliveryInfo : null;
    if (lineItemContainer) {
        this.discounts = getDiscounts(lineItemContainer);
        this.totalEmployeeDiscount = getEmployeeTotalDiscounts(lineItemContainer);
        this.subTotalWithoutAdjustments = getTotals(lineItemContainer.getMerchandizeTotalPrice());
        this.hideShippingTotal = isPaazlEnabled && !paazlDeliveryInfo;
        this.totalpromoDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice() ? getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice()) : '';
        if (COHelpers.isKlarnaPaymentEnabled()) {
            this.klarnaTotal = getKlarnaTotal(lineItemContainer);
        }
    }
}

module.exports = totals;
