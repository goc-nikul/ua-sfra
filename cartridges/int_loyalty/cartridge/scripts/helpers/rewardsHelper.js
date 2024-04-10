'use strict';

const { ONLINE_DOLLAR_OFF, FREE_PRODUCT } = require('*/cartridge/scripts/LoyaltyConstants').LOYALTY_REWARD_FLOW_TYPE;

const REWARD_INVALID_FLOW_TYPE_ERROR = 'REWARD_INVALID_FLOW_TYPE_ERROR';
const REWARD_REDEEM_ERROR = 'REWARD_REDEEM_ERROR';
const REWARD_REJECT_ERROR = 'REWARD_REJECT_ERROR';

const Transaction = require('dw/system/Transaction');
const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

var Logger = require('dw/system/Logger').getLogger('loyalty', 'Loyalty');

/**
 * Estimates basket loyalty points ballance and totals
 * @param {dw.order.Basket} basket - Basket object to be racalculated and saved
 */
function updateBasket(basket) {
    Transaction.begin();
    basketCalculationHelpers.calculateTotals(basket);
    Transaction.commit();
    loyaltyHelper.updateBasketBallance(basket);
}

/**
 * Creates coupon in the basket
 * @param {dw.order.Basket} basket - Basket object to create coupon
 * @param {string} couponCode - Code of coupon to be created
 * @param {string} loyaltyRewardFlowType - Reward flow type
 * @param {string} loyaltyRewardID - Reward ID associated with the coupon
 * @returns {dw.order.CouponLineItem} - Returns created coupon line items
 */
function createCouponLineItem(basket, couponCode, loyaltyRewardFlowType, loyaltyRewardID) {
    var couponLineItem = null;
    try {
        Transaction.begin();
        couponLineItem = basket.createCouponLineItem(couponCode, true);
        couponLineItem.custom.loyaltyRewardFlowType = loyaltyRewardFlowType;
        couponLineItem.custom.loyaltyRewardID = loyaltyRewardID;
        Transaction.commit();
    } catch (e) {
        Logger.error(
            'The loyalty coupon was not added to the basket due to: "{0}"',
            e.errorCode
        );
    }
    return couponLineItem;
}

/**
 * Removes coupon from the basket
 * @param {dw.order.Basket} basket - Basket object from which to remove coupon
 * @param {string} couponCode - Code of coupon to be removed
 * @returns {boolean} - Is successful remove of coupon
 */
function removeCouponLineItem(basket, couponCode) {
    const couponLineItem = basket.getCouponLineItem(couponCode);

    if (!empty(couponLineItem)) {
        Transaction.begin();
        basket.removeCouponLineItem(couponLineItem);
        Transaction.commit();
        return true;
    }

    return false;
}

/**
 * Finds coupon code by the reward id that is in custom.loyaltyRewardID
 * @param {string} rewardId - Reward id contained in the coupon line item custom.loyaltyRewardID
 * @returns {string} - Coupon code
 */
function findCouponByRewardID(rewardId) {
    const collections = require('*/cartridge/scripts/util/collections');
    const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    const couponLineItem = collections.find(currentBasket.getCouponLineItems(), item => item.custom.loyaltyRewardID === rewardId);

    return !empty(couponLineItem) ? couponLineItem.couponCode : '';
}

/**
 * Finds product id by the reward id that is in custom.loyaltyRewardID
 * @param {dw.order.Basket} basket - Basket object from which to remove coupon
 * @param {string} rewardId - Reward id contained in the coupon line item custom.loyaltyRewardID
 * @returns {string} - product ID
 */
function findProductByRewardID(basket, rewardId) {
    const collections = require('*/cartridge/scripts/util/collections');
    const couponLineItem = collections.find(basket.getCouponLineItems(), item => item.custom.loyaltyRewardID === rewardId);
    const promoID = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotionID : '';
    const adjProductLineItems = [];
    collections.forEach(basket.getAllProductLineItems(), (item) => {
        if (!empty(item.getPriceAdjustmentByPromotionID(promoID))) {
            adjProductLineItems.push(item);
        }
    });

    return !empty(adjProductLineItems) ? adjProductLineItems[0].productID : '';
}

/**
 * Checks if the coupon is existing and rejects reward if not
 * @param {string} couponCode - Coupon to be checked
 * @returns {boolean} - Coupon exists
 */
function isValidCouponCode(couponCode) {
    if (empty(couponCode)) {
        return false;
    }
    const coupon = require('dw/campaign/CouponMgr').getCouponByCode(couponCode);
    if (empty(coupon) || !coupon.enabled) {
        loyaltyHelper.rejectReward(couponCode);
        return false;
    }
    return true;
}

var BaseReward = {
    rewardFlowType: null,
    rewardId: null,
    couponCode: null,
    isValid: function () { return false; },
    redeem: function () { return false; },
    reject: function () { return false; },
    removeAndReject: function () { return false; }
};


var dollarOffReward = function (rewardId) {
    return Object.assign({}, BaseReward, {
        rewardId: rewardId,
        couponCode: findCouponByRewardID(rewardId),
        rewardFlowType: ONLINE_DOLLAR_OFF,
        isValid: function () {
            return !empty(this.rewardId);
        },
        redeem: function () {
            if (!this.isValid()) {
                throw new Error(REWARD_REDEEM_ERROR);
            }

            const couponCode = loyaltyHelper.redeemReward(parseInt(this.rewardId, 10));

            if (!isValidCouponCode(couponCode)) {
                throw new Error(REWARD_REDEEM_ERROR);
            }

            const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
            const couponLineItem = createCouponLineItem(currentBasket, couponCode, ONLINE_DOLLAR_OFF, this.rewardId);
            updateBasket(currentBasket);

            return !empty(couponLineItem);
        },
        reject: function () {
            return loyaltyHelper.rejectReward(this.couponCode);
        },
        removeAndReject: function () {
            if (!this.isValid()) {
                throw new Error(REWARD_REJECT_ERROR);
            }

            const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
            const success = removeCouponLineItem(currentBasket, this.couponCode);

            if (success) {
                if (!this.reject()) {
                    throw new Error(REWARD_REJECT_ERROR);
                }
                updateBasket(currentBasket);
            }
            return success;
        }
    });
};

var freeProductReward = function (rewardId, productId) {
    return Object.assign({}, BaseReward, {
        rewardId: rewardId,
        productId: productId,
        product: require('dw/catalog/ProductMgr').getProduct(productId),
        couponCode: findCouponByRewardID(rewardId),
        rewardFlowType: FREE_PRODUCT,
        isValid: function () {
            return !empty(this.rewardId)
                && !empty(this.product)
                && this.product.isOnline()
                && this.product.isProduct()
                && !this.product.isMaster();
        },
        redeem: function () {
            if (!this.isValid()) {
                throw new Error(REWARD_REDEEM_ERROR);
            }

            const couponCode = loyaltyHelper.redeemReward(parseInt(this.rewardId, 10));

            if (!isValidCouponCode(couponCode)) {
                throw new Error(REWARD_REDEEM_ERROR);
            }

            const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
            const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
            const couponLineItem = createCouponLineItem(currentBasket, couponCode, FREE_PRODUCT, this.rewardId);
            Transaction.begin();
            const addToCartResult = cartHelper.addProductToCart(currentBasket, productId, 1, [], []);
            Transaction.commit();
            updateBasket(currentBasket);

            return !empty(couponLineItem) && !addToCartResult.error;
        },
        reject: function () {
            return loyaltyHelper.rejectReward(this.couponCode);
        },
        removeAndReject: function () {
            if (!this.isValid()) {
                throw new Error(REWARD_REJECT_ERROR);
            }

            const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
            let productToDelete = findProductByRewardID(currentBasket, rewardId);
            let success = removeCouponLineItem(currentBasket, this.couponCode);
            const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
            success = cartHelper.removeProductFromCart(productToDelete);

            if (success) {
                if (!this.reject()) {
                    throw new Error(REWARD_REJECT_ERROR);
                }
                updateBasket(currentBasket);
            }
            return success;
        }
    });
};

module.exports.getReward = function (params) {
    switch (params.rewardFlowType) {
        case ONLINE_DOLLAR_OFF:
            return dollarOffReward(params.rewardId);
        case FREE_PRODUCT:
            return freeProductReward(params.rewardId, params.productId);
        default:
            throw new Error(REWARD_INVALID_FLOW_TYPE_ERROR);
    }
};
