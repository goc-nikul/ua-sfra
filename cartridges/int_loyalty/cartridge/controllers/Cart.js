'use strict';

var server = require('server');
server.extend(module.superModule);

const Log = require('dw/system/Logger').getLogger('loyalty', 'loyalty');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
const { LOYALTY_REWARD_FLOW_TYPE } = require('*/cartridge/scripts/LoyaltyConstants');
var TotalsModel = require('*/cartridge/models/totals');

server.append('Show', function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !customer.isMemberOfCustomerGroup('Loyalty')) {
        return next();
    }
    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    const minihub = {};

    if (empty(currentBasket)) {
        minihub.show = false;
        res.setViewData({ minihub: minihub });
        return next();
    }

    let rewards;
    let error = false;
    let loyaltyPoints = '';

    // Reconcile Loyalty Rewards
    loyaltyHelper.checkCustomerReconcile(currentBasket);

    try {
        rewards = loyaltyHelper.getRewards();
    } catch (e) {
        error = true;
        Log.error('Error while executing int_loyalty Cart-Show: {0}', e.message);
    }

    loyaltyPoints = currentBasket.custom.loyaltyPointsBalance;
    if (empty(loyaltyPoints) || isNaN(loyaltyPoints)) {
        minihub.error = {
            errorModal: true,
            title: Resource.msg('loyalty.error', 'loyalty', null),
            bodyText: Resource.msg('error.minihub.points', 'minihub', ''),
            btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null)
        };
    }

    if (!empty(rewards)
        && !empty(currentBasket)
        && (!empty(rewards.availableRewards) || !empty(rewards.redeemedRewards))) {
        const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
        minihub.show = true;
        minihub.isInvalidCoupon = false;
        minihub.flowTypes = LOYALTY_REWARD_FLOW_TYPE;
        minihub.loyaltyPoints = loyaltyPoints;
        minihub.availableRewards = rewards.availableRewards;
        minihub.redeemedRewards = rewards.redeemedRewards;
        minihub.appliedLoyaltyCouponCode = rewards.appliedLoyaltyCouponCode;
        if (empty(minihub.availableRewards)) {
            minihub.availableRewards = [];
        }

        // Merge redeemed rewards into available rewards list
        if (!empty(minihub.redeemedRewards)) {
            minihub.redeemedRewards.forEach(rewardItem => {
                const rewardID = rewardItem.reward.rewardID;
                const couponCode = rewardItem.code;
                if (!minihub.availableRewards.find(availableReward => availableReward.rewardID === rewardID) && minihub.appliedLoyaltyCouponCode.find(appliedReward => appliedReward === couponCode)) {
                    minihub.availableRewards.push(rewardItem.reward);
                }
            });
            if (empty(minihub.availableRewards)) {
                minihub.availableRewards = [];
                minihub.show = false;
            }
        }
        minihub.oosMsg = Resource.msg('error.minihub.oosmessage', 'minihub', null);
        minihub.actions = {
            redeem: URLUtils.url('Loyalty-RedeemReward').toString(),
            remove: URLUtils.url('Loyalty-RemoveReward').toString()
        };
        if ('couponLineItems' in currentBasket && currentBasket.couponLineItems.length > 0) {
            const Transaction = require('dw/system/Transaction');
            for (var i = 0; i < currentBasket.couponLineItems.length; i++) {
                var couponLineItem = currentBasket.couponLineItems[i];
                var couponCode = couponLineItem.couponCode;
                if (couponCode.indexOf(LOYALTY_PREFIX) !== -1 && !('loyaltyRewardID' in couponLineItem.custom)) {
                    for (var j = 0; j < rewards.redeemedRewards.length; j++) {
                        if (couponCode === rewards.redeemedRewards[j].code) {
                            Transaction.begin();
                            couponLineItem.custom.loyaltyRewardID = rewards.redeemedRewards[j].reward.rewardID;
                            Transaction.commit();
                        }
                    }
                }
                if (currentBasket.couponLineItems[i].couponCode.indexOf(LOYALTY_PREFIX) !== -1 && !currentBasket.couponLineItems[i].applied && !minihub.isInvalidCoupon) {
                    minihub.isInvalidCoupon = true;
                    minihub.error = {
                        errorModal: true,
                        bodyText: Resource.msg('error.minihub.invalidcoupon', 'minihub', ''),
                        btnText: Resource.msg('loyalty.error.btn.ok', 'loyalty', null),
                        btnActionURL: null,
                        icon: Resource.msg('loyalty.icon.alert', 'loyalty', null)
                    };
                }
            }
        }
    } else if (error) {
        minihub.error = {
            errorModal: true,
            title: Resource.msg('loyalty.error', 'loyalty', null),
            bodyText: Resource.msg('error.minihub.points', 'minihub', ''),
            btnText: Resource.msg('loyalty.error.refresh.page', 'loyalty', null)
        };
    }

    res.setViewData({ minihub: minihub });
    return next();
});

server.append('AddProduct', function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    loyaltyHelper.estimate(currentBasket);

    return next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    if (!loyaltyHelper.estimate(currentBasket)) {
        res.setViewData({
            errorEstimateMsg: Resource.msg('loyalty.error.earning.basket', 'loyalty', '')
        });
    }
    // Update view data since we've modified the cart in previous functions
    var totalsModel = new TotalsModel(currentBasket);
    var basket = res.viewData.basket || {};
    basket.totals = totalsModel;
    res.setViewData({ basket: basket });
    return next();
});

server.append('UpdateQuantity', function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    if (!loyaltyHelper.estimate(currentBasket)) {
        res.json({
            errorEstimateMsg: Resource.msg('loyalty.error.earning.basket', 'loyalty', '')
        });
    }
    // Update view data since we've modified the cart in previous functions
    var viewData = res.getViewData();
    var totalsModel = new TotalsModel(currentBasket);
    if (viewData.basketModel) {
        viewData.basketModel.totals = totalsModel;
    } else if (viewData.totals) {
        viewData.totals = totalsModel;
    }
    res.setViewData(viewData);

    return next();
});

server.append('AddCoupon', function (req, res, next) {
    var viewData = res.getViewData();
    if (!viewData.error) {
        if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
            return next();
        }
        const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
        const estRes = loyaltyHelper.estimate(currentBasket);
        var totalsModel = new TotalsModel(currentBasket);
        viewData.totals = totalsModel;

        if (!('estimatedLoyaltyPoints' in currentBasket.custom) || !estRes) {
            viewData.errorEstimateMsg = Resource.msg('loyalty.error.earning.basket', 'loyalty', '');
        }

        res.setViewData(viewData);
    }

    return next();
});

server.prepend('AddCoupon', function (req, res, next) {
    var couponCode = req.querystring.couponCode;
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    if (!loyaltyHelper.canApplyLoyaltyCoupon(couponCode)) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.unable.to.add.coupon', 'cart', null)
        });
        this.done(req, res);
        return; // eslint-disable-line
    }
    return next();
});

server.append('RemoveCouponLineItem', function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }

    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    const estRes = loyaltyHelper.estimate(currentBasket);

    if (!('estimatedLoyaltyPoints' in currentBasket.custom)) {
        res.setViewData({
            errorEstimateMsg: Resource.msg('loyalty.error.earning.basket', 'loyalty', '')
        });
        return next();
    }

    var viewDataInner = res.viewData;
    viewDataInner.totals.estimatedLoyaltyPoints = currentBasket.custom.estimatedLoyaltyPoints;
    if (!estRes) {
        viewDataInner.errorEstimateMsg = Resource.msg('loyalty.error.earning.basket', 'loyalty', '');
    }
    res.setViewData(viewDataInner);

    return next();
});

server.prepend('RemoveCouponLineItem', function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }

    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    if (empty(currentBasket) || empty(req.querystring.uuid)) {
        return next();
    }
    const collections = require('*/cartridge/scripts/util/collections');
    const couponLineItem = collections.find(currentBasket.couponLineItems, item => item.UUID === req.querystring.uuid);
    const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
    if (couponLineItem !== null && couponLineItem.couponCode.includes(LOYALTY_PREFIX)) {
        var viewDataInner = res.viewData;
        viewDataInner.shouldReloadPage = true;
    }
    loyaltyHelper.onRemoveCouponLineItem(currentBasket, req.querystring.uuid);

    return next();
});

server.prepend('RemoveProductLineItem', function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }

    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    if (empty(currentBasket) || empty(req.querystring.uuid)) {
        return next();
    }

    loyaltyHelper.onRemoveProductLineItem(currentBasket, req.querystring.uuid);

    return next();
});

module.exports = server.exports();
