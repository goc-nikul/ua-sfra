/**
 * basket_coupon_hook_scripts.js
 *
 * Handles OCAPI hooks for basket calls
 */

var Status = require('dw/system/Status');
var Resource = require('dw/web/Resource');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');
var paymentHelper = require('~/cartridge/scripts/paymentHelper');
let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var Transaction = require('dw/system/Transaction');


/**
 * Gets the estimated Loyalty points for Loyalte users.
 * @param {Basket} basket - Current basket
 * @returns {void}
 */
function estimateLoyaltyPoints(basket) {
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
        estimateLoyaltyPoints(basket);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e);
    }
    return new Status(Status.OK);
}

/**
 * Checks a coupon up-front so that a custom error message may be returned.
 * If the coupon is valid, it is removed so that the OCAPI add coupon functionality will work.
 * @param {Basket} basket - Current basket
 * @param {Coupon} couponItem - coupon being added
 * @returns {Status | undefined} - Status
 */
function checkCoupon(basket, couponItem) {
    var error;
    var couponLineItem;

    try {
        couponLineItem = basket.createCouponLineItem(
            couponItem.code,
            true
        );
    } catch (e) {
        error = e;
    }
    if (error) {
        var errorCodes = {
            COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
            COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
            COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
            COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon',
            COUPON_DISABLED: 'error.unable.to.add.coupon',
            REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
            TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED:
                'error.unable.to.add.coupon',
            NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon',
            default: 'error.unable.to.add.coupon'
        };
        var errorMessageKey = errorCodes[error.errorCode] || errorCodes.default;
        var errorMessage = Resource.msg(errorMessageKey, 'cart', null);
        var status = new Status(Status.ERROR, 'CREATE_COUPON_LINE_ITEM_ERROR', errorMessage);
        status.addDetail('couponCode', couponItem.code);
        status.addDetail('errorCode', error.errorCode);
        return status;
    }
    basket.removeCouponLineItem(couponLineItem);
    return undefined;
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
    const errorStatus = checkCoupon(basket, couponItem);
    if (errorStatus) {
        return errorStatus;
    }
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
