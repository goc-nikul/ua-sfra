'use strict';

var Logger = require('dw/system/Logger').getLogger('loyalty', 'Loyalty');

var serviceHelper = {
    parseGraphQLResponse: function (svc, response) {
        var graphqljson = response.text;
        var result = {
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

        if (response.statusCode !== 200 || empty(graphqljson)) {
            Logger.error(
                    'parseGraphQLResponse execution failed: Unable to parse UACAPI response, status code: "{0}"',
                    response.statusCode
                );
            return result;
        }

        var graphqluser;
        try {
            graphqluser = JSON.parse(graphqljson);
        } catch (err) {
            Logger.error(
                    'parseGraphQLResponse execution failed: Unable to parse UACAPI response'
                );
            return result;
        }
        if (graphqluser) {
            result.errorMessage = graphqluser.errors && graphqluser.errors.length > 0 ? graphqluser.errors[0].message : '';
            result.error = graphqluser.errors && graphqluser.errors.length > 0;

            // Log UCAPI Response Errors too
            if (graphqluser.errors && graphqluser.errors.length > 0) {
                var errorsStr = graphqluser.errors.map((e) => { return e.message; }).join(', ');
                Logger.error(
                    'parseGraphQLResponse() received UACAPI GraphQL errors: [{0}]', errorsStr
                );
            }

            if (!graphqluser.data) {
                return result;
            }

            const ObjectsHelper = require('*/cartridge/scripts/helpers/ObjectsHelper');
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'estimateLoyaltyPoints', 'success') && graphqluser.data.estimateLoyaltyPoints.success &&
                ObjectsHelper.hasProp(graphqluser, 'data', 'estimateLoyaltyPoints', 'event', 'estimatedPoints')
            ) {
                result.estimatedPoints = graphqluser.data.estimateLoyaltyPoints.event.estimatedPoints;
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'estimateLoyaltyPoints', 'success') && graphqluser.data.estimateLoyaltyPoints.success &&
                ObjectsHelper.hasProp(graphqluser, 'data', 'estimateLoyaltyPoints', 'event', 'products')
            ) {
                result.products = graphqluser.data.estimateLoyaltyPoints.event.products;
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'enrollCustomerIntoLoyalty', 'loyalty')) {
                result.enrolled = graphqluser.data.enrollCustomerIntoLoyalty.loyalty.status === 'ENROLLED' || false;
                result.loyaltyID = graphqluser.data.enrollCustomerIntoLoyalty.loyalty.ID;
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'getLoyaltyPointsData', 'success') && graphqluser.data.getLoyaltyPointsData.success &&
                            ObjectsHelper.hasProp(graphqluser, 'data', 'getLoyaltyPointsData', 'loyaltyPointsBalance')) {
                result.balance = graphqluser.data.getLoyaltyPointsData.loyaltyPointsBalance;
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'availableRewardsToClaim', 'success') && graphqluser.data.availableRewardsToClaim.success &&
                            ObjectsHelper.hasProp(graphqluser, 'data', 'availableRewardsToClaim', 'rewardGroups')) {
                for (var i = 0; i < graphqluser.data.availableRewardsToClaim.rewardGroups.length; i++) {
                    if (graphqluser.data.availableRewardsToClaim.rewardGroups[i].rewards) {
                        for (var j = 0; j < graphqluser.data.availableRewardsToClaim.rewardGroups[i].rewards.length; j++) {
                            result.rewards.push(graphqluser.data.availableRewardsToClaim.rewardGroups[i].rewards[j]);
                        }
                    }
                }
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'claimDiscountCouponWithRewardPoints', 'success') && graphqluser.data.claimDiscountCouponWithRewardPoints.success &&
                        ObjectsHelper.hasProp(graphqluser, 'data', 'claimDiscountCouponWithRewardPoints', 'couponClaimEvent', 'coupon', 'code')) {
                result.coupon = graphqluser.data.claimDiscountCouponWithRewardPoints.couponClaimEvent.coupon.code;
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'claimedRewards', 'success') && graphqluser.data.claimedRewards.success &&
                            ObjectsHelper.hasProp(graphqluser, 'data', 'claimedRewards', 'coupon')) {
                result.claimedRewards = graphqluser.data.claimedRewards.coupon;
            }
            let c = 1;
            while (ObjectsHelper.hasProp(graphqluser, 'data', 'coupon' + c, 'success')) {
                result.couponUpdated = graphqluser.data['coupon' + c].success;
                if (!result.couponUpdated) {
                    break;
                }
                c++;
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'rejectRedeemedRewardEvent', 'success')) {
                result.rewardRejected = graphqluser.data.rejectRedeemedRewardEvent.success;
            }
            if (ObjectsHelper.hasProp(graphqluser, 'data', 'updateCustomerProfileIntoLoyalty', 'success')) {
                result.customerUpdated = graphqluser.data.updateCustomerProfileIntoLoyalty.success;
            }
            return result;
        }
        Logger.error(
                'parseGraphQLResponse execution failed: Invalid UACAPI response'
            );

        return result;
    },
    getMockedUACAPITokenResponse: function () {
        return {
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
    },
    getMockedUACAPIResponse: function (requestType) {
        var mockResponseData = {};
        var mockedResponse = require('./mockedResponse');
        switch (requestType) {
            case 'enrollment':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.enrollmentOptions.successFullResponse)
                };
                break;
            case 'estimation':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.estimationPoints.estimationPointsWithoutError)
                };
                break;
            case 'confirmedPoints':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.confirmedPoints.successfulResponse)
                };
                break;
            case 'rewards':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.rewards.successfulResponse)
                };
                break;
            case 'redeemReward':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.redeemReward.successfulResponse)
                };
                break;
            case 'rejectEvent':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.rejectEvent.successfulResponse)
                };
                break;
            case 'updateCoupon':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.updateCouponCode.couponStatusWithoutError)
                };
                break;
            case 'updateCustomerProfileIntoLoyalty':
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.updateCustomerProfileIntoLoyalty.successfulResponse)
                };
                break;
            default:
                mockResponseData = {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(mockedResponse.enrollmentOptions.successFullResponse)
                };
        }
        return mockResponseData;
    },
    getGraphQLRequest: function (requestType, params, numberOfCoupons) {
        var requestBody = {};
        requestBody.variables = params;
        switch (requestType) {
            case 'enrollment':
                requestBody.query = 'mutation enrollCustomerIntoLoyalty ( $input : EnrollCustomerIntoLoyaltyInput!) { enrollCustomerIntoLoyalty(input: $input) { clientMutationId viewer { ... on RegisteredCustomer { id } } loyalty { ID status statusDate }}}';
                break;
            case 'estimation':
                requestBody.query = 'query estimateLoyaltyPoints($input: EstimateLoyaltyPointsInput!) { estimateLoyaltyPoints(input: $input) { success messages { message } event { estimatedPoints products { points productID } } } }';
                break;
            case 'confirmedPoints':
                requestBody.query = 'query ($input1: LoyaltyPointsInput!, $input2: EstimateLoyaltyPointsInput!) { getLoyaltyPointsData(input: $input1) { success loyaltyPointsBalance } estimateLoyaltyPoints(input: $input2) { success messages { message } event { estimatedPoints } } }';
                break;
            case 'updateCoupon':
                var input = '(';
                var body = '{ ';
                for (var c = 1; c <= numberOfCoupons; c++) {
                    input += '$input' + c + ': LoyaltyCouponStatusUpdateInput!';
                    body += 'coupon' + c + ': updateLoyaltyCouponStatus(input: $input' + c + ') { success messages { message } } ';
                    if (c < numberOfCoupons) {
                        input += ', ';
                    }
                }
                input += ') ';
                body += '}';
                requestBody.query = 'mutation ' + input + body;
                break;
            case 'redeemReward':
                requestBody.query = 'mutation claimDiscountCouponWithRewardPoints($input: LoyaltyClaimDiscountCouponInput!) { claimDiscountCouponWithRewardPoints(input: $input) { success messages { message type } couponClaimEvent { id rewardID name description imageUrl points rewardType coupon {code status} } } }';
                break;
            case 'rejectEvent':
                requestBody.query = 'mutation rejectRedeemedRewardEvent($input: RejectRedeemedRewardEventInput!) { rejectRedeemedRewardEvent (input: $input) { success messages { message } clientMutationId } }';
                break;
            case 'rewards':
                requestBody.query = 'query ($input1: LoyaltyAvailableRewardsToClaimInput!, $input2: LoyaltyClaimedRewardsInput!, $input3: LoyaltyPointsInput!) { availableRewardsToClaim(input: $input1) { success rewardGroups (displayOnPages: [MINI_HUB]){ name displayName displayOnPages rewards (rewardRefinement: {redeemable: true, rewardFlowTypes: [ONLINE_DOLLAR_OFF, FREE_PRODUCT] }) { rewardID name subTitle1 title subTitle2 rewardCTA imageUrl points status rewardType rewardFlowType productID ctaURL visible pointsDeficit } } } claimedRewards(input: $input2) { success coupon { code status createdDate usedDate reward { rewardID name subTitle1 title subTitle2 rewardCTA imageUrl points posCode rewardType rewardFlowType productID ctaURL} } } getLoyaltyPointsData (input: $input3) { success loyaltyPointsBalance } }';
                break;
            case 'claimedRewards':
                requestBody.query = 'query ($input: LoyaltyClaimedRewardsInput!) { claimedRewards(input: $input) { success coupon { code status createdDate usedDate reward { rewardID name subTitle1 title subTitle2 rewardCTA imageUrl points posCode rewardType rewardFlowType productID ctaURL} } } }';
                break;
            case 'updateCustomerProfileIntoLoyalty':
                requestBody.query = 'mutation updateCustomerProfileIntoLoyalty($input: UpdateCustomerProfileInput!){ updateCustomerProfileIntoLoyalty(input: $input) { success messages { type message } } }';
                break;
            default:
                requestBody.query = '';
        }
        return requestBody;
    },
    getGraphQLParams: function (requestType, param, referenceCustomerNo) {
        var paramsBody = {};
        switch (requestType) {
            case 'enrollment':
                paramsBody.input = {};
                paramsBody.input.clientMutationId = '';
                paramsBody.input.customerNo = customer.profile.customerNo;
                if ('channel' in param && !empty(param.channel) && param.channel !== 'undefined') {
                    paramsBody.input.channel = param.channel;
                }
                if ('subChannel' in param && !empty(param.subChannel) && param.subChannel !== 'undefined') {
                    paramsBody.input.subChannel = param.subChannel;
                }
                if ('subChannelDetail' in param && !empty(param.subChannelDetail) && param.subChannelDetail !== 'undefined') {
                    paramsBody.input.subChannelDetail = param.subChannelDetail;
                }
                break;
            case 'estimation':
                paramsBody.input = {};
                paramsBody.input.customerNo = customer.isAuthenticated() ? customer.profile.customerNo : referenceCustomerNo;
                paramsBody.input.event = {};
                paramsBody.input.event.type = 'purchase';
                paramsBody.input.event.products = [];
                paramsBody.input.event.value = param.adjustedMerchandizeTotalPrice.value;
                var plis = param.getAllProductLineItems();
                for (var i = 0; i < plis.length; i++) {
                    var prod = {};
                    prod.productID = plis[i].productID;
                    prod.price = plis[i].getProratedPrice().divide(plis[i].quantity.value).getDecimalValue().get();
                    prod.quantity = plis[i].getQuantityValue();
                    prod.categories = plis[i].categoryID || '';
                    paramsBody.input.event.products.push(prod);
                }
                break;
            case 'confirmedPoints':
                paramsBody.input1 = {};
                var customerNo = (customer && customer.isAuthenticated()) ? customer.profile.customerNo : referenceCustomerNo;
                paramsBody.input1.customerNo = customerNo;
                paramsBody.input2 = {};
                paramsBody.input2.customerNo = customerNo;
                paramsBody.input2.event = {};
                paramsBody.input2.event.type = 'purchase';
                paramsBody.input2.event.products = [];
                paramsBody.input2.event.value = param.adjustedMerchandizeTotalPrice.value;
                var pliCtr = param.getAllProductLineItems();
                for (var j = 0; j < pliCtr.length; j++) {
                    var product = {};
                    product.productID = pliCtr[j].productID;
                    product.price = pliCtr[j].getProratedPrice().divide(pliCtr[j].quantity.value).getDecimalValue().get();
                    product.quantity = pliCtr[j].getQuantityValue();
                    product.categories = pliCtr[j].categoryID || '';
                    paramsBody.input2.event.products.push(product);
                }
                break;
            case 'updateCoupon':
                for (var k = 1; k <= param.loyaltyCoupons.length; k++) {
                    paramsBody['input' + k] = {};
                    paramsBody['input' + k].clientMutationId = '';
                    paramsBody['input' + k].customerNo = param.customerNo;
                    paramsBody['input' + k].coupon = {
                        code: param.loyaltyCoupons[k - 1],
                        status: 'USED'
                    };
                }
                break;
            case 'redeemReward':
                paramsBody.input = {};
                paramsBody.input.customerNo = customer.profile.customerNo;
                paramsBody.input.clientMutationId = '';
                paramsBody.input.rewardId = param;
                paramsBody.input.eventId = 'minihub' + session.sessionID.toString() + new Date().toTimeString();
                break;
            case 'rejectEvent':
                paramsBody.input = {};
                paramsBody.input.customerNo = referenceCustomerNo || customer.profile.customerNo;
                paramsBody.input.clientMutationId = '';
                paramsBody.input.redeemedRewardEvent = {};
                paramsBody.input.redeemedRewardEvent.eventType = 'REWARD';
                paramsBody.input.redeemedRewardEvent.couponCode = param;
                break;
            case 'rewards':
                paramsBody.input1 = {};
                paramsBody.input1.customerNo = customer.profile.customerNo;
                paramsBody.input2 = {};
                paramsBody.input2.customerNo = customer.profile.customerNo;
                paramsBody.input2.filterType = 'COUPON_STATUS';
                paramsBody.input2.filterParam = 'REDEEMED';
                paramsBody.input3 = {};
                paramsBody.input3.customerNo = customer.profile.customerNo;
                break;
            case 'claimedRewards':
                paramsBody.input = {};
                paramsBody.input.customerNo = customer.profile.customerNo;
                paramsBody.input.filterType = param.filterType;
                paramsBody.input.filterParam = param.filterParam;
                break;
            case 'updateCustomerProfileIntoLoyalty':
                paramsBody.input = {};
                paramsBody.input.clientMutationId = '';
                paramsBody.input.customerNo = customer.profile.customerNo;
                paramsBody.input.profile = {};
                if (!empty(param.birthday.birthMonth) && param.birthday.birthMonth > 0 && !empty(param.birthday.birthDay) && param.birthday.birthDay > 0) {
                    paramsBody.input.profile = {
                        birthday: {
                            month: parseInt(param.birthday.birthMonth, 10),
                            day: parseInt(param.birthday.birthDay, 10)
                        }
                    };
                }
                if (!empty(param.firstName)) {
                    paramsBody.input.profile.firstName = param.firstName;
                }
                if (!empty(param.lastName)) {
                    paramsBody.input.profile.lastName = param.lastName;
                }
                break;
            default:
                paramsBody = {};
        }
        return paramsBody;
    },
    getUACAPITokenServiceRequest: function () {
        var Site = require('dw/system/Site');
        var requestBody = {};
        requestBody.client_id = Site.current.getCustomPreferenceValue('UACAPIClientId');
        requestBody.client_secret = Site.current.getCustomPreferenceValue('UACAPIClientSecret');
        requestBody.grant_type = 'client_credentials';
        requestBody.audience = Site.current.getCustomPreferenceValue('UACAPIClientAudience');
        return requestBody;
    }
};

module.exports = serviceHelper;
