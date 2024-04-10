/* eslint-disable spellcheck/spell-checker */
'use strict';
var base = module.superModule;
const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
const cartHelpers = require('*/cartridge/scripts/cart/cartHelpers');
const currentSite = require('dw/system/Site').getCurrent();
/**
 * Generates an object of approaching discounts
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {Object} approachingDiscountsObject - approachingDiscounts Object
 * @returns {Object} an object of approaching discounts
 */
function updateApproachingDiscounts(basket, approachingDiscountsObject) {
    var approachingDiscounts = approachingDiscountsObject;
    if (basket && basket.productLineItems) {
        var PromotionMgr = require('dw/campaign/PromotionMgr');
        var Resource = require('dw/web/Resource');
        var collections = require('*/cartridge/scripts/util/collections');
        var discountPlan = PromotionMgr.getDiscounts(basket);
        var approachingOrderDiscounts = discountPlan.getApproachingOrderDiscounts();
        var approachingShippingDiscounts = discountPlan.getApproachingShippingDiscounts(basket.defaultShipment);

        var counter = 0;
        collections.forEach(approachingOrderDiscounts, function (approachingOrderDiscount) {
            approachingDiscounts[counter].approachingPromoPercentage = (approachingOrderDiscount.merchandiseTotal / approachingOrderDiscount.conditionThreshold) * 100;
            approachingDiscounts[counter].promotionID = approachingOrderDiscount.discount.promotion.ID;
            approachingDiscounts[counter].progressBarEnabled = approachingOrderDiscount.discount.promotion.custom.approachedPromotion;
            approachingDiscounts[counter].promotionCalloutMsg = approachingOrderDiscount.discount.promotion.calloutMsg
                                                                ? approachingOrderDiscount.discount.promotion.calloutMsg.markup
                                                                : '';
            counter += 1;
        });
        collections.forEach(approachingShippingDiscounts, function (approachingShippingDiscount) {
            approachingDiscounts[counter].approachingPromoPercentage = (approachingShippingDiscount.merchandiseTotal / approachingShippingDiscount.conditionThreshold) * 100;
            approachingDiscounts[counter].promotionID = approachingShippingDiscount.discount.promotion.ID;
            approachingDiscounts[counter].progressBarEnabled = approachingShippingDiscount.discount.promotion.custom.approachedPromotion;
            approachingDiscounts[counter].promotionCalloutMsg = approachingShippingDiscount.discount.promotion.calloutMsg
                                                                ? approachingShippingDiscount.discount.promotion.calloutMsg.markup
                                                                : '';
            counter += 1;
        });

        var discountObject;
        if (approachingOrderDiscounts.length === 0) {
            var orderDiscounts = discountPlan.getOrderDiscounts();
            collections.forEach(orderDiscounts, function (orderDiscount) {
                var orderPromotion = orderDiscount.getPromotion();
                if (orderPromotion.custom && orderPromotion.custom.approachedPromotion) {
                    discountObject = {
                        discountMsg: Resource.msgf(
                            'msg.approachingpromo.qualify',
                            'cart',
                            null,
                            orderPromotion.getCalloutMsg()
                        ),
                        approachingPromoPercentage: '100',
                        promotionID: orderPromotion.getID(),
                        progressBarEnabled: orderPromotion.custom.approachedPromotion
                    };
                    approachingDiscounts = approachingDiscounts.concat(discountObject);
                }
            });
        }

        if (approachingShippingDiscounts.length === 0) {
            var shippingDiscounts = discountPlan.getShippingDiscounts(basket.defaultShipment);
            collections.forEach(shippingDiscounts, function (shippingDiscount) {
                var shippingPromotion = shippingDiscount.getPromotion();
                if (shippingPromotion.custom && shippingPromotion.custom.approachedPromotion) {
                    discountObject = {
                        discountMsg: Resource.msgf(
                            'msg.approachingpromo.qualify',
                            'cart',
                            null,
                            shippingPromotion.getCalloutMsg()
                        ),
                        approachingPromoPercentage: '100',
                        promotionID: shippingPromotion.getID(),
                        progressBarEnabled: shippingPromotion.custom.approachedPromotion
                    };
                    approachingDiscounts = approachingDiscounts.concat(discountObject);
                }
            });
        }
    }
    return approachingDiscounts;
}

/**
 * Generates an object of approaching discounts
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {Object} an object of approaching discounts
 */
function updateFreeShippingBar(basket) {
    var freeShippingBar = {};
    if (basket && basket.productLineItems) {
        var Resource = require('dw/web/Resource');
        var Utils = require('dw/util/StringUtils');
        var Money = require('dw/value/Money');
        var shippingMethod;

        if (!empty(basket.defaultShipment)) {
            shippingMethod = basket.defaultShipment.shippingMethod;
        } else {
            shippingMethod = basket.shipments[0].shippingMethod;
        }

        if (shippingMethod && 'showFreeShippingBar' in shippingMethod.custom && shippingMethod.custom.showFreeShippingBar) {
            var isFreeShippingBarEnabled = shippingMethod.custom.showFreeShippingBar;
            var basketHasGiftCardItems = giftcardHelper.basketHasGiftCardItems(basket);
            var totalCartAmount = basket.getAdjustedMerchandizeTotalNetPrice().getValue();
            var freeShippingThreshold;

            if (basketHasGiftCardItems && basketHasGiftCardItems.eGiftCards) {
                totalCartAmount -= basketHasGiftCardItems.eGiftCardTotal;
            }

            if ('freeShippingThresholdValue' in shippingMethod.custom) {
                freeShippingThreshold = shippingMethod.custom.freeShippingThresholdValue;
            }

            if (totalCartAmount && freeShippingThreshold) {
                if (totalCartAmount >= freeShippingThreshold) {
                    freeShippingBar.isFreeShippingBarEnabled = isFreeShippingBarEnabled;
                    freeShippingBar.approachingFreeShippingPercentage = '100';
                    freeShippingBar.freeShippingCalloutMsg = Resource.msg('msg.free.shipping.qualify', 'cart', null);
                } else {
                    var amountReaminingForFreeShipping = Utils.formatMoney(new Money((freeShippingThreshold - totalCartAmount), basket.currencyCode));
                    freeShippingBar.isFreeShippingBarEnabled = isFreeShippingBarEnabled;
                    freeShippingBar.approachingFreeShippingPercentage = ((totalCartAmount / freeShippingThreshold) * 100).toFixed(2);
                    freeShippingBar.freeShippingCalloutMsg = Resource.msgf('msg.amount.remaining.free.shipping', 'cart', null, amountReaminingForFreeShipping);
                }
            }
        }
    }
    return freeShippingBar;
}

/**
 * @constructor
 * @classdesc CartModel class that represents the current basket
 *
 * @param {dw.order.Basket} basket - Current users's basket
 */
function CartModel(basket) {
    base.call(this, basket);
    this.vertexTaxCalculated = (basket && 'custom' in basket && 'vertex_Taxation_Details' in basket.custom && !empty(basket.custom.vertex_Taxation_Details)) || false;
    var Resource = require('dw/web/Resource');
    this.resources.salesTax = Resource.msg('label.sales.tax', 'cart', null);
    this.resources.estimatedTax = Resource.msg('label.estimated.sales.tax', 'cart', null);
    this.resources.estimatedTotal = Resource.msg('label.estimatedtotal', 'cart', null);
    this.resources.estimatedShipping = Resource.msg('label.estimatedShipping.cost', 'cart', null);
    this.resources.numberOfItems = parseInt(this.numItems, 10) === 1 ? Resource.msgf('label.number.item.in.cart', 'cart', null, this.numItems) : Resource.msgf('label.number.items.in.cart', 'cart', null, this.numItems);
    this.resources.total = Resource.msg('label.total', 'cart', null);
    this.resources.promoResourceMessage = Resource.msg('placholder.text.promo.code.input', 'cart', null);
    this.resources.multiplePromoResourceMessage = Resource.msg('placholder.text.promo.codes.input', 'cart', null);
    this.resources.productDiscount = Resource.msg('label.genericDiscount', 'common', null);
    var basketHasGiftCardItems = giftcardHelper.basketHasGiftCardItems(basket);
    this.hasEGiftCards = basketHasGiftCardItems.eGiftCards;
    this.hasGiftCards = basketHasGiftCardItems.giftCards;
    if (currentSite.getCustomPreferenceValue('enableVIPCheckoutExperience')) {
        const vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
        this.isVIPOrder = vipDataHelpers.isVIPOrder(basket);
    } else {
        this.isVIPOrder = false;
    }
    this.srEligible = !basketHasGiftCardItems.onlyEGiftCards && !this.isVIP;
    this.hasPreOrder = cartHelpers.hasPreOrderItems(basket);
    if (this.approachingDiscounts) {
        this.approachingDiscounts = updateApproachingDiscounts(basket, this.approachingDiscounts);
    } else {
        var approachingDiscounts = {};
        this.approachingDiscounts = updateApproachingDiscounts(basket, approachingDiscounts);
    }
    this.freeShippingBar = updateFreeShippingBar(basket);
    if (this.totals && !empty(this.totals.saveTotal)) {
        this.showSavingExperience = cartHelpers.savedExperience(this.totals.saveTotal.value);
    }
    cartHelpers.setBasketPurchaseSite(basket);
}

module.exports = CartModel;
