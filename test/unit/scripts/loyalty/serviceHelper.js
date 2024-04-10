'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const { expect } = require('chai');
const sinon = require('sinon');

describe('int_loyalty/cartridge/scripts/services/serviceHelper.js TEST', () => {
    global.empty = (data) => {
        return !data;
    };

    let loyaltyServiceHelper;
    beforeEach(() => {
        global.customer = {
            profile: {
                customerNo: 'LOYALTY Service Helper'
            },
            isAuthenticated: () => {
                return true;
            }
        };

        global.session = {
            custom: {
                customerCountry: 'US'
            },
            sessionID: {
                toString: function () {
                    return '10000011101110';
                }
            }
        };

        loyaltyServiceHelper = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/services/serviceHelper', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '*/cartridge/scripts/helpers/ObjectsHelper': require('../../../../cartridges/app_ua_core/cartridge/scripts/helpers/ObjectsHelper')
        });
    });

    it('Loyalty serviceHelper.js getUACAPITokenServiceRequest', () => {
        var expectedResult = {
            client_id: 'ONDWXtzzKcz9DymMB8WJyTllmMTXKb0w',
            client_secret: 'I0dFkkETUjn9JV4fdUW6IWfbKqKdMwhFR1flXJ-SAJpZebsEI3iySxlSjgs29L8t',
            grant_type: 'client_credentials',
            audience: 'https://commerce.api.ua.com'
        };
        var result = loyaltyServiceHelper.getUACAPITokenServiceRequest();
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(enrollment) no params', () => {
        var expectedResult = {
            input: {
                clientMutationId: '',
                customerNo: 'LOYALTY Service Helper'
            }
        };
        var requestType = 'enrollment';
        var params = {};
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(enrollment) with Channel', () => {
        var expectedResult = {
            input: {
                clientMutationId: '',
                customerNo: 'LOYALTY Service Helper',
                channel: 'Test Channel'
            }
        };
        var requestType = 'enrollment';
        var params = {
            channel: 'Test Channel'
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(enrollment) with Channel and SubChannel', () => {
        var expectedResult = {
            input: {
                clientMutationId: '',
                customerNo: 'LOYALTY Service Helper',
                channel: 'Test Channel',
                subChannel: 'Test SubChannel'
            }
        };
        var requestType = 'enrollment';
        var params = {
            channel: 'Test Channel',
            subChannel: 'Test SubChannel'
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(enrollment) with Channel,SubChannel and subChannelDetail', () => {
        var expectedResult = {
            input: {
                clientMutationId: '',
                customerNo: 'LOYALTY Service Helper',
                channel: 'Test Channel',
                subChannel: 'Test SubChannel',
                subChannelDetail: 'Test SubChannel Detail'
            }
        };
        var requestType = 'enrollment';
        var params = {
            channel: 'Test Channel',
            subChannel: 'Test SubChannel',
            subChannelDetail: 'Test SubChannel Detail'
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(estimation)', () => {
        var expectedResult = {
            input: {
                customerNo: 'LOYALTY Service Helper',
                event: {
                    type: 'purchase',
                    products: [{
                        categories: 'TestLoyaltyCategory',
                        price: 1,
                        productID: 'LoyaltyTestItemEstimate',
                        quantity: 1
                    }],
                    value: 79.99
                }
            }
        };
        var requestType = 'estimation';
        var params = {
            adjustedMerchandizeTotalPrice: {
                value: 79.99
            },
            getAllProductLineItems: function () {
                return [{
                    productID: 'LoyaltyTestItemEstimate',
                    categoryID: 'TestLoyaltyCategory',
                    quantity: {
                        value: 1
                    },
                    getQuantityValue: function () {
                        return 1;
                    },
                    getProratedPrice: function () {
                        return {
                            divide: function () {
                                return {
                                    divide: function () {
                                        return {
                                            multiply: function () {
                                                return {
                                                    toNumberString: function () {
                                                        return 1;
                                                    }
                                                };
                                            }
                                        };
                                    },
                                    multiply: function () {
                                        return {
                                            toNumberString: function () {
                                                return 1;
                                            }
                                        };
                                    },
                                    toNumberString: function () {
                                        return 1;
                                    },
                                    getDecimalValue: function () {
                                        return {
                                            get: function () {
                                                return 1.00;
                                            }
                                        };
                                    }
                                };
                            },
                            toNumberString: function () {
                                return 1;
                            },
                            getValue: function () {
                                return 1;
                            },
                            get: function () {
                                return 1.00;
                            }
                        };
                    }
                }];
            }
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(confirmedPoints)', () => {
        var expectedResult = {
            input1: {
                customerNo: 'LOYALTY Service Helper'
            },
            input2: {
                customerNo: 'LOYALTY Service Helper',
                event: {
                    type: 'purchase',
                    products: [{
                        categories: 'TestLoyaltyCategory',
                        price: 1,
                        productID: 'LoyaltyTestItemEstimate',
                        quantity: 1
                    }],
                    value: 79.99
                }
            }
        };
        var requestType = 'confirmedPoints';
        var params = {
            adjustedMerchandizeTotalPrice: {
                value: 79.99
            },
            getAllProductLineItems: function () {
                return [{
                    productID: 'LoyaltyTestItemEstimate',
                    categoryID: 'TestLoyaltyCategory',
                    quantity: {
                        value: 1
                    },
                    getQuantityValue: function () {
                        return 1;
                    },
                    getProratedPrice: function () {
                        return {
                            divide: function () {
                                return {
                                    divide: function () {
                                        return {
                                            multiply: function () {
                                                return {
                                                    toNumberString: function () {
                                                        return 1;
                                                    }
                                                };
                                            }
                                        };
                                    },
                                    multiply: function () {
                                        return {
                                            toNumberString: function () {
                                                return 1;
                                            }
                                        };
                                    },
                                    toNumberString: function () {
                                        return 1;
                                    },
                                    getDecimalValue: function () {
                                        return {
                                            get: function () {
                                                return 1.00;
                                            }
                                        };
                                    }
                                };
                            },
                            toNumberString: function () {
                                return 1;
                            },
                            getValue: function () {
                                return 1;
                            },
                            get: function () {
                                return 1.00;
                            }
                        };
                    }
                }];
            }
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        console.log(result);
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(updateCoupon)', () => {
        var expectedResult = {
            input1: {
                clientMutationId: '',
                coupon: {
                    code: {
                        code: 'TEST_CODE',
                        status: 'REDEEM'
                    },
                    status: 'USED'
                },
                customerNo: 'LOYALTY Service Helper'
            }
        };
        var requestType = 'updateCoupon';
        var params = {
            customerNo: 'LOYALTY Service Helper',
            loyaltyCoupons: [
                {
                    code: 'TEST_CODE',
                    status: 'REDEEM'
                }
            ]
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(updateCoupon)', () => {
        var requestType = 'redeemReward';
        var params = 8360;
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.isDefined(result, 'redeemReward result is defined');
        assert.equal(result.input.customerNo, 'LOYALTY Service Helper');
        assert.equal(result.input.rewardId, 8360);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(rejectEvent)', () => {
        var expectedResult = {
            input: {
                customerNo: 'LOYALTY Service Helper',
                clientMutationId: '',
                redeemedRewardEvent: {
                    eventType: 'REWARD',
                    couponCode: 'REWARD_Coupon_Code'
                }
            }
        };
        var requestType = 'rejectEvent';
        var params = 'REWARD_Coupon_Code';
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.isDefined(result.input, 'result.input object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(rewards)', () => {
        var expectedResult = {
            input1: {
                customerNo: 'LOYALTY Service Helper'
            },
            input2: {
                customerNo: 'LOYALTY Service Helper',
                filterType: 'COUPON_STATUS',
                filterParam: 'REDEEMED'
            },
            input3: {
                customerNo: 'LOYALTY Service Helper'
            }
        };
        var requestType = 'rewards';
        var params = null;
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.isDefined(result.input1, 'result.input1 object is defined');
        assert.isDefined(result.input2, 'result.input2 object is defined');
        assert.isDefined(result.input3, 'result.input3 object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(claimedRewards)', () => {
        var expectedResult = {
            input: {
                customerNo: 'LOYALTY Service Helper',
                filterType: 'COUPON_STATUS',
                filterParam: 'REDEEMED'
            }
        };
        var requestType = 'claimedRewards';
        var params = {
            filterType: 'COUPON_STATUS',
            filterParam: 'REDEEMED'
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.isDefined(result.input, 'result.input object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(updateCustomerProfileIntoLoyalty)', () => {
        var expectedResult = {
            input: {
                clientMutationId: '',
                customerNo: 'LOYALTY Service Helper',
                profile: {
                    firstName: 'First',
                    lastName: 'Loyalty',
                    birthday: {
                        day: 18,
                        month: 5
                    }
                }
            }
        };
        var requestType = 'updateCustomerProfileIntoLoyalty';
        var params = {
            firstName: 'First',
            lastName: 'Loyalty',
            birthday: {
                birthMonth: 5,
                birthDay: 18
            }
        };
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.isDefined(result.input, 'result.input object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLParams(default)', () => {
        var expectedResult = {};
        var requestType = 'miscellaneousLoyaltyFunction';
        var params = null;
        var referenceCustomerNo = undefined;
        var result = loyaltyServiceHelper.getGraphQLParams(requestType, params, referenceCustomerNo);
        assert.isDefined(result, 'result object is defined');
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(enrollment)', () => {
        var expectedResult = {
            variables: {},
            query: 'mutation enrollCustomerIntoLoyalty ( $input : EnrollCustomerIntoLoyaltyInput!) { enrollCustomerIntoLoyalty(input: $input) { clientMutationId viewer { ... on RegisteredCustomer { id } } loyalty { ID status statusDate }}}'
        };
        var requestType = 'enrollment';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(estimation)', () => {
        var expectedResult = {
            variables: {},
            query: 'query estimateLoyaltyPoints($input: EstimateLoyaltyPointsInput!) { estimateLoyaltyPoints(input: $input) { success messages { message } event { estimatedPoints products { points productID } } } }'
        };
        var requestType = 'estimation';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(confirmedPoints)', () => {
        var expectedResult = {
            variables: {},
            query: 'query ($input1: LoyaltyPointsInput!, $input2: EstimateLoyaltyPointsInput!) { getLoyaltyPointsData(input: $input1) { success loyaltyPointsBalance } estimateLoyaltyPoints(input: $input2) { success messages { message } event { estimatedPoints } } }'
        };
        var requestType = 'confirmedPoints';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(updateCoupon)', () => {
        var expectedResult = {
            variables: {},
            query: 'mutation ($input1: LoyaltyCouponStatusUpdateInput!) { coupon1: updateLoyaltyCouponStatus(input: $input1) { success messages { message } } }'
        };
        var requestType = 'updateCoupon';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(redeemReward)', () => {
        var expectedResult = {
            variables: {},
            query: 'mutation claimDiscountCouponWithRewardPoints($input: LoyaltyClaimDiscountCouponInput!) { claimDiscountCouponWithRewardPoints(input: $input) { success messages { message type } couponClaimEvent { id rewardID name description imageUrl points rewardType coupon {code status} } } }'
        };
        var requestType = 'redeemReward';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(rejectEvent)', () => {
        var expectedResult = {
            variables: {},
            query: 'mutation rejectRedeemedRewardEvent($input: RejectRedeemedRewardEventInput!) { rejectRedeemedRewardEvent (input: $input) { success messages { message } clientMutationId } }'
        };
        var requestType = 'rejectEvent';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(rewards)', () => {
        var expectedResult = {
            variables: {},
            query: 'query ($input1: LoyaltyAvailableRewardsToClaimInput!, $input2: LoyaltyClaimedRewardsInput!, $input3: LoyaltyPointsInput!) { availableRewardsToClaim(input: $input1) { success rewardGroups (displayOnPages: [MINI_HUB]){ name displayName displayOnPages rewards (rewardRefinement: {redeemable: true, rewardFlowTypes: [ONLINE_DOLLAR_OFF, FREE_PRODUCT] }) { rewardID name subTitle1 title subTitle2 rewardCTA imageUrl points status rewardType rewardFlowType productID ctaURL visible pointsDeficit } } } claimedRewards(input: $input2) { success coupon { code status createdDate usedDate reward { rewardID name subTitle1 title subTitle2 rewardCTA imageUrl points posCode rewardType rewardFlowType productID ctaURL} } } getLoyaltyPointsData (input: $input3) { success loyaltyPointsBalance } }'
        };
        var requestType = 'rewards';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(claimedRewards)', () => {
        var expectedResult = {
            variables: {},
            query: 'query ($input: LoyaltyClaimedRewardsInput!) { claimedRewards(input: $input) { success coupon { code status createdDate usedDate reward { rewardID name subTitle1 title subTitle2 rewardCTA imageUrl points posCode rewardType rewardFlowType productID ctaURL} } } }'
        };
        var requestType = 'claimedRewards';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(updateCustomerProfileIntoLoyalty)', () => {
        var expectedResult = {
            variables: {},
            query: 'mutation updateCustomerProfileIntoLoyalty($input: UpdateCustomerProfileInput!){ updateCustomerProfileIntoLoyalty(input: $input) { success messages { type message } } }'
        };
        var requestType = 'updateCustomerProfileIntoLoyalty';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getGraphQLRequest(default)', () => {
        var expectedResult = {
            variables: {},
            query: ''
        };
        var requestType = 'miscellaneousCall';
        var params = {};
        var numberOfCoupons = 1;
        var result = loyaltyServiceHelper.getGraphQLRequest(requestType, params, numberOfCoupons);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(enrollment)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'enrollment';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(estimation)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'estimation';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(confirmedPoints)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'confirmedPoints';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(rewards)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'rewards';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(redeemReward)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'redeemReward';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(rejectEvent)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'rejectEvent';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(updateCoupon)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'updateCoupon';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(updateCustomerProfileIntoLoyalty)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'updateCustomerProfileIntoLoyalty';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPIResponse(default)', () => {
        var expectedResult = {
            statusCode: 200,
            statusMessage: 'Success'
        };
        var requestType = 'miscellaneousLoyaltyCall';
        var result = loyaltyServiceHelper.getMockedUACAPIResponse(requestType);
        assert.isDefined(result, 'result object is defined');
        assert.isDefined(result.text, 'result.text is defined');
        assert.equal(result.statusCode, expectedResult.statusCode);
        assert.equal(result.statusMessage, expectedResult.statusMessage);
    });

    it('Loyalty serviceHelper.js getMockedUACAPITokenResponse()', () => {
        var expectedResult = {
            accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik5ESXlRVVl3TmpGRlJrRTFOVFUzUTBNek56TXlNVVkzT0RBMFFVUkVNemd6UVRrNE9EUXdRdyJ9.eyJzdWIiOiJ7XCJzaXRlXCI6XCJVU1wiLFwiZ3Vlc3RcIjp0cnVlfSIsImV4cCI6MTY0NDU5MTE3NCwiaWF0IjoxNjQzOTg2Mzc0LCJhdWQiOiJodHRwczovL2NvbW1lcmNlLmFwaS51YS5jb20iLCJpc3MiOiJodHRwczovL2FwaS1pbnRlZ3JhdGlvbi5lY20tZXh0ZXJuYWwudXMudWEuZGV2LyIsImp0aSI6IjQ2MDU1YzIyMDUwODg2MjlhY2E0YjRkM2I2NzI3MWU0In0.zzJuPUcGEbOauTBwB3el0l-3qkaBzHnXcO_i_9p5x352Dc_Ynn1DlQgEzFyYjUUGLO-6BME7X-TuuoDO2Hi0SBYVXvxhByHV3S9c4bSZ7ba6v9Ph-amGPbxuoODADv9Av6Uzd4z8I2tOnnEJtpSBatP0kZ3HQqYIGFuderBYso9ueXTG1PJ-VRyZF9IaDTl_qKZqxXeUIS3kPSe_xr_1b0nCro3U9qlI1Us8mdPh0lFyF-2foJEFFiSTpsFH6H0DVbBBa-z80OPWeko6fO-tMvSgaRKzI9flfL9w1q2Ao2EFJWBP-NnU-Oq897n_UXVP8qcKUG5s4rKt3T47Ncbnxg',
            expiresAt: '2022-09-11T14:52:54.000Z',
            _links: {
                self: {
                    href: '/auth'
                },
                passwordReset: {
                    href: 'https://development-us.sfcc.ua-ecm.com/en-us/setpassword?token='
                }
            }
        };
        var result = loyaltyServiceHelper.getMockedUACAPITokenResponse();
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse() statusCode 500', () => {
        var expectedResult = {
            estimatedPoints: null,
            enrolled: null,
            loyaltyID: null,
            errorMessage: null,
            error: null,
            balance: null,
            rewards: [],
            coupon: null,
            couponUpdated: false,
            rewardRejected: false,
            customerUpdated: false,
            claimedRewards: []
        };
        let svc = {};
        let responseObj = {
            statusCode: 500,
            text: '{"data":{"estimateLoyaltyPoints":{"success":true,"messages":[{"message":"Retrieved estimate points details successfully"}],"event":{"estimatedPoints":270,"products":[{"points":270,"productID":"193444423013"}]}}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse(estimateLoyaltyPoints) statusCode 200', () => {
        var expectedResult = {
            estimatedPoints: 270,
            enrolled: null,
            loyaltyID: null,
            errorMessage: '',
            error: undefined,
            balance: null,
            rewards: [],
            coupon: null,
            couponUpdated: false,
            rewardRejected: false,
            customerUpdated: false,
            claimedRewards: [],
            products: [{
                points: 270,
                productID: '193444423013'
            }]
        };
        let svc = {};
        let responseObj = {
            statusCode: 200,
            text: '{"data":{"estimateLoyaltyPoints":{"success":true,"messages":[{"message":"Retrieved estimate points details successfully"}],"event":{"estimatedPoints":270,"products":[{"points":270,"productID":"193444423013"}]}}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse(enrollCustomerIntoLoyalty) statusCode 200', () => {
        var expectedResult = {
            estimatedPoints: null,
            enrolled: true,
            loyaltyID: 'TestLoyaltyUserID',
            errorMessage: '',
            error: undefined,
            balance: null,
            rewards: [],
            coupon: null,
            couponUpdated: false,
            rewardRejected: false,
            customerUpdated: false,
            claimedRewards: []
        };
        let svc = {};
        let responseObj = {
            statusCode: 200,
            text: '{"data":{"enrollCustomerIntoLoyalty":{"loyalty":{"status":"ENROLLED","ID":"TestLoyaltyUserID"}}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse(getLoyaltyPointsData) statusCode 200', () => {
        var expectedResult = {
            estimatedPoints: null,
            enrolled: null,
            loyaltyID: null,
            errorMessage: '',
            error: undefined,
            balance: 2500,
            rewards: [],
            coupon: null,
            couponUpdated: false,
            rewardRejected: false,
            customerUpdated: false,
            claimedRewards: []
        };
        let svc = {};
        let responseObj = {
            statusCode: 200,
            text: '{"data":{"getLoyaltyPointsData":{"success":true,"loyaltyPointsBalance":2500}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse(availableRewardsToClaim) statusCode 200', () => {
        var expectedResult = {
            estimatedPoints: null,
            enrolled: null,
            loyaltyID: null,
            errorMessage: '',
            error: undefined,
            balance: 21618,
            rewards: [{
                rewardID: 8294,
                name: 'UA.com | $5 Off Reward',
                subTitle1: 'UA.com ',
                title: ' $5 Off Reward',
                subTitle2: 'Apply to any UA.com purchase ',
                rewardCTA: ' Redeem',
                imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/d5dce52e76cf5da2271835aec5408afb.jpeg',
                points: 625,
                status: true,
                rewardType: 'BASE',
                rewardFlowType: 'ONLINE_DOLLAR_OFF',
                productID: 'new-arrivals',
                ctaURL: 'new-arrivals',
                visible: true,
                pointsDeficit: 0
            }],
            coupon: null,
            couponUpdated: false,
            rewardRejected: false,
            customerUpdated: false,
            claimedRewards: [{
                code: 'LYLD-KTZH-94XN-SNDF-S79C',
                status: 'REDEEMED',
                createdDate: '2023-07-25T07:12:00.000Z',
                usedDate: null,
                reward: {
                    ctaURL: '',
                    imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/d5dce52e76cf5da2271835aec5408afb.jpeg',
                    name: 'UA.com | $5 Off Reward',
                    points: 625,
                    posCode: '',
                    productID: '',
                    rewardCTA: ' Redeem',
                    rewardFlowType: 'ONLINE_DOLLAR_OFF',
                    rewardID: 8294,
                    rewardType: 'BASE',
                    subTitle1: 'UA.com ',
                    subTitle2: 'Apply to any UA.com purchase ',
                    title: ' $5 Off Reward'
                }
            }]
        };
        let svc = {};
        let responseObj = {
            statusCode: 200,
            text: '{"data":{"availableRewardsToClaim":{"success":true,"rewardGroups":[{"name":"Online Checkout Wins","displayName":"Online Checkout Wins","displayOnPages":["MINI_HUB","MY_REWARDS_LOCKER","UA_REWARDS_GRID"],"rewards":[{"rewardID":8294,"name":"UA.com | $5 Off Reward","subTitle1":"UA.com ","title":" $5 Off Reward","subTitle2":"Apply to any UA.com purchase ","rewardCTA":" Redeem","imageUrl":"https://d1iwtomgj4ct8d.cloudfront.net/merchant/d5dce52e76cf5da2271835aec5408afb.jpeg","points":625,"status":true,"rewardType":"BASE","rewardFlowType":"ONLINE_DOLLAR_OFF","productID":"new-arrivals","ctaURL":"new-arrivals","visible":true,"pointsDeficit":0}]}]},"claimedRewards":{"success":true,"coupon":[{"code":"LYLD-KTZH-94XN-SNDF-S79C","status":"REDEEMED","createdDate":"2023-07-25T07:12:00.000Z","usedDate":null,"reward":{"rewardID":8294,"name":"UA.com | $5 Off Reward","subTitle1":"UA.com ","title":" $5 Off Reward","subTitle2":"Apply to any UA.com purchase ","rewardCTA":" Redeem","imageUrl":"https://d1iwtomgj4ct8d.cloudfront.net/merchant/d5dce52e76cf5da2271835aec5408afb.jpeg","points":625,"posCode":"","rewardType":"BASE","rewardFlowType":"ONLINE_DOLLAR_OFF","productID":"","ctaURL":""}}]},"getLoyaltyPointsData":{"success":true,"loyaltyPointsBalance":21618}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse(claimeDiscountCouponWithRewardPoints) statusCode 200', () => {
        var expectedResult = {
            estimatedPoints: null,
            enrolled: null,
            loyaltyID: null,
            errorMessage: '',
            error: undefined,
            balance: null,
            rewards: [],
            coupon: 'LYLD-XHKH-DP9Q-BF3M-BWQG',
            couponUpdated: false,
            rewardRejected: false,
            customerUpdated: false,
            claimedRewards: []
        };
        let svc = {};
        let responseObj = {
            statusCode: 200,
            text: '{"data":{"claimDiscountCouponWithRewardPoints":{"success":true,"messages":[{"message":"reward redeemed successfully","type":"INFORMATION"}],"couponClaimEvent":{"id":"385532184","rewardID":8294,"name":"UA.com | $5 Off Reward","description":"Apply to any UA.com purchase | Redeem","imageUrl":"https://d1iwtomgj4ct8d.cloudfront.net/merchant/d5dce52e76cf5da2271835aec5408afb.jpeg","points":625,"rewardType":"BASE","coupon":{"code":"LYLD-XHKH-DP9Q-BF3M-BWQG","status":"REDEEMED"}}}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse(rejectRedeemedRewardEvent) statusCode 200', () => {
        var expectedResult = {
            estimatedPoints: null,
            enrolled: null,
            loyaltyID: null,
            errorMessage: '',
            error: undefined,
            balance: null,
            rewards: [],
            coupon: null,
            couponUpdated: false,
            rewardRejected: true,
            customerUpdated: false,
            claimedRewards: []
        };
        let svc = {};
        let responseObj = {
            statusCode: 200,
            text: '{"data":{"rejectRedeemedRewardEvent":{"success":true}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });

    it('Loyalty serviceHelper.js parseGraphQLResponse(updateCustomerProfileIntoLoyalty) statusCode 200', () => {
        var expectedResult = {
            estimatedPoints: null,
            enrolled: null,
            loyaltyID: null,
            errorMessage: '',
            error: undefined,
            balance: null,
            rewards: [],
            coupon: null,
            couponUpdated: false,
            rewardRejected: false,
            customerUpdated: true,
            claimedRewards: []
        };
        let svc = {};
        let responseObj = {
            statusCode: 200,
            text: '{"data":{"updateCustomerProfileIntoLoyalty":{"success":true}}}'
        };
        var result = loyaltyServiceHelper.parseGraphQLResponse(svc, responseObj);
        assert.isDefined(result, 'result object is defined');
        assert.deepEqual(result, expectedResult);
    });
});
