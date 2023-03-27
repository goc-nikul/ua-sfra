'use strict';

var CouponMgr = require('dw/campaign/CouponMgr');

/**
 * getCouponId function returns the coupon id for a given coupon code
 * @param {string} couponCode A Coupon Code
 * @return {string} The coupon id for the coupon code
 */
function getCouponId(couponCode) {
    var coupon = CouponMgr.getCouponByCode(couponCode);
    if (coupon) {
        return coupon.ID;
    }
    return null;
}

module.exports = {
    getCouponId: getCouponId
};
