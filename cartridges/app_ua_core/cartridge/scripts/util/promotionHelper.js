/* global session */
'use strict';

const BasketMgr = require('dw/order/BasketMgr');
const collections = require('*/cartridge/scripts/util/collections');

/**
* mapPromotion
* - This should always keep representation with System Class Object structure.
* @param {dw.order.Promotion} p - promotion
* @returns {Object} mapped promotion
*/
function mapPromotion(p) {
    if (!p) {
        return null;
    }
    return {
        ID: p.ID,
        name: p.name,
        active: p.active,
        promotionClass: p.promotionClass,
        exclusivity: p.exclusivity,
        qualifierMatchMode: p.qualifierMatchMode,
        rank: p.rank,
        basedOnCoupons: p.basedOnCoupons,
        coupons: collections.map(p.coupons || [], function (s) {
            return {
                ID: s.ID
            };
        }),
        basedOnSourceCodes: p.basedOnSourceCodes,
        sourceCodeGroups: collections.map(p.sourceCodeGroups || [], function (s) {
            return {
                ID: s.ID
            };
        }),
        basedOnCustomerGroups: p.basedOnCustomerGroups,
        customerGroups: collections.map(p.customerGroups || [], function (s) {
            return {
                ID: s.ID
            };
        })
    };
}

/**
* Get promotions applied to basked from coupon code
* @param {string} couponCode - entered coupon
* @returns {Array} json mapped collection of promotions
*/
function getBasketPromotionsByCouponCode(couponCode) {
    const currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        return [];
    }
    const promotions = [];
    if (currentBasket.couponLineItems) {
        collections.forEach(currentBasket.couponLineItems, function (c) {
            if (c && c.couponCode === couponCode && c.priceAdjustments) {
                collections.forEach(c.priceAdjustments, function (p) {
                    promotions.push(mapPromotion(p.promotion));
                });
            }
        });
    }

    return promotions;
}

module.exports = {
    getBasketPromotionsByCouponCode: getBasketPromotionsByCouponCode
};
