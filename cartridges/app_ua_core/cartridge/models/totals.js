/* eslint-disable spellcheck/spell-checker */
'use strict';

var base = module.superModule;
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');
var collections = require('*/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value/Money');
var Site = require('dw/system/Site');
const priceFactory = require('*/cartridge/scripts/factories/price');

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
 * calculate  total discount price adjustments for coupon Code and formats the value
 * @param {dw.util.Collection} priceAdjustments - priceAdjustments
 * @param {string} currencyCode - CurrencyCode
 * @returns {Object} the money value
 */
function getCouponDisount(priceAdjustments, currencyCode) {
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
 * Adds discounts to a discounts object
 * @param {dw.util.Collection} collection - a collection of price adjustments
 * @param {Object} discounts - an object of price adjustments
 * @param {string} currencyCode - CurrencyCode
 * @returns {Object} an object of price adjustments
 */
function createDiscountObject(collection, discounts, currencyCode) {
    var result = discounts;
    var discountValue = new Money(0, currencyCode);
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
                sourceCode: sourceCode,
                discountValue: !empty(item.price) ? item.price : discountValue,
                isEmployeeDiscount: (typeof item.promotion !== 'undefined' && item.promotion !== null) ? item.promotion.custom.isEmployeeDiscount : '',
                isLoyaltyDiscount: ''
            };
        }
    });

    return result;
}
/**
 * calculate order level applied promotional price exlcuding order level promo code
 * @param {Object} discounts - an object of price adjustments
 * @param {string} currencyCode - CurrencyCode
 * @param {number} totalPromoClassLevelDiscount - totalPromoClassLevelDiscount
 * @param {string} promotionClass - Promotion Class
 * @returns {Object} an object of actual order level promotional price
 */
function getPromotionDiscount(discounts, currencyCode, totalPromoClassLevelDiscount, promotionClass) {
    var couponDiscount = new Money(0, currencyCode);
    for (let j = 0; j < discounts.length; j++) {
        var discount = discounts[j];
        if (discount.type === 'coupon' && discount.promotionClass === promotionClass && discount.valid && discount.applied && !(discount.isEmployeeDiscount || discount.isLoyaltyDiscount)) {
            couponDiscount = couponDiscount.add(new Money(discount.promoDiscount.value, currencyCode));
        }
    }
    var totalDiscount = totalPromoClassLevelDiscount + couponDiscount.value;
    return {
        value: totalDiscount,
        formatted: formatMoney(new Money(totalDiscount, currencyCode))
    };
}

/**
 * creates an array of discounts.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer) {
    var discounts = {};
    var discountValue = new Money(0, lineItemContainer.currencyCode);

    collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
        var priceAdjust = new HashMap(); // To hold unique call-out messages.
        collections.forEach(couponLineItem.priceAdjustments, function (priceAdjustment) {
            var message = (typeof priceAdjustment.promotion !== 'undefined' && priceAdjustment.promotion !== null) ? priceAdjustment.promotion.calloutMsg : '';
            if (message) {
                priceAdjust.put(priceAdjustment.promotion.ID, message);
            }
        });
        var priceAdjustments = [];
        if (!empty(priceAdjust)) {
            for (var promo in priceAdjust) { // eslint-disable-line
                if (priceAdjust[promo] && priceAdjust[promo].source) {
                    priceAdjustments.push(priceAdjust[promo].source);
                }
            }
        }
        discounts[couponLineItem.UUID] = {
            type: 'coupon',
            UUID: couponLineItem.UUID,
            couponCode: couponLineItem.couponCode,
            applied: couponLineItem.applied,
            valid: couponLineItem.valid,
            callOutMsg: (couponLineItem.priceAdjustments.length > 0 && couponLineItem.priceAdjustments[0].promotion && !empty(couponLineItem.priceAdjustments[0].promotion.calloutMsg)) ? couponLineItem.priceAdjustments[0].promotion.calloutMsg.markup : '',
            isEmployeeDiscount: (couponLineItem.priceAdjustments.length > 0 && couponLineItem.priceAdjustments[0].promotion) ? couponLineItem.priceAdjustments[0].promotion.custom.isEmployeeDiscount : '',
            isLoyaltyDiscount: ('couponCode' in couponLineItem && couponLineItem.couponCode.indexOf('LYLD') !== -1 && couponLineItem.priceAdjustments.length > 0 && couponLineItem.priceAdjustments[0].promotion.promotionClass === 'ORDER') ? 1 : '',
            discountValue: couponLineItem.priceAdjustments.length > 0 ? couponLineItem.priceAdjustments[0].price : discountValue,
            promoDiscount: couponLineItem.priceAdjustments.length > 0 ? getCouponDisount(couponLineItem.priceAdjustments, lineItemContainer.currencyCode) : discountValue,
            promotionClass: couponLineItem.priceAdjustments.length > 0 && couponLineItem.priceAdjustments[0] && couponLineItem.priceAdjustments[0].promotion ? couponLineItem.priceAdjustments[0].promotion.getPromotionClass() : ''
        };
    });

    discounts = createDiscountObject(lineItemContainer.priceAdjustments, discounts, lineItemContainer.currencyCode);
    discounts = createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts, lineItemContainer.currencyCode);

    return Object.keys(discounts).map(function (key) {
        return discounts[key];
    });
}

/**
 * Accepts a lineItemContainer object and fetch the Estimated Loyalty Points
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {string} the formatted money value
 */
function getEstimatedLoyaltyPoints(lineItemContainer) {
    return 'estimatedLoyaltyPoints' in lineItemContainer.custom && lineItemContainer.custom.estimatedLoyaltyPoints > 0 ?
            lineItemContainer.custom.estimatedLoyaltyPoints.toFixed(0) : 0;
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
 * creates an object of discounts and IDME content.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing promotion
 */
function getIDMEPromos(lineItemContainer) {
    var idmePromoContent = {};
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
    var idmeButtonApiContent = ContentMgr.getContent('IDMEcoButtons');
    var idmeNonVerifiedContent = ContentMgr.getContent('IDMEnonVerified');
    var idmeVerifiedContent = ContentMgr.getContent('IDMEverified');

    var buttonContent = new ContentModel(idmeButtonApiContent, 'components/content/contentAssetInc');
    var nonVerifiedContent = new ContentModel(idmeNonVerifiedContent, 'components/content/contentAssetInc');
    var verifiedContent = new ContentModel(idmeVerifiedContent, 'components/content/contentAssetInc');

    var promos = [];
    promos = lineItemContainer.getPriceAdjustments().toArray().filter(function (promo) {
        return promo.promotion && typeof promo.promotion.custom.isIdmeDiscount !== undefined && promo.promotion.custom.isIdmeDiscount;
    }).map(function (promo) {
        return { id: promo.promotionID, text: promo.lineItemText };
    });
    idmePromoContent.promos = promos;
    idmePromoContent.buttonContent = buttonContent;
    idmePromoContent.nonVerifiedContent = nonVerifiedContent;
    idmePromoContent.verifiedContent = verifiedContent;
    return idmePromoContent;
}

/**
 * create the discount results html
 * @param {Object} idmePromoContent - an object that contains promotions and IDME content
 * @returns {string} The rendered HTML
 */
function getIdmePromosHtml(idmePromoContent) {
    var context = new HashMap();
    var object = { totals: { idmePromoContent: idmePromoContent } };
    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });
    var template = new Template('/customPromosList');
    return template.render(context).text;
}
/**
 * calculate the total diff of sale and list as well as automatic applied product level promotion
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object containing product promotional discount
 */
function getProductTotalDiscount(lineItemContainer) {
    var currencyCode = lineItemContainer.currencyCode;
    var productTotalDiscount = new Money(0, currencyCode);
    collections.forEach(lineItemContainer.getAllProductLineItems(), function (pli) {
        var diffPrice = new Money(0, currencyCode);
        if (pli.product && pli.product.priceModel) {
            var listPrice = priceFactory.getListPrice(pli.product.priceModel);
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
 * Calculate coupon saved total
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} return total coupon saved amount
 */
function getCouponsSavedAmount(lineItemContainer) {
    var currencyCode = lineItemContainer.currencyCode;
    var couponsSavedAmount = new Money(0, currencyCode);
    var eligibleCoupons = 0;
    collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
        let couponLineItemDiscount = new Money(0, currencyCode);
        collections.forEach(couponLineItem.priceAdjustments, function (priceAdjustment) {
            let isLoyaltyFreeProduct = couponLineItem.couponCode.indexOf('LYLD') !== -1 && priceAdjustment.promotion.promotionClass === 'PRODUCT';
            let isEmployeeDiscount = priceAdjustment.promotion.custom && priceAdjustment.promotion.custom.isEmployeeDiscount;
            let isLoyaltyDiscount = couponLineItem.couponCode.indexOf('LYLD') !== -1 && priceAdjustment.promotion.promotionClass === 'ORDER';
            if (priceAdjustment.basedOnCoupon && !isLoyaltyFreeProduct && !isEmployeeDiscount && !isLoyaltyDiscount) {
                couponLineItemDiscount = couponLineItemDiscount.add(priceAdjustment.price);
            }
        });
        if (makePositiveValue(couponLineItemDiscount.value) > 0) {
            couponsSavedAmount = couponsSavedAmount.add(couponLineItemDiscount);
            eligibleCoupons++;
        }
    });
    return {
        value: couponsSavedAmount.value,
        formatted: formatMoney(couponsSavedAmount),
        multipleCouponsApplied: eligibleCoupons > 1
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
        total = total.add(pli.getPrice().subtract(pli.getAdjustedNetPrice()));
    });

    return {
        value: total.value,
        formatted: formatMoney(total)
    };
}

/**
 * Accepts a total object without formating the value
 * @param {dw.value.Money} total - Total price of the cart
 * @returns {number} the money value
 */
function getShippingTotalsNonFormated(total) {
    return !total.available ? 0 : total.value;
}

/**
 * creates a JSON of discounts distribution.
 * @param {Object} discounts - an object of price adjustments
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Object} an object that contains the value and formatted value of the Order discount
 */
function getDiscountDistribution(discounts, lineItemContainer) {
    var isEmployeeDiscount;
    var isLoyaltyDiscount;
    var employeeDiscountTotal = new Money(0, lineItemContainer.currencyCode);
    var loyaltyDiscountTotal = new Money(0, lineItemContainer.currencyCode);
    var totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
    var totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);
    var siteId = Site.getCurrent().getID();
    if (siteId === 'US' || siteId === 'CA') {
        var orderPromotionDiscount = getPromotionDiscount(discounts, lineItemContainer.currencyCode, orderDiscount, 'ORDER');
        orderDiscount = new Money(orderPromotionDiscount.value, lineItemContainer.currencyCode);
    }
    if (!empty(discounts)) {
        for (let i = 0; i < discounts.length; i++) {
            var discount = discounts[i];
            if (discount.isEmployeeDiscount) {
                isEmployeeDiscount = discount.isEmployeeDiscount;
                employeeDiscountTotal = employeeDiscountTotal.add(discount.discountValue);
            } else if (discount.isLoyaltyDiscount) {
                isLoyaltyDiscount = discount.isLoyaltyDiscount;
                loyaltyDiscountTotal = loyaltyDiscountTotal.add(discount.discountValue);
            }
        }
    }

    return {
        isEmployeeDiscount: isEmployeeDiscount,
        isLoyaltyDiscount: isLoyaltyDiscount,
        employeeDiscountTotalValue: employeeDiscountTotal.value,
        loyaltyDiscountTotalValue: loyaltyDiscountTotal.value,
        employeeDiscountTotal: formatMoney(employeeDiscountTotal),
        loyaltyDiscountTotal: formatMoney(loyaltyDiscountTotal),
        orderLevelDiscountValue: orderDiscount.add(loyaltyDiscountTotal.add(employeeDiscountTotal)).value,
        orderLevelDiscountFormatted: formatMoney(orderDiscount.add(loyaltyDiscountTotal.add(employeeDiscountTotal)))
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
    if (lineItemContainer) {
        this.totalShippingCostNonFormated = getShippingTotalsNonFormated(lineItemContainer.shippingTotalPrice);
        this.discounts = getDiscounts(lineItemContainer);
        this.discountsHtml = getDiscountsHtml(this.discounts);
        this.discountDistribution = getDiscountDistribution(this.discounts, lineItemContainer);
        this.idmePromoContent = getIDMEPromos(lineItemContainer);
        this.idmePromosHtml = getIdmePromosHtml(this.idmePromoContent);
        this.totalEmployeeDiscount = getEmployeeTotalDiscounts(lineItemContainer);
        this.subTotalWithoutAdjustments = getTotals(lineItemContainer.getMerchandizeTotalPrice());
        this.estimatedLoyaltyPoints = getEstimatedLoyaltyPoints(lineItemContainer);
        this.totalpromoDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice() ? getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice()) : '';
        this.promotionalDiscount = getProductTotalDiscount(lineItemContainer);
        if (COHelpers.isKlarnaPaymentEnabled()) {
            this.klarnaTotal = getKlarnaTotal(lineItemContainer);
        }
        this.saveTotal = getTotalSavedAmount(lineItemContainer, this.orderLevelDiscountTotal, this.shippingLevelDiscountTotal, this.discounts, this.promotionalDiscount);
        var siteId = Site.getCurrent().getID();
        if (siteId === 'US' || siteId === 'CA') {
            this.couponsSavedAmount = getCouponsSavedAmount(lineItemContainer);
            this.orderLevelDiscountTotal = getPromotionDiscount(this.discounts, lineItemContainer.currencyCode, this.orderLevelDiscountTotal.value, 'ORDER');
            this.shippingLevelDiscountTotal = getPromotionDiscount(this.discounts, lineItemContainer.currencyCode, this.shippingLevelDiscountTotal.value, 'SHIPPING');
        }
    }
}

module.exports = totals;
