/* eslint-disable spellcheck/spell-checker */
'use strict';

var base = require('app_storefront_base/cartridge/models/totals');
// var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');

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
 * calculate  total discount price adjustments for coupon Code and formats the value
 * @param {dw.util.Collection} priceAdjustments - priceAdjustments
 * @param {string} currencyCode - CurrencyCode
 * @returns {Object} the money value
 */
function getCouponDisount(priceAdjustments, currencyCode) {
    var Money = require('dw/value/Money');
    var couponDiscount = new Money(0, currencyCode);
    collections.forEach(priceAdjustments, function (priceAdjustment) {
        if (priceAdjustment.basedOnCoupon) {
            couponDiscount = couponDiscount.add(priceAdjustment.price);
        }
    });
    return {
        value: couponDiscount.value,
        formatted: formatMoney(couponDiscount)
    };
}

/**
 * creates an array of discounts.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer) {
    var Money = require('dw/value/Money');
    var discounts = {};
    var discountValue = new Money(0, lineItemContainer.currencyCode);

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
            promoErrorMsg: (couponLineItem.promotion && couponLineItem.promotion.custom && !empty(couponLineItem.promotion.custom.promoErrorMsg)) ? couponLineItem.promotion.custom.promoErrorMsg.markup : '',
            valid: couponLineItem.valid,
            relationship: priceAdjustments,
            promoDiscount: couponLineItem.priceAdjustments.length > 0 ? getCouponDisount(couponLineItem.priceAdjustments, lineItemContainer.currencyCode) : discountValue,
            promotionClass: couponLineItem.priceAdjustments.length > 0 && couponLineItem.priceAdjustments[0] && couponLineItem.priceAdjustments[0].promotion ? couponLineItem.priceAdjustments[0].promotion.getPromotionClass() : ''
        };
    });

    discounts = createDiscountObject(lineItemContainer.priceAdjustments, discounts);
    discounts = createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts);

    return Object.keys(discounts).map(function (key) {
        return discounts[key];
    });
}

/**
 * create the discount results html
 * @param {Array} discounts - an array of objects that contains coupon and priceAdjustment
 * information
 * @returns {string} The rendered HTML
 */
function getDiscountsHtml(discounts) {
    var context = new HashMap();
    var object = { totals: { discounts: discounts } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('cart/cartCouponDisplay');
    return template.render(context).text;
}

/**
 * On Employee Orders, show total of line-item discounts
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing promotion
 */
function getEmployeeTotalDiscounts(lineItemContainer) {
    var totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
    var totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);

    return {
        value: orderDiscount,
        formatted: formatMoney(orderDiscount)
    };
}

/**
 * calculate total list price of all PLI in the basket.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing total list price
 */
function getTotalListPrice(lineItemContainer) {
    var Money = require('dw/value/Money');
    const priceFactory = require('*/cartridge/scripts/factories/price');
    var total = new Money(0, lineItemContainer.currencyCode);
    var pliPrice = new Money(0, lineItemContainer.currencyCode);
    collections.forEach(lineItemContainer.getAllProductLineItems(), function (pli) {
        if (pli.product && pli.product.priceModel) {
            var listPrice = priceFactory.getListPrice(pli.product.priceModel);
            if (listPrice && listPrice.currencyCode === pliPrice.currencyCode) {
                pliPrice = listPrice.multiply(pli.quantity);
                total = total.add(pliPrice);
            }
        }
    });

    return {
        value: total.value,
        formatted: formatMoney(total)
    };
}

/**
 * calculate the total diff of sale and list as well as automatic applied product level promotion
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing product promotional discount
 */
function getProductTotalDiscount(lineItemContainer) {
    var Money = require('dw/value/Money');
    var siteCurrency = require('dw/util/Currency');
    const priceFactory = require('*/cartridge/scripts/factories/price');
    var currencyCode = lineItemContainer.currencyCode;
    var productTotalDiscount = new Money(0, currencyCode);
    collections.forEach(lineItemContainer.getAllProductLineItems(), function (pli) {
        if (pli.product && pli.product.custom && (!('giftCard' in pli.product.custom) || (pli.product.custom.giftCard.value !== 'EGIFT_CARD'))) {
            var diffPrice = new Money(0, currencyCode);
            if (pli.product && pli.product.priceModel && !pli.bonusProductLineItem) {
                session.setCurrency(siteCurrency.getCurrency(currencyCode));
                var listPrice = priceFactory.getListPrice(pli.product.priceModel);
                session.setCurrency(siteCurrency.getCurrency(session.getCurrency().getCurrencyCode()));
                if (listPrice) {
                    diffPrice = pli.price.subtract(listPrice.multiply(pli.quantity));
                }
            }
            var promotionDiscount = new Money(0, currencyCode);
            if (pli.priceAdjustments.length > 0) {
                collections.forEach(pli.priceAdjustments, function (priceAdjustment) {
                    if (!priceAdjustment.basedOnCoupon) {
                        promotionDiscount = promotionDiscount.add(priceAdjustment.price);
                    }
                });
            }
            promotionDiscount = promotionDiscount.add(diffPrice);
            productTotalDiscount = productTotalDiscount.add(promotionDiscount);
        }
    });
    return {
        value: productTotalDiscount.value,
        formatted: formatMoney(productTotalDiscount)
    };
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
function getTotalSavedAmount(lineItemContainer, orderDiscount, shippnigDiscount, couponsDiscount, prodDiscount) {
    var Money = require('dw/value/Money');
    var currencyCode = lineItemContainer.currencyCode;
    var saveTotal = new Money(0, currencyCode);
    var orderDiscountValue = makePositiveValue(orderDiscount.value);
    var shippnigDiscountValue = makePositiveValue(shippnigDiscount.value);
    var prodDiscountValue = makePositiveValue(prodDiscount.value);
    saveTotal = saveTotal.add(new Money(orderDiscountValue, currencyCode)).add(new Money(shippnigDiscountValue, currencyCode)).add(new Money(prodDiscountValue, currencyCode));
    for (let p = 0; p < couponsDiscount.length; p++) {
        var discount = couponsDiscount[p];
        if (discount.type === 'coupon' && discount.promotionClass === 'PRODUCT' && discount.valid && discount.applied) {
            var promoDiscountValue = makePositiveValue(discount.promoDiscount.value);
            saveTotal = saveTotal.add(new Money(promoDiscountValue, currencyCode));
        }
    }
    return {
        value: saveTotal.value,
        formatted: formatMoney(saveTotal)
    };
}

/**
 * creates a JSON of discounts distribution.
 * @param {Object} discounts - an object of price adjustments
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object that contains the value and formatted value of the Order discount
 */
function getDiscountDistribution(discounts, lineItemContainer) {
    var Money = require('dw/value/Money');
    var isEmployeeDiscount;
    var employeeDiscountTotal = new Money(0, lineItemContainer.currencyCode);
    var totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
    var totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);
    if (!empty(discounts)) {
        for (let i = 0; i < discounts.length; i++) {
            var discount = discounts[i];
            if (discount.isEmployeeDiscount) {
                isEmployeeDiscount = discount.isEmployeeDiscount;
                employeeDiscountTotal = employeeDiscountTotal.add(discount.discountValue);
            }
        }
    }
    return {
        isEmployeeDiscount: isEmployeeDiscount,
        employeeDiscountTotalValue: employeeDiscountTotal.value,
        employeeDiscountTotal: formatMoney(employeeDiscountTotal),
        orderLevelDiscountValue: orderDiscount.add(employeeDiscountTotal).value,
        orderLevelDiscountFormatted: formatMoney(orderDiscount.add(employeeDiscountTotal))
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
        this.discountsHtml = getDiscountsHtml(this.discounts);
        this.discountDistribution = getDiscountDistribution(this.discounts, lineItemContainer);
        this.totalEmployeeDiscount = getEmployeeTotalDiscounts(lineItemContainer);
        this.subTotalWithoutAdjustments = getTotals(lineItemContainer.getMerchandizeTotalPrice());
        this.hideShippingTotal = isPaazlEnabled && !paazlDeliveryInfo;
        this.totalpromoDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice() ? getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice()) : '';
        if (COHelpers.isKlarnaPaymentEnabled()) {
            this.klarnaTotal = getKlarnaTotal(lineItemContainer);
        }
        this.totalListPrice = getTotalListPrice(lineItemContainer);
        this.promotionalDiscount = getProductTotalDiscount(lineItemContainer);
        this.saveTotal = getTotalSavedAmount(lineItemContainer, this.orderLevelDiscountTotal, this.shippingLevelDiscountTotal, this.discounts, this.promotionalDiscount);
    }
}

module.exports = totals;
