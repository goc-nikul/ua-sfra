'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const assert = require('chai').assert;
const Customer = require('../../../mocks/dw/dw_customer_Customer');
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
const sinon = require('sinon');
const Money = require('../../../mocks/dw/dw_value_Money');
const Order = require('../../../mocks/dw/dw_order_Order');
const { expect } = require('chai');
const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
const useLoyaltyConstants = require('../../../../cartridges/int_loyalty/cartridge/scripts/LoyaltyConstants.js');
const LoyaltySharedTestHelper = require('./loyaltySharedTestHelper');
const Product = require('../../../mocks/dw/dw_catalog_Product');
const { product } = require('../../../mocks/dw/dw_catalog_ProductMgr');

function UACAPIAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}

describe('int_loyalty/cartridge/scripts/helpers/rewardsHelper.js test', () => {
    global.empty = (data) => {
        return !data;
    };
    let rewardsHelper;
    let mockLoyaltyDataService;
    let mockLoyaltyServiceHelper;
    let lineItemCntr;

    beforeEach(() => {
        lineItemCntr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();
        mockLoyaltyDataService = {};
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true
                    };
                }
            };
        };
        mockLoyaltyServiceHelper = {
            getGraphQLParams: () => {
                return {};
            }
        };
        // Reset our helper before each test
        rewardsHelper = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/rewardsHelper', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/catalog/ProductMgr' : {
                getProduct: (productId) => {
                    var productObj = new Product(productId);
                    productObj.isProduct = function () {
                        return true;
                    };
                    productObj.isMaster = function () {
                        return false;
                    };
                    return productObj;
                }
            },
            '*/cartridge/scripts/cart/cartHelpers': {
                addProductToCart: (basket, productId, quantity, childProducts, selectedOptions, storeId, localRequest, isGiftItem, giftMessage, bypassMAOCheck) => {
                    return {
                        error: false,
                        message: 'Product added to cart',
                        uuid: 'testLoyaltUUID'
                    };
                },
                removeProductFromCart: (productToDelete) => {
                    if (empty(productToDelete)) {
                        return false;
                    }
                    return true;
                }
            },
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/loyaltyHelper': require('./loyaltySharedTestHelper'),
            '~/cartridge/scripts/services/loyaltyDataService': mockLoyaltyDataService,
            '~/cartridge/scripts/services/serviceHelper': mockLoyaltyServiceHelper,
            '~/cartridge/scripts/services/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/core/collections'),
            'dw/order/BasketMgr': {
                getCurrentOrNewBasket: () => {
                    return { lineItemCntr };
                },
                getCurrentBasket: () => {
                    return {
                        removeProductLineItem: () => {},
                        getAllProductLineItems: () => {
                            return {
                                toArray: () => [{
                                    UUID: '1234',
                                    productID: '1326799',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    },
                                    getPriceAdjustmentByPromotionID: function (promoID) {
                                        return {
                                            promotionID: 'LoyaltyTestPromo',
                                            basedOnCoupon: true,
                                            couponLineItem: {
                                                couponCode: promoID
                                            }
                                        };
                                    },
                                    getPriceAdjustments: () => {
                                        return {
                                            0: {
                                                promotionID: 'LoyaltyTestPromo',
                                                getUUID: function () {
                                                    return 1;
                                                },
                                                promotion: {
                                                    details: {
                                                        markup: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                                                    }
                                                }
                                            },
                                            size: function () {
                                                return 1;
                                            }
                                        };
                                    }
                                }, {
                                    UUID: '1235',
                                    productID: '1326798',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    },
                                    getPriceAdjustmentByPromotionID: function (promoID) {
                                        return {
                                            promotionID: 'LoyaltyTestPromo2',
                                            basedOnCoupon: true,
                                            couponLineItem: {
                                                couponCode: promoID
                                            }
                                        };
                                    },
                                    getPriceAdjustments: () => {
                                        return {
                                            0: {
                                                promotionID: 'LoyaltyTestPromo2',
                                                getUUID: function () {
                                                    return 1;
                                                },
                                                promotion: {
                                                    details: {
                                                        markup: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                                                    }
                                                }
                                            },
                                            size: function () {
                                                return 1;
                                            }
                                        };
                                    }
                                }]
                            };
                        },
                        getCouponLineItem: function (rewardItem) {
                            return {
                                code: rewardItem,
                                createdDate: '2022-07-15T13:55:11.000Z',
                                reward: {
                                    ctaURL: 'new-arrivals',
                                    imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/f4e7d80cfca3c9c782e7006b2b5039e0.jpg',
                                    name: 'UA Mens Gear | UA Sportstyle T-Shirt',
                                    points: 3125,
                                    posCode: '1326799',
                                    productID: '1326799',
                                    rewardCTA: 'Redeem',
                                    rewardFlowType: 'FREE_PRODUCT',
                                    rewardID: 8360,
                                    rewardType: 'BASE',
                                    subTitle1: 'UA Mens Gear',
                                    subTitle2: 'Light, comfy & super-soft',
                                    title: ' UA Sportstyle T-Shirt'
                                },
                                status: 'REDEEMED',
                                usedDate: null,
                                getPriceAdjustments: () => {
                                    return {
                                        0: {
                                            promotionID: 'LoyaltyTestPromo',
                                            getUUID: function () {
                                                return 1;
                                            },
                                            promotion: {
                                                details: {
                                                    markup: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
                                                }
                                            }
                                        },
                                        size: function () {
                                            return 1;
                                        }
                                    };
                                }
                            };
                        },
                        getCouponLineItems: function () {
                            return [{
                                code: 'LYLD-33KS-PR3N-LKFG-T3VC',
                                createdDate: '2022-07-15T13:55:11.000Z',
                                reward: {
                                    ctaURL: 'new-arrivals',
                                    imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/f4e7d80cfca3c9c782e7006b2b5039e0.jpg',
                                    name: 'UA Mens Gear | UA Sportstyle T-Shirt',
                                    points: 3125,
                                    posCode: '1326799',
                                    productID: '1326799',
                                    rewardCTA: 'Redeem',
                                    rewardFlowType: 'FREE_PRODUCT',
                                    rewardID: 8360,
                                    rewardType: 'BASE',
                                    subTitle1: 'UA Mens Gear',
                                    subTitle2: 'Light, comfy & super-soft',
                                    title: ' UA Sportstyle T-Shirt'
                                },
                                custom: {
                                    loyaltyRewardID: 8360
                                },
                                status: 'REDEEMED',
                                usedDate: null,
                                getPriceAdjustments: () => {
                                    return {
                                        0: {
                                            promotionID: 'LoyaltyTestPromo',
                                            getUUID: function () {
                                                return 1;
                                            }
                                        },
                                        size: function () {
                                            return 1;
                                        }
                                    };
                                }
                            }];
                        },
                        createCouponLineItem: function (couponCode, campaignBased) {
                            var c = {
                                promotion: { name: 'testPromo', calloutMsg: 'msg' },
                                couponCode: couponCode
                            };
                            return c;
                        },
                        removeCouponLineItem: function (basket, couponCode) {
                            // This could be mocked better
                            if (empty(couponCode)) {
                                return false;
                            }
                            return true;
                        },
                        custom: {
                            loyaltyPointsBalance: 0,
                            loyaltyPointsBalanceCheckDate: new Date(),
                            referenceCustomerNo: undefined
                        }
                    };
                }
            },
            'dw/campaign/CouponMgr': {
                getCouponByCode: function (couponCode) {
                    return {
                        coupon: couponCode,
                        enabled: true
                    };
                }
            },
            '*/cartridge/scripts/LoyaltyConstants': proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/LoyaltyConstants.js', {}),
            '*/cartridge/scripts/helpers/basketCalculationHelpers': {
                calculateTotals: function () {}
            }
        });
    });

    it('getRewards() dollarOffReward().isValid() Estimates basket loyalty points balance and totals', () => {
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: null,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '193444423013'
                            }],
                            rewardsRejected: false
                        }
                    };
                }
            };
        };

        let params = {
            rewardId: 8366,
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.ONLINE_DOLLAR_OFF
        };
        // Call the function0
        let dollarOffRewardObj = rewardsHelper.getReward(params);
        assert.isTrue(dollarOffRewardObj.isValid());
    });

    it('getRewards() dollarOffReward().redeem() Estimates basket loyalty points balance and totals', () => {
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: 8000,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '193444423013'
                            }],
                            rewardsRejected: false
                        }
                    };
                }
            };
        };

        LoyaltySharedTestHelper.setGraphQLSpy({
            ok: true,
            error: 0,
            errorMessage: null,
            mockResult: false,
            object: {
                balance: 0,
                coupon: 'TEST-1234-1234',
                couponUpdated: false,
                customerUpdated: false,
                enrolled: null,
                error: undefined,
                estimatedPoints: 270,
                loyaltyID: null,
                products: [{
                    points: 270,
                    productID: '193444423013'
                }],
                rewardRejected: true
            },
            rewards: []
        });

        let params = {
            rewardId: 8366,
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.ONLINE_DOLLAR_OFF
        };
        // Call the function0
        let dollarOffRewardObj = rewardsHelper.getReward(params);
        assert.isTrue(dollarOffRewardObj.redeem());
    });

    it('getRewards() dollarOffReward().reject() Estimates basket loyalty points balance and totals', () => {
        var hold = LoyaltySharedTestHelper.rejectReward;
        LoyaltySharedTestHelper.rejectReward = LoyaltySharedTestHelper.reject;

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: 8000,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '193444423013'
                            }],
                            rewardRejected: false
                        }
                    };
                }
            };
        };
        LoyaltySharedTestHelper.setGraphQLSpy({
            ok: true,
            error: 0,
            errorMessage: null,
            mockResult: false,
            object: {
                balance: 8000,
                claimedRewards: {},
                coupon: null,
                couponUpdated: false,
                customerUpdated: false,
                enrolled: null,
                error: undefined,
                estimatedPoints: 270,
                loyaltyID: null,
                products: [{
                    points: 270,
                    productID: '193444423013'
                }],
                rewardRejected: true
            }
        });

        let params = {
            rewardId: 8366,
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.ONLINE_DOLLAR_OFF
        };
        // Call the function0
        let dollarOffRewardObj = rewardsHelper.getReward(params);
        LoyaltySharedTestHelper.rejectReward = hold;

        assert.isTrue(dollarOffRewardObj.reject());
    });

    it('getRewards() dollarOffReward().removeAndReject', () => {
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: 8000,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '193444423013'
                            }],
                            rewardsRejected: false
                        }
                    };
                }
            };
        };

        LoyaltySharedTestHelper.setGraphQLSpy({
            ok: true,
            error: 0,
            errorMessage: null,
            mockResult: false,
            object: {
                balance: 0,
                coupon: 'TEST-1234-1234',
                couponUpdated: false,
                customerUpdated: false,
                enrolled: null,
                error: undefined,
                estimatedPoints: 270,
                loyaltyID: null,
                products: [{
                    points: 270,
                    productID: '193444423013'
                }],
                rewardRejected: true
            },
            rewards: []
        });

        let params = {
            rewardId: 8366,
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.ONLINE_DOLLAR_OFF
        };
        // Call the function0
        let dollarOffRewardObj = rewardsHelper.getReward(params);
        assert.isTrue(dollarOffRewardObj.removeAndReject());
    });

    it('getRewards() freeProductReward().isValid() Estimates basket loyalty points balance and totals', () => {
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: null,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '193444423013'
                            }],
                            rewardsRejected: false
                        }
                    };
                }
            };
        };

        let params = {
            rewardId: 8366,
            productId: '193444423013',
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.FREE_PRODUCT
        };
        // Call the function0
        let freeProductRewardObj = rewardsHelper.getReward(params);
        assert.isTrue(freeProductRewardObj.isValid());
    });

    it('getRewards() freeProductReward().redeem() Estimates basket loyalty points balance and totals', () => {
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: 8000,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '193444423013'
                            }],
                            rewardsRejected: false
                        }
                    };
                }
            };
        };

        LoyaltySharedTestHelper.setGraphQLSpy({
            ok: true,
            error: 0,
            errorMessage: null,
            mockResult: false,
            object: {
                balance: 0,
                coupon: 'TEST-1234-1234',
                couponUpdated: false,
                customerUpdated: false,
                enrolled: null,
                error: undefined,
                estimatedPoints: 270,
                loyaltyID: null,
                products: [{
                    points: 270,
                    productID: '193444423013'
                }],
                rewardRejected: true
            },
            rewards: []
        });

        let params = {
            rewardId: 8366,
            productId: '193444423013',
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.FREE_PRODUCT
        };
        // Call the function0
        let freeProductRewardObj = rewardsHelper.getReward(params);
        assert.isTrue(freeProductRewardObj.redeem());
    });

    it('getRewards() freeProductReward().reject() Estimates basket loyalty points balance and totals', () => {
        var hold = LoyaltySharedTestHelper.rejectReward;
        LoyaltySharedTestHelper.rejectReward = LoyaltySharedTestHelper.reject;

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: 8000,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '193444423013'
                            }],
                            rewardRejected: false
                        }
                    };
                }
            };
        };
        LoyaltySharedTestHelper.setGraphQLSpy({
            ok: true,
            error: 0,
            errorMessage: null,
            mockResult: false,
            object: {
                balance: 8000,
                claimedRewards: {},
                coupon: null,
                couponUpdated: false,
                customerUpdated: false,
                enrolled: null,
                error: undefined,
                estimatedPoints: 270,
                loyaltyID: null,
                products: [{
                    points: 270,
                    productID: '193444423013'
                }],
                rewardRejected: true
            }
        });

        let params = {
            rewardId: 8366,
            productId: '193444423013',
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.FREE_PRODUCT
        };
        // Call the function0
        let freeProductRewardObj = rewardsHelper.getReward(params);
        LoyaltySharedTestHelper.rejectReward = hold;

        assert.isTrue(freeProductRewardObj.reject());
    });

    it('getRewards() freeProductReward().removeAndReject', () => {
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        error: 0,
                        errorMessage: null,
                        mockResult: false,
                        object: {
                            balance: 8000,
                            claimedRewards: {},
                            coupon: null,
                            couponUpdated: false,
                            customerUpdated: false,
                            enrolled: null,
                            error: undefined,
                            estimatedPoints: 270,
                            loyaltyID: null,
                            products: [{
                                points: 270,
                                productID: '1326799'
                            }],
                            rewardsRejected: false
                        }
                    };
                }
            };
        };

        LoyaltySharedTestHelper.setGraphQLSpy({
            ok: true,
            error: 0,
            errorMessage: null,
            mockResult: false,
            object: {
                balance: 0,
                coupon: 'TEST-1234-1234',
                couponUpdated: false,
                customerUpdated: false,
                enrolled: null,
                error: undefined,
                estimatedPoints: 270,
                loyaltyID: null,
                products: [{
                    points: 270,
                    productID: '1326799'
                }],
                rewardRejected: true
            },
            rewards: []
        });

        let params = {
            rewardId: 8360,
            productId: '1326799',
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.FREE_PRODUCT
        };
        // Call the function0
        let freeProductRewardObj = rewardsHelper.getReward(params);
        assert.isTrue(freeProductRewardObj.removeAndReject());
    });

    it('getRewards() Wrong Reward Flow Type Throws Error', () => {
        let params = {
            rewardId: 8360,
            productId: '1326799',
            rewardFlowType: useLoyaltyConstants.LOYALTY_REWARD_FLOW_TYPE.ATHLETE_ASSESSMENT
        };
        // Call the function0
        const REWARD_INVALID_FLOW_TYPE_ERROR = 'REWARD_INVALID_FLOW_TYPE_ERROR';
        try {
            rewardsHelper.getReward(params);
        } catch (error) {
            expect(error.message).to.equal(REWARD_INVALID_FLOW_TYPE_ERROR);
        }
    });
});
