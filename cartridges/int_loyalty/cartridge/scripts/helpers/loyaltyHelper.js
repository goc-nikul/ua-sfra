/* eslint-disable no-unused-vars */
'use strict';

var Logger = require('dw/system/Logger').getLogger('loyalty', 'Loyalty');

/**
 * Returns true if loyalty functionality is enabled otherwise returns false
 * @returns {boolean} - is loyalty functionality enabled
 */
function isLoyaltyEnabled() {
    return require('dw/system/Site').getCurrent().getCustomPreferenceValue('isLoyaltyEnable');
}

/**
 * Returns true if loyalty pilot is enabled to check zip codes
 * @returns {boolean} - is loyalty loyalty pilot is enabled
 */
function isLoyaltyPilotEnabled() {
    return require('dw/system/Site').getCurrent().getCustomPreferenceValue('isLoyaltyPilotEnable');
}

/**
 * Returns the ID of Marketing landing content asset
 * @returns {string} - Marketing landing content asset ID
 */
function getMarketingLandingContentID() {
    return require('dw/system/Site').getCurrent().getCustomPreferenceValue('loyaltyLandingContentAssetID');
}

/**
 * getRewardsLockerURL - helper function to configure Rewards Locker URL
 * @returns {string} - rewards locker URL
 */
function getRewardsLockerURL() {
    return require('dw/web/URLUtils').url('MyRewardsLocker-Show');
}

/**
 * Returns if the zip code is contained in the site preference loyaltyPilotZipCodes
 * @param {string} zipCode - zip code
 * @returns {boolean} - is the zip code in the pilot zip codes
 */
function isLoyaltyPilotZipCode(zipCode) {
    const pilotZipCodes = require('dw/system/Site').getCurrent().getCustomPreferenceValue('loyaltyPilotZipCodes');

    if (empty(pilotZipCodes) || empty(zipCode)) {
        return false;
    }

    if (zipCode.includes('-')) {
        return pilotZipCodes.includes(zipCode.split('-')[0]);
    }

    return pilotZipCodes.includes(zipCode);
}

/**
 * Checks if loyalty product
 * @param {dw.catalog.Product} product - product to be checked
 * @returns {boolean} - is loyalty product
 */
function isLoyaltyProduct(product) {
    return !empty(product) && 'isLoyaltyExclusive' in product.custom && product.custom.isLoyaltyExclusive;
}

/**
 * Checks if loyalty category
 * @param {dw.catalog.Category} category - category to be checked if it loyalty
 * @returns {boolean} - is loyalty category
 */
function isLoyaltyCategory(category) {
    return !empty(category) && 'loyalty' in category.custom && category.custom.loyalty;
}

/**
 * Checks if the current customer is member of Loyalty group
 * @returns {boolean} - is loyal customer
 */
function isLoyalCustomer() {
    return session.customer.isMemberOfCustomerGroup('Loyalty');
}

/**
 * Checks if the current customer is VIP customer or not
 * @returns {boolean} - is VIP customer
 */
function isVIPCustomer() {
    var Site = require('dw/system/Site');
    return Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(session.customer.profile) && 'vipAccountId' in session.customer.profile.custom && !empty(session.customer.profile.custom.vipAccountId);
}

/**
 * Checks if the Reward Reconciliation site preference is enabled
 * @returns {boolean} - is VIP customer
 */
function isRewardReconciliationEnabled() {
    var Site = require('dw/system/Site');
    return Site.getCurrent().getCustomPreferenceValue('isLoyaltyRewardsReconciliationEnabled');
}

/**
 * Returns bearer token string needed for graphql
 * @returns {string} - token string
 */
function getToken() {
    const UACAPIAuthTokenHelper = require('~/cartridge/scripts/services/UACAPIAuthTokenHelper');
    const tokenHelper = new UACAPIAuthTokenHelper();
    const accessToken = tokenHelper && tokenHelper.getValidToken() ? tokenHelper.getValidToken().accessToken : null;
    return 'Bearer ' + accessToken;
}

/**
 * Checks if basket's attribute loyaltyPointsBalance is empty and if necessary updates it
 * @param {dw.order.LineItemCtnr} liCtnr - basket to be updated
 * @param {string | undefined} referenceCustomerNo - apple pay customer no for isolated basket
 * @returns {boolean} - Successfull
 */
function updateBasketBallance(liCtnr, referenceCustomerNo) {
    const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
    const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    let success = false;
    const token = getToken();
    const confirmedPointsCall = loyaltyDataService.getGraphQL('confirmedPoints', token);
    var params = loyaltyServiceHelper.getGraphQLParams('confirmedPoints', liCtnr, referenceCustomerNo);
    const confirmedPointsResponse = confirmedPointsCall.call(params);

    if (confirmedPointsResponse.ok && !confirmedPointsResponse.error && confirmedPointsResponse.object) {
        const Transaction = require('dw/system/Transaction');
        let lineItems = liCtnr;
        let estimatedPoints = 0;
        if (liCtnr.getAdjustedMerchandizeTotalPrice().getValue() > 0) {
            estimatedPoints = confirmedPointsResponse.object.estimatedPoints;
        }
        Transaction.begin();
        lineItems.custom.loyaltyPointsBalance = confirmedPointsResponse.object.balance;
        lineItems.custom.loyaltyPointsBalanceCheckDate = new Date();
        lineItems.custom.estimatedLoyaltyPoints = estimatedPoints;
        Transaction.commit();
        success = true;
    }
    return success;
}

/**
 * Find out request is from mobile or desktop
 * @returns {boolean} - isMobile
*/
function getRequestAgent() {
    const mobileAgentHash = ['mobile', 'tablet', 'phone', 'ipad', 'ipod', 'android', 'blackberry', 'windows ce', 'opera mini', 'palm'];
    let idx = 0;
    // eslint-disable-next-line no-shadow
    let isMobile = false;
    let userAgent = request.httpUserAgent.toLowerCase();

    while (mobileAgentHash[idx++] && !isMobile) {
        isMobile = (userAgent.indexOf(mobileAgentHash[idx]) >= 0);
    }
    return isMobile ? 'mobile' : 'desktop';
}

/**
 * @param {dw.system.Request} request - request object
 * @returns {JSON} - parms
 */
function getChannelDetails(request) {
    var params = {};
    params.channel = 'channel' in request.querystring && request.querystring.channel !== 'undefined' ? request.querystring.channel : 'WEB';
    params.subChannel = 'subChannel' in request.querystring && request.querystring.subChannel !== 'undefined' ? request.querystring.subChannel : getRequestAgent();
    params.subChannelDetail = 'subChannelDetail' in request.querystring && request.querystring.subChannelDetail !== 'undefined' ? request.querystring.subChannelDetail : '';

    return params;
}

/**
 * Checks if the entered coupon is a Loyalty Coupon and can be applied to the current customer.
 * The coupon must be in list of "redeemed" rewards in L+, otherwise this check will return false.
 * @param {string} couponCode - Coupon Code
 * @returns {boolean} - boolean
 */
function canApplyLoyaltyCoupon(couponCode) {
    const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
    if (!empty(couponCode) && couponCode.indexOf(LOYALTY_PREFIX) !== -1) {
        try {
            let rewards = this.validateClaimedRewards('COUPON_CODE', couponCode);
            if (empty(rewards) || !rewards.redeemedRewards.length || rewards.redeemedRewards[0].status !== 'REDEEMED') {
                return false;
            }
        } catch (e) {
            Logger.error('Error while validating the claimed rewards before applying the coupon: {0}', e.message);
            return false;
        }
    }
    return true;
}

/**
 * Parses a nested cookie by '$'
 * @param {string} str the coolie string
 * @returns {Object} key value pair split by '$'
 */
function splitMarketingCookie(str) {
    return str
        .split('$')
        .map(v => v.split(':'))
        .reduce((acc, v)=>{
            // eslint-disable-next-line no-param-reassign
            acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
            return acc;
        });
}

/**
 * Finds a nested key value within the utag_main cookie
 * @param {string} key the key within the utag_main cookie to find
 * @returns {string | null} the cookie value
 */
function getUATagMainCookieValue(key) {
    var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
    const uatagMainCookie = cookieHelpers.read('utag_main');
    if (uatagMainCookie) {
        const cookieValue = splitMarketingCookie(uatagMainCookie);
        return (cookieValue && key in cookieValue) ? cookieValue[key].split(';')[0] : '';
    }
    return null;
}

/**
 * Finds a campaign ID
 * @param {string} key the key within the utag_main cookie to find
 * @returns {string | null} the cookie value
 */
function getCampaignID(key) {
    const externalCampaignID = getUATagMainCookieValue(key);
    return externalCampaignID;
}

/**
 * @param {string} filterType - Type of Filter
 * @param {string} filterParam - Value of Filter
 * @returns {Object} - parms
 */
function getFilters(filterType, filterParam) {
    var params = {};
    params.filterType = !empty(filterType) ? filterType : '';
    params.filterParam = !empty(filterParam) ? filterParam : '';

    return params;
}

/**
 * Checks if the current order contain the Loyalty Coupon code
 * @param {dw.order.LineItemCtnr} order - basket or order
 * @returns {Array} - coupon
 */
function getLoyaltyCouponsFromLineItemCtnr(order) {
    const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
    var coupon = [];

    if (!empty(order) && 'couponLineItems' in order && order.couponLineItems.length > 0) {
        for (var i = 0; i < order.couponLineItems.length; i++) {
            if (order.couponLineItems[i].couponCode.indexOf(LOYALTY_PREFIX) !== -1) {
                coupon.push(order.couponLineItems[i].couponCode);
            }
        }
    }
    return coupon;
}

/**
 * Fetches the rewards
 * @returns {Object} - rewards
 */
function getRewards() {
    const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
    const token = getToken();
    const rewardsCall = loyaltyDataService.getGraphQL('rewards', token);
    let params = loyaltyServiceHelper.getGraphQLParams('rewards', null);
    const rewardsResponse = rewardsCall.call(params);

    const currentBasket = require('dw/order/BasketMgr').getCurrentOrNewBasket();
    const listOfAppliedLoyaltyCouponCodes = getLoyaltyCouponsFromLineItemCtnr(currentBasket);

    let rewards = {};
    if (rewardsResponse.ok && rewardsResponse.object) {
        if (empty(listOfAppliedLoyaltyCouponCodes)) {
            rewards.redeemedRewards = '';
            rewards.appliedLoyaltyCouponCode = '';
        } else {
            rewards.redeemedRewards = rewardsResponse.object.claimedRewards;
            rewards.appliedLoyaltyCouponCode = listOfAppliedLoyaltyCouponCodes;
        }
        rewards.availableRewards = rewardsResponse.object.rewards;
    }
    if (!empty(rewardsResponse.object.balance)) {
        const Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            currentBasket.custom.loyaltyPointsBalance = rewardsResponse.object.balance;
            currentBasket.custom.loyaltyPointsBalanceCheckDate = new Date();
        });
    }
    return rewards;
}
/**
 * Fetches the rewards
 * @param {string} filterType - Type of Filter
 * @param {string} filterParam - Value of Filter
 * @returns {Object} - rewards
 */
function validateClaimedRewards(filterType, filterParam) {
    const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
    const token = getToken();
    const filterDetails = getFilters(filterType, filterParam);
    const rewardsCall = loyaltyDataService.getGraphQL('claimedRewards', token);
    let params = loyaltyServiceHelper.getGraphQLParams('claimedRewards', filterDetails);
    const rewardsResponse = rewardsCall.call(params);

    let rewards = {};
    if (rewardsResponse.ok && rewardsResponse.object) {
        rewards.redeemedRewards = rewardsResponse.object.claimedRewards;
    }
    return rewards;
}

/**
 * Remove Invalid Loyalty Coupon Code from Basket
 * @param {dw.order.Basket} basket - basket to be updated
 * @returns {boolean} - Successfull
 */
function removeInvalidLoyaltyCoupons(basket) {
    const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
    const Transaction = require('dw/system/Transaction');
    if (!empty(basket) && 'couponLineItems' in basket && basket.couponLineItems.length > 0) {
        for (var i = 0; i < basket.couponLineItems.length; i++) {
            if (basket.couponLineItems[i].couponCode.indexOf(LOYALTY_PREFIX) !== -1 && !basket.couponLineItems[i].applied) {
                this.rejectReward(basket.couponLineItems[i].couponCode);
                Transaction.begin();
                basket.removeCouponLineItem(basket.couponLineItems[i]);
                Transaction.commit();
            }
        }
    }
    return true;
}

/**
 * Enrolls a user into Loyalty program
 * @param {dw.system.Request} req - req object
 * @returns {Object} - customer is enrolled
 */
function enroll(req) {
    var enrollResponse = {};
    enrollResponse.enrolled = this.isLoyalCustomer();
    if (!enrollResponse.enrolled) {
        const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
        const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
        const token = getToken();
        const channelDetails = getChannelDetails(req);
        try {
            const enrollmentCall = loyaltyDataService.getGraphQL('enrollment', token);
            var params = loyaltyServiceHelper.getGraphQLParams('enrollment', channelDetails);
            const enrollmentResponse = enrollmentCall.call(params);
            if (enrollmentResponse.ok && enrollmentResponse.object && enrollmentResponse.object.enrolled) {
                const Transaction = require('dw/system/Transaction');
                const loyaltyConstants = require('~/cartridge/scripts/LoyaltyConstants');
                Transaction.begin();
                customer.profile.custom.loyaltyStatus = loyaltyConstants.LOYALTY_STATUS.ENROLLED;
                customer.profile.custom.loyaltyStatusDate = new Date();
                customer.profile.custom.loyaltyID = enrollmentResponse.object.loyaltyID;
                Transaction.commit();
                enrollResponse.enrolled = true;
            } else {
                var errorMessage = enrollmentResponse.object !== null ? enrollmentResponse.object.errorMessage : enrollmentResponse.errorMessage;
                Logger.error('Enroll in Loyalty failed: ' + errorMessage);
                enrollResponse.errorMessage = errorMessage;
                enrollResponse.enrolled = false;
            }
        } catch (error) {
            Logger.error('Enroll in Loyalty failed: ' + error);
            enrollResponse.errorMessage = error;
            enrollResponse.enrolled = false;
        }
    }
    return enrollResponse;
}

/**
 * Estimates the points of a current purchase
 * @param {dw.order.LineItemCtnr} liCtnr - basket or order to be estimated
 * @param {string} referenceCustomerNo - apple pay customer no for isolated basket
 * @returns {boolean} - Successfull estimation
 */
function estimate(liCtnr, referenceCustomerNo) {
    var estimatedLoyaltyPoints = 0;
    var estimatedItemPoints;
    let success = false;
    const Transaction = require('dw/system/Transaction');
    if (liCtnr.getAllProductLineItems().getLength() > 0 && liCtnr.getAdjustedMerchandizeTotalPrice().getValue() > 0) {
        const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
        const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
        const token = getToken();
        const estimationCall = loyaltyDataService.getGraphQL('estimation', token);
        let params = loyaltyServiceHelper.getGraphQLParams('estimation', liCtnr, referenceCustomerNo);
        var estimationResponse = null;
        try {
            estimationResponse = estimationCall.call(params);
            if (estimationResponse.ok && estimationResponse.object && estimationResponse.object.estimatedPoints >= 0 && estimationResponse.object.products) {
                var lineItems = liCtnr;
                estimationResponse.object.products.forEach(product => {
                    estimatedItemPoints = product.points;
                    var productLineItem = lineItems.getProductLineItems(product.productID);
                    if (productLineItem.length > 0) {
                        Transaction.begin();
                        productLineItem[0].custom.estimatedItemLoyaltyPoints = estimatedItemPoints;
                        Transaction.commit();
                    }
                });
                estimatedLoyaltyPoints = estimationResponse.object.estimatedPoints;
                Transaction.begin();
                lineItems.custom.estimatedLoyaltyPoints = estimatedLoyaltyPoints;
                Transaction.commit();
                success = true;
            } else {
                Logger.error('Error in estimation call: ', estimationResponse.errorMessage);
            }
        } catch (e) {
            Logger.error('Error in estimation call: ', e.message);
        }
    } else {
        var basket = liCtnr;
        Transaction.begin();
        basket.custom.estimatedLoyaltyPoints = estimatedLoyaltyPoints;
        Transaction.commit();
        success = true;
    }
    return success;
}

/**
 * Batch operation to mark coupons as used.
 * @param {array} loyaltyCoupons - loyalty coupon
 * @param {string} customerNo - customer number
 * @returns {Object} - updateCouponResponse
 */
function updateCoupon(loyaltyCoupons, customerNo) {
    const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
    const token = getToken();
    let batchedResponses = [];
    let failedServiceCalls = 0;
    let failedUpdate = [];
    loyaltyCoupons.forEach((coupon)=> {
        let updateCouponCall = loyaltyDataService.getGraphQL('updateCoupon', token);
        let params = loyaltyServiceHelper.getGraphQLParams('updateCoupon', { loyaltyCoupons: [coupon], customerNo: customerNo });
        try {
            var res = updateCouponCall.call(params, 1);
            batchedResponses.push(res);
            if (!res || !res.ok) {
                failedServiceCalls++;
                throw new Error('Loyalty Plus Service Call Failed');
            }
            if (!res.object.couponUpdated) {
                throw new Error('Loyalty coupon ' + coupon + ' is invalid or missing in L+.');
            }
        } catch (e) {
            failedUpdate.push(e.message);
        }
    });

    return {
        object: {
            failedServiceCalls: failedServiceCalls,
            couponUpdated: failedUpdate.length === 0,
            errorMessage: failedUpdate ? failedUpdate.join(' ') : '',
            batchedResponses: batchedResponses
        },
        ok: failedServiceCalls === 0
    };
}

/**
* Redeem a Reward
* @param {rewardID} rewardID - ID of the reward
* @returns {string} couponCode
*/
function redeemReward(rewardID) {
    const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
    const token = getToken();
    const redeemRewardCall = loyaltyDataService.getGraphQL('redeemReward', token);
    let params = loyaltyServiceHelper.getGraphQLParams('redeemReward', rewardID);
    var redeemRewardResponse = null;
    var couponCode = null;
    try {
        redeemRewardResponse = redeemRewardCall.call(params);
        if (redeemRewardResponse.ok && redeemRewardResponse.object && redeemRewardResponse.object.coupon) {
            couponCode = redeemRewardResponse.object.coupon;
        } else {
            Logger.error('Error in estimation call: ', redeemRewardResponse.errorMessage);
        }
    } catch (e) {
        Logger.error('Error in estimation call: ', e.message);
    }
    return couponCode;
}

/**
* Reject a Reward
* @param {string} couponCode - coupon code
* @param {string} referenceCustomerNo - optional customerNo if we don't have a Customer object
* @returns {boolean} couponCode
*/
function rejectReward(couponCode, referenceCustomerNo) {
    const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
    const token = getToken();
    const rejectRewardCall = loyaltyDataService.getGraphQL('rejectEvent', token);
    let params = loyaltyServiceHelper.getGraphQLParams('rejectEvent', couponCode, referenceCustomerNo);
    var rejectRewardResponse = null;
    var rejected = false;
    try {
        rejectRewardResponse = rejectRewardCall.call(params);
        if (rejectRewardResponse.ok && rejectRewardResponse.object && rejectRewardResponse.object.rewardRejected) {
            rejected = rejectRewardResponse.object.rewardRejected;
        } else {
            Logger.error('Error in rejection call: ', rejectRewardResponse.errorMessage);
        }
    } catch (e) {
        Logger.error('Error in rejection call: ', e.message);
    }
    return rejected;
}

/**
* UpdateCustomerProfileIntoLoyalty
* @param {Object} profile - coupon code
* @returns {Object} - UpdateCustomerProfileIntoLoyaltyResponse
 */
function updateCustomerProfileIntoLoyalty(profile) {
    const loyaltyDataService = require('~/cartridge/scripts/services/loyaltyDataService');
    const loyaltyServiceHelper = require('~/cartridge/scripts/services/serviceHelper');
    const token = getToken();
    const updateProfileCall = loyaltyDataService.getGraphQL('updateCustomerProfileIntoLoyalty', token);
    let params = loyaltyServiceHelper.getGraphQLParams('updateCustomerProfileIntoLoyalty', profile);
    var updateProfileResponse = null;
    try {
        updateProfileResponse = updateProfileCall.call(params);
        if (updateProfileResponse.ok && updateProfileResponse.object && updateProfileResponse.object.customerUpdated) {
            updateProfileResponse.object.customerUpdated = true;
        } else {
            updateProfileResponse.object.customerUpdated = false;
        }
    } catch (e) {
        updateProfileResponse.object.errorMessage = e;
        updateProfileResponse.object.customerUpdated = false;
    }
    return updateProfileResponse;
}

/**
 * Removes coupon and product that is price adjusted by the coupon
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Line item container
 * @param {string} couponUUID - Coupon's being removed UUUID
 * @returns {void}
 */
function onRemoveCouponLineItem(lineItemCtnr, couponUUID) {
    const collections = require('*/cartridge/scripts/util/collections');
    const couponLineItem = collections.find(lineItemCtnr.couponLineItems, item => item.UUID === couponUUID);
    const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');

    if (!couponLineItem.couponCode.includes(LOYALTY_PREFIX)) {
        return;
    }

    const promoID = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotionID : '';
    const adjProductLineItems = [];
    collections.forEach(lineItemCtnr.getAllProductLineItems(), (item) => {
        if (!empty(item.getPriceAdjustmentByPromotionID(promoID))) {
            adjProductLineItems.push(item);
        }
    });

    const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    adjProductLineItems.forEach(product => cartHelper.removeProductFromCart(product.productID));
    this.rejectReward(couponLineItem.couponCode);
}

/**
 * Removes product and coupon that is applying promotion
 * @param {dw.order.LineItemCtnr} lineItemCtnr - Line item container
 * @param {string} productUUID - Product to be removed
 * @returns  {void}
 */
function onRemoveProductLineItem(lineItemCtnr, productUUID) {
    const collections = require('*/cartridge/scripts/util/collections');
    const productLineItem = collections.find(lineItemCtnr.getProductLineItems(), item => item.UUID === productUUID);

    if (empty(productLineItem)) {
        return;
    }

    const { LOYALTY_PREFIX } = require('*/cartridge/scripts/LoyaltyConstants');
    const couponsToDelete = [];

    collections.forEach(productLineItem.getPriceAdjustments(), (adj) => {
        const promoID = adj.promotionID;

        const coupon = collections.find(lineItemCtnr.couponLineItems, (item) => {
            return item.couponCode.includes(LOYALTY_PREFIX)
                && !empty(item.getPriceAdjustments())
                && item.getPriceAdjustments()[0].promotionID === promoID;
        });

        if (!empty(coupon)) {
            couponsToDelete.push(coupon);
        }
    });

    const Transaction = require('dw/system/Transaction');
    couponsToDelete.forEach((coupon) => {
        Transaction.begin();
        lineItemCtnr.removeCouponLineItem(coupon);
        Transaction.commit();
        this.rejectReward(coupon.couponCode);
    });
}

/**
 * Check if a reward is among the redeemed rewards
 * @param {Object} reward - available reward to be checked
 * @param {Array} redeemedRewards - collection of redeemed rewards
 * @returns {booolean} - if there is such redeemed reward
 */
function checkRewardRedeemed(reward, redeemedRewards) {
    const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    const filterByOnlineRewardsOnly = item => item.code && item.code.indexOf('LYLD') >= 0;

    if (empty(reward) || empty(redeemedRewards) || empty(currentBasket)) {
        return false;
    }

    // Find redeemed rewards which match the reward.rewardID, and are also in the current basket
    try {
        const redeemedReward = redeemedRewards
            .filter(filterByOnlineRewardsOnly)
            .find((rewardItem) => {
                return reward.rewardID === rewardItem.reward.rewardID && currentBasket.getCouponLineItem(rewardItem.code);
            });
        return !empty(redeemedReward);
    } catch (err) {
        Logger.error(err);
    }
    return false;
}

/**
 * Check if a reward is among the redeemed rewards
 * @param {dw.order.Basket} currentBasket - Basket to get currently applied coupon code
 */
function checkCustomerReconcile(currentBasket) {
    if (isLoyaltyEnabled() && isLoyalCustomer() && isRewardReconciliationEnabled()) {
        var currentCustomer = session.customer;
        if (!currentCustomer) {
            return;
        }

        var lastReconcileDate;
        try {
            lastReconcileDate = currentCustomer.profile.custom.loyaltyLastReconcileDate;
        } catch (e) {
            Logger.warn('Could not get "loyaltyLastReconcileDate" from customer.custom.profile.');
            return;
        }
        var currentDate = new Date();
        var differenceInTime = !empty(lastReconcileDate) ? currentDate.getTime() - lastReconcileDate.getTime() : 0;
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);
        if (empty(lastReconcileDate) || differenceInDays >= 30) {
            try {
                var rewards = this.validateClaimedRewards('COUPON_STATUS', 'REDEEMED');
                if (!empty(rewards) && !empty(rewards.redeemedRewards)) {
                    var appliedLoyaltyCouponCode = this.getLoyaltyCouponsFromLineItemCtnr(currentBasket);
                    if (!empty(appliedLoyaltyCouponCode)) {
                        rewards.redeemedRewards.forEach(rewardItem => {
                            const couponCode = rewardItem.code;
                            if (appliedLoyaltyCouponCode.find(appliedReward => appliedReward !== couponCode)) {
                                this.rejectReward(couponCode);
                            }
                        });
                    } else {
                        rewards.redeemedRewards.forEach(rewardItem => {
                            this.rejectReward(rewardItem.code);
                        });
                    }
                    const Transaction = require('dw/system/Transaction');
                    Transaction.begin();
                    currentCustomer.profile.custom.loyaltyLastReconcileDate = new Date();
                    Transaction.commit();
                }
            } catch (e) {
                Logger.error('Error while reconciling the loyalty points: {0}', e.message);
            }
        }
    }

    return;
}

/**
* appendLoyaltyUrl
* Updates view data with loyaltyUrl if the loyalty program is enabled
* and the current customer is enrolled into the loyalty program
* @param {Object} res object from contoller action
 */
function appendLoyaltyUrl(res) {
    if (isLoyaltyEnabled() && isLoyalCustomer()) {
        var viewData = res.getViewData();
        viewData.loyaltyUrl = getRewardsLockerURL();
        res.setViewData(viewData);
    }
}

/**
 * getLoyaltyPointsDescription
 * Create order confirmation loyalty points description string
 * @param {Object} order - confirmation page order
 * @returns {string} - points description string
 */
function getLoyaltyPointsDescription(order) {
    const Resource = require('dw/web/Resource');
    let result = Resource.msg('loyalty.earn.legal', 'loyalty', null);

    if (order.hasBopisItems && order.hasOnlyBopisItems) {
        result = Resource.msg('loyalty.earn.legal.bopis.only', 'loyalty', null);
    } else if (order.hasBopisItems) {
        result = Resource.msg('loyalty.earn.legal.bopis.mixed', 'loyalty', null);
    }

    return result;
}

module.exports = {
    isLoyaltyEnabled: isLoyaltyEnabled,
    isLoyaltyPilotEnabled: isLoyaltyPilotEnabled,
    isLoyalCustomer: isLoyalCustomer,
    isLoyaltyProduct: isLoyaltyProduct,
    isLoyaltyCategory: isLoyaltyCategory,
    updateBasketBallance: updateBasketBallance,
    getRewards: getRewards,
    isLoyaltyPilotZipCode: isLoyaltyPilotZipCode,
    getLoyaltyCouponsFromLineItemCtnr: getLoyaltyCouponsFromLineItemCtnr,
    enroll: enroll,
    estimate: estimate,
    getToken: getToken,
    updateCoupon: updateCoupon,
    redeemReward: redeemReward,
    rejectReward: rejectReward,
    updateCustomerProfileIntoLoyalty: updateCustomerProfileIntoLoyalty,
    onRemoveCouponLineItem: onRemoveCouponLineItem,
    onRemoveProductLineItem: onRemoveProductLineItem,
    getRewardsLockerURL: getRewardsLockerURL,
    checkRewardRedeemed: checkRewardRedeemed,
    appendLoyaltyUrl: appendLoyaltyUrl,
    getChannelDetails: getChannelDetails,
    isVIPCustomer: isVIPCustomer,
    getMarketingLandingContentID: getMarketingLandingContentID,
    removeInvalidLoyaltyCoupons: removeInvalidLoyaltyCoupons,
    getLoyaltyPointsDescription: getLoyaltyPointsDescription,
    checkCustomerReconcile: checkCustomerReconcile,
    validateClaimedRewards: validateClaimedRewards,
    canApplyLoyaltyCoupon: canApplyLoyaltyCoupon,
    getUATagMainCookieValue: getUATagMainCookieValue,
    getCampaignID: getCampaignID
};
