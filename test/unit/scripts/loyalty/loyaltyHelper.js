'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const assert = require('chai').assert;
const sinon = require('sinon');


const mockLoyaltyServiceHelper = {
    getGraphQLParams: () => {
        return {};
    }
};

function UACAPIAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}

describe('int_loyalty/cartridge/scripts/helpers/loyaltyHelper.js test', () => {
    global.empty = (data) => {
        return !data;
    };
    let loyaltyHelper;
    let mockLoyaltyDataService;

    beforeEach(() => {
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

        // Reset our helper before each test
        loyaltyHelper = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyHelper', {
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            '~/cartridge/scripts/services/loyaltyDataService': mockLoyaltyDataService,
            '~/cartridge/scripts/services/serviceHelper': mockLoyaltyServiceHelper,
            '~/cartridge/scripts/services/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
            '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return 'v_id:01808efa33e9000b94d64fe0942d05074008106c00bd0$_sn:414$_se:4$_ss:0$_st:1677755343267$vapi_domain:salesforce.com$dc_visit:404$dc_group:55$ses_id:1677753461933;exp-session$_pn:1;exp-session$_previouspage:US|rewards.html;exp-1677757143606$externalCampaignID:EM_SFEDS_US_v4_J0AGWY6281_1216;exp-session$dc_event:4;exp-session$dc_region:us-west-2;exp-session';
                }
            }
        });
    });


    it('removeInvalidLoyaltyCoupons() removes invalid coupons from the basket', () => {
        // Setup test basket
        const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
        var testBasket = new LineItemCtnr();

        // Spy function
        const removeCouponSpy = sinon.spy();

        // Mock the removeCouponLineItem since we don't care to test the actual basket
        testBasket.removeCouponLineItem = removeCouponSpy;

        // Add a few different types of coupons to ensure we only try to remove the right one
        testBasket.couponLineItems = [
            {
                applied: true,
                couponCode: 'LYLD-1234-1234-1234',
                length: 1
            },
            {
                applied: false,
                couponCode: 'LYLD-1234-1234-4567',
                length: 1
            },
            {
                applied: true,
                couponCode: 'TEST-0000-0000-0000',
                length: 1
            }
        ];

        // Call the function
        loyaltyHelper.removeInvalidLoyaltyCoupons(testBasket);

        // Assert the basket.removeCouponLineItem was called with the right coupon argument only once
        assert(removeCouponSpy.withArgs(testBasket.couponLineItems[1]).calledOnce);
    });

    it('checkCustomerReconcile() reject rewards if last reconciliation date greater than 30 days and the user has "redeemed" coupons not currently in the basket', () => {
        // Setup Mock Basket
        const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
        var testBasket = new LineItemCtnr();

        // Setup Mock Customer
        var Customer = require('../../../mocks/dw/dw_customer_Customer');
        var customer = new Customer();
        customer.isMemberOfCustomerGroup = () => true;
        global.session = {
            customer: customer
        };

         // Add a few different types of coupons to ensure we only try to remove the right one
        testBasket.couponLineItems = [
            {
                applied: true,
                couponCode: 'LYLD-1234-1234-1234',
                length: 1
            }
        ];

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        object: {
                            claimedRewards: [
                                {
                                    code: 'LYLD-0000-0000-0000',
                                    status: 'REDEEMED'
                                },
                                {
                                    code: 'LYLD-1234-1234-1234',
                                    status: 'REDEEMED'
                                }
                            ]
                        }
                    };
                }
            };
        };
        loyaltyHelper.rejectReward = sinon.spy();

        // Call the function
        loyaltyHelper.checkCustomerReconcile(testBasket);

        assert(loyaltyHelper.rejectReward.withArgs('LYLD-0000-0000-0000').calledOnce);
        assert(loyaltyHelper.rejectReward.withArgs('LYLD-1234-1234-1234').notCalled);
    });

    it('canApplyLoyaltyCoupon() ignores non-loyalty coupons, returns true', () => {
        mockLoyaltyDataService.getGraphQL = sinon.spy();
        assert.isTrue(loyaltyHelper.canApplyLoyaltyCoupon());
        assert.isTrue(loyaltyHelper.canApplyLoyaltyCoupon('TEST-1234-1234'));
        assert(mockLoyaltyDataService.getGraphQL.notCalled);
    });

    it('canApplyLoyaltyCoupon() identifies a loyalty coupon which CANNOT be redeemed, returns false', () => {
        // Override the mock response with an empty result (ie. coupon not found in L+ and should not be redeemed directly)
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        object: {
                            claimedRewards: []
                        }
                    };
                }
            };
        };

        assert.isFalse(loyaltyHelper.canApplyLoyaltyCoupon('LYLD-0000-0000-0000'));
    });

    it('canApplyLoyaltyCoupon() identifies a valid loyalty coupon which can be redeemed, returns true', () => {
        // Override the mock response with a happy path response
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true,
                        object: {
                            claimedRewards: [
                                {
                                    code: 'LYLD-0000-0000-0000',
                                    status: 'REDEEMED'
                                }
                            ]
                        }
                    };
                }
            };
        };
        assert.isTrue(loyaltyHelper.canApplyLoyaltyCoupon('LYLD-0000-0000-0000'));
    });

    it('getCampaignID() identifies an external campaign ID, returns campaign ID', () => {
        assert.equal('EM_SFEDS_US_v4_J0AGWY6281_1216', loyaltyHelper.getCampaignID('externalCampaignID'), 'Receive Campaign ID');
    });
});
