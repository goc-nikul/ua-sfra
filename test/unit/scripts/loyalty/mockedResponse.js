'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const { expect } = require('chai');
const sinon = require('sinon');

describe('int_loyalty/cartridge/scripts/services/mockedResponse.js TEST', () => {
    global.empty = (data) => {
        return !data;
    };

    let mockedResponseHelper;
    beforeEach(() => {
        mockedResponseHelper = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/services/mockedResponse', {
        });
    });

    it('enrollmentOptions', () => {
        var expectedResult = {
            enrollCustomerIntoLoyalty: {
                clientMutationId: '',
                viewer: null,
                loyalty: {
                    ID: '150451813',
                    status: 'ENROLLED',
                    statusDate: '2022-05-23T21:07:47.000Z'
                }
            }
        };
        var result = mockedResponseHelper.enrollmentOptions;
        assert.isDefined(result.successFullResponse, 'successFullResponse is not defined');
        assert.isNotNull(result.successFullResponse.data, 'successFullResponse.data is null');
        assert.deepEqual(result.successFullResponse.data, expectedResult);
    });

    it('estimationPoints', () => {
        var expectedResult = {
            estimateLoyaltyPoints: {
                success: true,
                event: {
                    estimatedPoints: 171,
                    products: [
                        {
                            points: 330.04,
                            productID: 887907588097
                        },
                        {
                            points: 72,
                            productID: 191169632109
                        }
                    ]
                }
            }
        };
        var result = mockedResponseHelper.estimationPoints;
        assert.isDefined(result.estimationPointsWithoutError, 'estimationPointsWithoutError is not defined');
        assert.isNotNull(result.estimationPointsWithoutError.data, 'estimationPointsWithoutError.data is null');
        assert.deepEqual(result.estimationPointsWithoutError.data, expectedResult);
    });

    it('confirmedPoints', () => {
        var expectedResult = {
            getLoyaltyPointsData: {
                success: true,
                loyaltyPointsBalance: 5000
            },
            estimateLoyaltyPoints: {
                success: true,
                event: {
                    estimatedPoints: 171
                }
            }
        };
        var result = mockedResponseHelper.confirmedPoints;
        assert.isDefined(result.successfulResponse, 'successfulResponse is not defined');
        assert.isNotNull(result.successfulResponse.data, 'successfulResponse.data is null');
        assert.deepEqual(result.successfulResponse.data, expectedResult);
    });

    it('rewards', () => {
        var expectedResult = {
            availableRewardsToClaim: {
                success: true,
                rewardGroups: [{
                    id: '561',
                    name: 'Checkout Wins',
                    displayOnPages: ['MINI_HUB', 'MY_REWARDS_LOCKER', 'UA_REWARDS_GRID'],
                    rewards: [{
                        rewardID: 'LYLD-A78AZ778',
                        subTitle1: 'UA.com',
                        title: '$5 Off',
                        subTitle2: 'Any purchase on UA.com',
                        points: 625,
                        pointsDeficit: 0,
                        rewardFlowType: 'ONLINE_DOLLAR_OFF',
                        imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/d38ecdba7154f2010f9e927804931107.png',
                        productID: ''
                    },
                    {
                        rewardID: '8295',
                        subTitle1: 'UA.com',
                        title: '$10 Off',
                        subTitle2: 'Any purchase on UA.com',
                        points: 1250,
                        pointsDeficit: 0,
                        rewardFlowType: 'ONLINE_DOLLAR_OFF',
                        imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/c86ab273f6de038c88db460bef790936.png',
                        productID: ''
                    },
                    {
                        rewardID: '8296',
                        subTitle1: '',
                        title: '$20 online certificate',
                        subTitle2: '',
                        points: 2500,
                        pointsDeficit: 500,
                        rewardFlowType: 'ONLINE_DOLLAR_OFF',
                        imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/1b0ee41cd6a7a7d2ad09b44680761ebc.png',
                        productID: ''
                    }]
                },
                {
                    id: '567',
                    name: 'UA Mens Gear',
                    displayOnPages: ['MINI_HUB', 'MY_REWARDS_LOCKER', 'UA_REWARDS_GRID'],
                    rewards: [{
                        rewardID: 'LYLD-G5FF-VGZ7-WCWG-52GM',
                        subTitle1: 'UA Mens Gear',
                        title: 'UA Sportstyle T-shirt',
                        subTitle2: '',
                        points: 3125,
                        pointsDeficit: 0,
                        rewardFlowType: 'FREE_PRODUCT',
                        imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/721f23aea95ac3ab2f8d63db3b7ca818.png',
                        productID: '192811199902'
                    },
                    {
                        rewardID: '8361',
                        subTitle1: 'UA Mens Gear',
                        title: 'UA Meridian T-shirt',
                        subTitle2: '',
                        points: 7500,
                        pointsDeficit: 1500,
                        rewardFlowType: 'FREE_PRODUCT',
                        imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/5a1819032cefb4c20a5ac90eebfb41f5.png',
                        productID: '1373728'
                    }]
                }]
            },
            claimedRewards: {
                success: true,
                coupon: [{
                    status: 'REDEEMED',
                    code: 'LYLD-A78AZ778',
                    reward: {
                        rewardID: 8294
                    }
                }, {
                    status: 'USED',
                    code: 'LYLD-A78AZ774',
                    reward: {
                        rewardID: 8291
                    }
                }, {
                    status: 'REDEEMED',
                    code: 'LYLD-A78AZ775',
                    reward: {
                        rewardID: 8295
                    }
                }]
            },
            getLoyaltyPointsData: {
                success: true,
                loyaltyPointsBalance: 5000
            }
        };
        var result = mockedResponseHelper.rewards;
        assert.isDefined(result.successfulResponse, 'successfulResponse is not defined');
        assert.isNotNull(result.successfulResponse.data, 'successfulResponse.data is null');
        assert.deepEqual(result.successfulResponse.data, expectedResult);
    });

    it('redeemReward', () => {
        var expectedResult = {
            claimDiscountCouponWithRewardPoints: {
                success: true,
                couponClaimEvent: {
                    id: '3022024',
                    rewardID: 8291,
                    points: 625,
                    rewardType: 'BASE',
                    coupon: {
                        status: 'REDEEMED',
                        code: 'LYLD-G5FF-VGZ7-WCWG-52GM'
                    }
                }
            }
        };
        var result = mockedResponseHelper.redeemReward;
        assert.isDefined(result.successfulResponse, 'successfulResponse is not defined');
        assert.isNotNull(result.successfulResponse.data, 'successfulResponse.data is null');
        assert.deepEqual(result.successfulResponse.data, expectedResult);
    });

    it('rejectEvent', () => {
        var expectedResult = {
            rejectRedeemedRewardEvent: {
                success: true
            }
        };
        var result = mockedResponseHelper.rejectEvent;
        assert.isDefined(result.successfulResponse, 'successfulResponse is not defined');
        assert.isNotNull(result.successfulResponse.data, 'successfulResponse.data is null');
        assert.deepEqual(result.successfulResponse.data, expectedResult);
    });

    it('updateCouponCode', () => {
        var expectedResult = {
            coupon1: {
                success: true
            },
            coupon2: {
                success: true
            }
        };
        var result = mockedResponseHelper.updateCouponCode;
        assert.isDefined(result.couponStatusWithoutError, 'couponStatusWithoutError is not defined');
        assert.isNotNull(result.couponStatusWithoutError.data, 'couponStatusWithoutError.data is null');
        assert.deepEqual(result.couponStatusWithoutError.data, expectedResult);
    });

    it('updateCustomerProfileIntoLoyalty', () => {
        var expectedResult = {
            updateCustomerProfileIntoLoyalty: {
                success: true
            }
        };
        var result = mockedResponseHelper.updateCustomerProfileIntoLoyalty;
        assert.isDefined(result.successfulResponse, 'successfulResponse is not defined');
        assert.isNotNull(result.successfulResponse.data, 'successfulResponse.data is null');
        assert.deepEqual(result.successfulResponse.data, expectedResult);
    });
});
