/**
 * basket_coupon_hook_scripts.js
 *
 * Handles OCAPI hooks for basket calls
 */

var Status = require('dw/system/Status');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');
var paymentHelper = require('~/cartridge/scripts/paymentHelper');
let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var Transaction = require('dw/system/Transaction');


/**
 * Gets the estimated Loyalty points for Loyalte users.
 * @param {Basket} basket - Current basket
 * @returns {void}
 */
function estimateLoyaltyPionts(basket) {
    if (PreferencesUtil.getValue('isLoyaltyEnable') && customer.isMemberOfCustomerGroup('Loyalty')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        loyaltyHelper.estimate(basket);
    }
}

/**
 * Gets the promo code name for coupons applied to basket
 * @param {Basket} basket - Current basket
 * @returns {Status} Status
 */
function updatePromoCodeAndCalloutOnCouponsInBasket(basket) {
    const existingCouponLineItems = basket.getCouponLineItems();
    var couponsIterator = existingCouponLineItems.iterator();

    if (!empty(couponsIterator)) {
        while (couponsIterator.hasNext()) {
            var couponLineItem = null;
            // this will loop through all the existingCoupons
            var currentCouponLineItem = couponsIterator.next();
            // grab promos from currently selected coupon
            var appliedPromo = currentCouponLineItem.promotion;
            if (appliedPromo) {
                try {
                    couponLineItem = basket.getCouponLineItem(currentCouponLineItem.couponCode);
                    Transaction.begin();
                    couponLineItem.custom.calloutMsg = appliedPromo.calloutMsg;
                    couponLineItem.custom.promoName = appliedPromo.name;
                    Transaction.commit();
                } catch (e) {
                    return errorLogHelper.handleOcapiHookErrorStatus(e);
                }
            }
        }
    }
    return new Status(Status.OK);
}

/**
 * Handles the basket payment instruments after adding or deleting coupons.
 * @param {Basket} basket - Current basket
 * @returns {Status} - Status
 */
function handleCouponPromotions(basket) {
    try {
        require('dw/system/HookMgr').callHook('dw.order.calculate', 'calculate', basket);
        paymentHelper.autoAdjustBasketPaymentInstruments(basket);
        estimateLoyaltyPionts(basket);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e);
    }
    return new Status(Status.OK);
}

/**
 * Check the loyalty coupon is already redeemed or not before applying
 * @param {Basket} basket - Current basket
 * @param {couponItem} couponItem - Coupon item
 * @returns {Status} - Status
*/
function checkRedeemedCouponCode(basket, couponItem) {
    if (PreferencesUtil.getValue('isLoyaltyEnable') && customer.isMemberOfCustomerGroup('Loyalty')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        if (!loyaltyHelper.canApplyLoyaltyCoupon(couponItem.code)) {
            var Resource = require('dw/web/Resource');
            return new Status(Status.ERROR, 'ERROR', Resource.msg('error.unable.to.add.coupon', 'cart', null));
        }
    }
    return new Status(Status.OK);
}

exports.afterPOST = function (basket) {
    if (basket) {
        updatePromoCodeAndCalloutOnCouponsInBasket(basket);
    }
    return handleCouponPromotions(basket);
};

exports.beforePOST = function (basket, couponItem) {
    return checkRedeemedCouponCode(basket, couponItem);
};

exports.afterDELETE = function (basket) {
    return handleCouponPromotions(basket);
};

exports.beforeDELETE = function (basket, couponItemID) {
    if (PreferencesUtil.getValue('isLoyaltyEnable') && customer.isMemberOfCustomerGroup('Loyalty')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        loyaltyHelper.onRemoveCouponLineItem(basket, couponItemID);
    }
    return new Status(Status.OK);
};
