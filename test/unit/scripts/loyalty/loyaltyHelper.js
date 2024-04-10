'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const assert = require('chai').assert;
const Customer = require('../../../mocks/dw/dw_customer_Customer');
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
const sinon = require('sinon');
const Money = require('../../../mocks/dw/dw_value_Money');
const { getUATagMainCookieValue } = require('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyHelper.js');
const Order = require('../../../mocks/dw/dw_order_Order');
const { expect } = require('chai');

function UACAPIAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}

var loyaltyCategory = {
    id: 'loyaltyCategory',
    categories: [{
        categories: [{}]
    }],
    custom: {
        loyalty: true
    }
};

var loyaltyProductObj = {
    custom: {
        isLoyaltyExclusive: true,
        productTileUpperLeftBadge: 'productTileUpperLeftBadge',
        productTileUpperLeftFlameIconBadge: 'productTileUpperLeftFlameIconBadge'
    },
    master: {},
    priceModel: {
        isPriceRange: function () {
            return {};
        },
        minPrice: {
            value: 1
        },
        maxPrice: {
            value: 1
        }
    },
    isMaster: function () {
        return {};
    }
};

describe('int_loyalty/cartridge/scripts/helpers/loyaltyHelper.js test', () => {
    global.empty = (data) => {
        return !data;
    };
    let loyaltyHelper;
    let mockLoyaltyDataService;
    let mockLoyaltyServiceHelper;

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
        mockLoyaltyServiceHelper = {
            getGraphQLParams: () => {
                return {};
            }
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
            '~/cartridge/scripts/LoyaltyConstants': require('../../../../cartridges/int_loyalty/cartridge/scripts/LoyaltyConstants.js'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/order/BasketMgr': {
                getCurrentOrNewBasket: () => {
                    return {
                        removeProductLineItem: () => {},
                        getAllProductLineItems: () => {
                            return {
                                toArray: () => [{
                                    UUID: '1234',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    }
                                }, {
                                    UUID: '1235',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    }
                                }]
                            };
                        },
                        custom: {
                            loyaltyPointsBalance: 0,
                            loyaltyPointsBalanceCheckDate: new Date()
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/cookieHelpers': {
                read: function () {
                    return 'v_id:01808efa33e9000b94d64fe0942d05074008106c00bd0$_sn:414$_se:4$_ss:0$_st:1677755343267$vapi_domain:salesforce.com$dc_visit:404$dc_group:55$ses_id:1677753461933;exp-session$_pn:1;exp-session$_previouspage:US|rewards.html;exp-1677757143606$externalCampaignID:EM_SFEDS_US_v4_J0AGWY6281_1216;exp-session$dc_event:4;exp-session$dc_region:us-west-2;exp-session';
                }
            }
        });
    });

    it('isLoyaltyEnabled', () => {
        let isEnabled = loyaltyHelper.isLoyaltyEnabled();
        assert.isTrue(isEnabled);
    });

    it('isLoyaltyPilotEnabled', () => {
        let isEnabled = loyaltyHelper.isLoyaltyPilotEnabled();
        assert.isTrue(isEnabled);
    });

    it('getMarketingLandingContentId', () => {
        let marketingLandingContentId = loyaltyHelper.getMarketingLandingContentID();
        assert.isDefined(marketingLandingContentId, 'rewards');
    });

    it('getRewardsLockerURL', () => {
        let rewardsLockerUrl = loyaltyHelper.getRewardsLockerURL();
        assert.isDefined(rewardsLockerUrl, 'test/MyRewardsLocker-Show');
    });

    it('isLoyaltyPilotZipCode zipCode Exists', () => {
        let zipCode = '00009';
        let isZipCode = loyaltyHelper.isLoyaltyPilotZipCode(zipCode);
        assert.isTrue(isZipCode);
    });

    it('isLoyaltyPilotZipCode zipCode Empty Zipcode', () => {
        let zipCode = '';
        let isZipCode = loyaltyHelper.isLoyaltyPilotZipCode(zipCode);
        assert.isFalse(isZipCode);
    });

    it('isLoyaltyPilotZipCode zipCode Split Zipcode', () => {
        let zipCode = '00009-00009';
        let isZipCode = loyaltyHelper.isLoyaltyPilotZipCode(zipCode);
        assert.isTrue(isZipCode);
    });

    it('isLoyaltyProduct', () => {
        let isBoolean = loyaltyHelper.isLoyaltyProduct(loyaltyProductObj);
        assert.isTrue(isBoolean);
    });

    it('isLoyaltyCategory', () => {
        let isBoolean = loyaltyHelper.isLoyaltyCategory(loyaltyCategory);
        assert.isTrue(isBoolean);
    });

    it('isLoyalCustomer', () => {
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: false,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' },
                    { id: 'Loyalty' }
                ],
                loyalty: {
                    status: 'ENROLLED'
                }
            },
            isMemberOfCustomerGroup: function () {
                return true;
            }
        };
        let isLoyalCustomer = loyaltyHelper.isLoyalCustomer();
        assert.isTrue(isLoyalCustomer);
    });

    it('isVIPCustomer', () => {
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: true,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' },
                    { id: 'Loyalty' }
                ],
                loyalty: {
                    status: 'ENROLLED'
                },
                custom: {
                    vipAccountId: '1234'
                }
            },
            isMemberOfCustomerGroup: function () {
                return true;
            }
        };
        let isVIPCustomer = loyaltyHelper.isVIPCustomer();
        assert.isTrue(isVIPCustomer);
    });

    it('appendLoyaltyUrl', () => {
        var resObject = {
            setStatusCode: () => {
                return true;
            },
            setRedirectStatus: () => {
                return true;
            },
            setViewData: () => {},
            getViewData: function () {
                return {
                    loyaltyUrl: ''
                };
            },
            redirect: () => {}
        };
        var setViewDataSpy = sinon.spy(resObject, 'setViewData');
        var customer = new Customer();
        customer.isMemberOfCustomerGroup = () => true;
        global.session = {
            customer: customer
        };

        loyaltyHelper.appendLoyaltyUrl(resObject);

        assert.isTrue(setViewDataSpy.called);
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

    it('estimate() Estimates the points of a current purchase hits Else Condition', () => {
        // Setup test basket
        const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
        var lineItemCtnr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();
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

        // Call the function0
        let isBool = loyaltyHelper.estimate(lineItemCtnr, undefined);

        assert.isTrue(isBool);
    });

    it('estimate() estimationResponse NOT OK', () => {
        // Setup test basket
        const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
        var lineItemCtnr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: false,
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

        // Call the function0
        let isBool = loyaltyHelper.estimate(lineItemCtnr, undefined);

        assert.isFalse(isBool);
    });

    it('estimate() estimationResponse Throws 404', () => {
        // Setup test basket
        const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
        var lineItemCtnr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();
        const getGraphQLSpy = sinon.spy(() => {
            throw new Error('404');
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };

        // Call the function0
        let isBool = loyaltyHelper.estimate(lineItemCtnr, undefined);

        assert.isFalse(isBool);
    });

    it('estimate() LineItemCntr has no Items', () => {
        // Setup test basket
        const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
        var lineItemCtnr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();
        lineItemCtnr.productLineItems = [];
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: false,
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

        // Call the function0
        let isBool = loyaltyHelper.estimate(lineItemCtnr, undefined);

        assert.isTrue(isBool);
    });

    it('checkCustomerReconcile() reject rewards if last reconciliation date greater than 30 days and the user has "redeemed" coupons not currently in the basket', () => {
        // Setup Mock Basket
        const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
        var testBasket = new LineItemCtnr();

        // Setup Mock Customer
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

    it('checkCustomerReconcile() Throws Error', () => {
        // Setup Mock Basket
        const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
        var testBasket = new LineItemCtnr();

        // Setup Mock Customer
        var customer = new Customer();
        customer.isMemberOfCustomerGroup = () => true;
        global.session = {
            customer: customer
        };

         // Add a few different types of coupons to ensure we only try to remove the right one
        delete testBasket.couponLineItems;

        const getGraphQLSpy = sinon.spy(() => {
            throw new Error('404');
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };

        loyaltyHelper.rejectReward = sinon.spy();

        // Call the function
        loyaltyHelper.checkCustomerReconcile(testBasket);

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

    it('canApplyLoyaltyCoupon() Throws Error', () => {
        const getGraphQLSpy = sinon.spy(() => {
            throw new Error('404');
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
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

    it('updateCoupon, can update coupon status to used with one or more coupons', () => {
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                object: {
                    couponUpdated: true
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };

        const getGraphQLParamsSpy = sinon.spy((action, object) => {
            return object.loyaltyCoupons[0];
        });

        mockLoyaltyServiceHelper.getGraphQLParams = getGraphQLParamsSpy;

        const res = loyaltyHelper.updateCoupon(['LYLD-0000-0000-0000', 'LYLD-0000-0000-1111', 'LYLD-0000-0000-2222']);

        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-0000').calledOnce);
        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-1111').calledOnce);
        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-2222').calledOnce);

        assert.equal(res.object.failedServiceCalls, 0);
    });

    it('updateCoupon, it can handle a failing service call', () => {
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: false,
                object: {
                    couponUpdated: false
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };

        const getGraphQLParamsSpy = sinon.spy((action, object) => {
            return object.loyaltyCoupons[0];
        });

        mockLoyaltyServiceHelper.getGraphQLParams = getGraphQLParamsSpy;

        const res = loyaltyHelper.updateCoupon(['LYLD-0000-0000-0000', 'LYLD-0000-0000-1111', 'LYLD-0000-0000-2222']);

        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-0000').calledOnce);
        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-1111').calledOnce);
        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-2222').calledOnce);

        assert.equal(res.object.failedServiceCalls, 3);
    });

    it('updateCoupon, can handle a failed update for one or more coupons', () => {
        const getGraphQLSpy = sinon.spy((arg1, arg2) => {
            return {
                ok: true,
                object: {
                    couponUpdated: arg1 !== 'LYLD-0000-0000-0000'
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };

        const getGraphQLParamsSpy = sinon.spy((action, object) => {
            return object.loyaltyCoupons[0];
        });

        mockLoyaltyServiceHelper.getGraphQLParams = getGraphQLParamsSpy;

        const res = loyaltyHelper.updateCoupon(['LYLD-0000-0000-0000', 'LYLD-0000-0000-1111', 'LYLD-0000-0000-2222'], 1234);

        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-0000').calledOnce);
        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-1111').calledOnce);
        assert.isTrue(getGraphQLSpy.withArgs('LYLD-0000-0000-2222').calledOnce);

        assert.equal(res.object.couponUpdated, false);
    });

    it('Loyalty enroll successful process', () => {
        global.customer = {
            profile: {
                custom: {
                    loyaltyStatus: 'UNENROLLED',
                    loyaltyStatusDate: empty,
                    loyaltyID: empty
                }
            }
        };
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: false,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' }
                ],
                loyalty: {
                    status: 'UNENROLLED',
                    loyaltyStatusDate: new Date(),
                    loyaltyID: empty
                }
            },
            isMemberOfCustomerGroup: function () {
                return false;
            }
        };
        global.request = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
            }
        };
        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return '';
                    },
                    set: function() {
                        return '';
                    }
                }
            },
            querystring: { channel: 'WEB', subChannel: 'desktop' }
        };
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                object: {
                    enrolled: true,
                    loyaltyID: 1234567890
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        let enrollResponse = loyaltyHelper.enroll(req);
        assert.isTrue(enrollResponse.enrolled);
    });

    it('Loyalty enroll successful process undefined subChannel trigger Desktop', () => {
        global.customer = {
            profile: {
                custom: {
                    loyaltyStatus: 'UNENROLLED',
                    loyaltyStatusDate: empty,
                    loyaltyID: empty
                }
            }
        };
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: false,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' }
                ],
                loyalty: {
                    status: 'UNENROLLED',
                    loyaltyStatusDate: new Date(),
                    loyaltyID: empty
                }
            },
            isMemberOfCustomerGroup: function () {
                return false;
            }
        };
        global.request = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
            },
            httpUserAgent: {
                toLowerCase: function () {
                    return 'mozilla/5.0 (macintosh; intel mac os x 10_15_3) applewebkit/537.36 (khtml, like gecko) chrome/80.0.3987.122 safari/537.36';
                }
            }
        };
        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return '';
                    },
                    set: function() {
                        return '';
                    }
                }
            },
            querystring: { channel: 'WEB', subChannel: 'undefined', subChannelDetail: 'undefined' }
        };
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                object: {
                    enrolled: true,
                    loyaltyID: 1234567890
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        let enrollResponse = loyaltyHelper.enroll(req);
        assert.isTrue(enrollResponse.enrolled);
    });

    it('Loyalty enroll successful process undefined subChannel trigger Mobile', () => {
        global.customer = {
            profile: {
                custom: {
                    loyaltyStatus: 'UNENROLLED',
                    loyaltyStatusDate: empty,
                    loyaltyID: empty
                }
            }
        };
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: false,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' }
                ],
                loyalty: {
                    status: 'UNENROLLED',
                    loyaltyStatusDate: new Date(),
                    loyaltyID: empty
                }
            },
            isMemberOfCustomerGroup: function () {
                return false;
            }
        };
        global.request = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.99 Mobile/15E148 Safari/604.1'
            },
            httpUserAgent: {
                toLowerCase: function () {
                    return 'mozilla/5.0 (iphone; cpu iphone OS 16_5 like mac os x) applewebkit/605.1.15 (khtml, like gecko) crios/114.0.5735.99 mobile/15E148 safari/604.1';
                }
            }
        };
        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return '';
                    },
                    set: function() {
                        return '';
                    }
                }
            },
            querystring: { channel: 'WEB', subChannel: 'undefined', subChannelDetail: 'undefined' }
        };
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                object: {
                    enrolled: true,
                    loyaltyID: 1234567890
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        let enrollResponse = loyaltyHelper.enroll(req);
        assert.isTrue(enrollResponse.enrolled);
    });

    it('Loyalty enroll response Not OK process', () => {
        global.customer = {
            profile: {
                custom: {
                    loyaltyStatus: 'UNENROLLED',
                    loyaltyStatusDate: empty,
                    loyaltyID: empty
                }
            }
        };
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: false,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' }
                ],
                loyalty: {
                    status: 'UNENROLLED',
                    loyaltyStatusDate: new Date(),
                    loyaltyID: empty
                }
            },
            isMemberOfCustomerGroup: function () {
                return false;
            }
        };
        global.request = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
            }
        };
        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return '';
                    },
                    set: function() {
                        return '';
                    }
                }
            },
            querystring: { channel: 'WEB', subChannel: 'desktop' }
        };
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: false,
                object: {
                    enrolled: false,
                    errorMessage: 'Something went wrong'
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        let enrollResponse = loyaltyHelper.enroll(req);
        assert.isFalse(enrollResponse.enrolled);
    });

    it('Loyalty enroll response Not OK process', () => {
        global.customer = {
            profile: {
                custom: {
                    loyaltyStatus: 'UNENROLLED',
                    loyaltyStatusDate: empty,
                    loyaltyID: empty
                }
            }
        };
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: false,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' }
                ],
                loyalty: {
                    status: 'UNENROLLED',
                    loyaltyStatusDate: new Date(),
                    loyaltyID: empty
                }
            },
            isMemberOfCustomerGroup: function () {
                return false;
            }
        };
        global.request = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
            }
        };
        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return '';
                    },
                    set: function() {
                        return '';
                    }
                }
            },
            querystring: { channel: 'WEB', subChannel: 'desktop' }
        };
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: false,
                object: {
                    enrolled: false,
                    errorMessage: 'Something went wrong'
                }
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        let enrollResponse = loyaltyHelper.enroll(req);
        assert.isFalse(enrollResponse.enrolled);
    });

    it('Loyalty enroll response Throws Error', () => {
        global.customer = {
            profile: {
                custom: {
                    loyaltyStatus: 'UNENROLLED',
                    loyaltyStatusDate: empty,
                    loyaltyID: empty
                }
            }
        };
        global.session.customer = {
            profile: {
                firstName: 'John',
                lastName: 'Loyalty',
                email: 'jloyalty@loyalcustomer.com',
                isVIP: false,
                isEmployee: false,
                customerGroups: [
                    { id: 'Everyone' },
                    { id: 'Everyone Minus BF' },
                    { id: 'Everyone Minus Employee and VIP' },
                    { id: 'Everyone Minus Employee, ID.me, & VIP' },
                    { id: 'Everyone Minus IDme' },
                    { id: 'Everyone Minus VIP' },
                    { id: 'Registered' }
                ],
                loyalty: {
                    status: 'UNENROLLED',
                    loyaltyStatusDate: new Date(),
                    loyaltyID: empty
                }
            },
            isMemberOfCustomerGroup: function () {
                return false;
            }
        };
        global.request = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36'
            }
        };
        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return '';
                    },
                    set: function() {
                        return '';
                    }
                }
            },
            querystring: { channel: 'WEB', subChannel: 'desktop' }
        };
        const getGraphQLSpy = sinon.spy(() => {
            throw new Error('404');
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        let enrollResponse = loyaltyHelper.enroll(req);
        assert.isFalse(enrollResponse.enrolled);
    });

    it('getLoyaltyPointsDescription() hasBopisItems is True', () => {
        const OrderCtnr = require('../../../mocks/dw/dw_order_Order');
        OrderCtnr.hasBopisItems = true;

        let result = loyaltyHelper.getLoyaltyPointsDescription(OrderCtnr);
        assert.equal(result, 'testMsg');
    });

    it('getLoyaltyPointsDescription() hasBopisItems is false ', () => {
        const OrderCtnr = require('../../../mocks/dw/dw_order_Order');
        OrderCtnr.hasBopisItems = false;

        let result = loyaltyHelper.getLoyaltyPointsDescription(OrderCtnr);
        assert.equal(result, 'testMsg');
    });

    it('getLoyaltyPointsDescription() only hasBopisItems ', () => {
        const OrderCtnr = require('../../../mocks/dw/dw_order_Order');
        OrderCtnr.hasBopisItems = true;
        OrderCtnr.hasOnlyBopisItems = true;

        let result = loyaltyHelper.getLoyaltyPointsDescription(OrderCtnr);
        assert.equal(result, 'testMsg');
    });

    it('getRewards() Fetches the rewards', () => {
        // Setup test basket
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                error: 0,
                errorMessage: null,
                mockResult: false,
                object: {
                    balance: 0,
                    claimedRewards: [{
                        code: '4M66-MRGB-H377-XDH4',
                        createdDate: '2022-07-13T16:17:47.000Z',
                        reward: {
                            ctaURL: 'new-arrivals',
                            imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/b687581300efcc1769d2a9d605e023b7.jpg',
                            name: 'UA Mens Gear | UA Rival Fleece Hoodie',
                            points: 6875,
                            posCode: '1357092',
                            productID: '1357092',
                            rewardCTA: 'Redeem',
                            rewardFlowType: 'FREE_PRODUCT',
                            rewardID: 8366,
                            rewardType: 'BASE',
                            subTitle1: 'UA Mens Gear',
                            subTitle2: 'Light, comfy & super-soft',
                            title: 'UA Rival Fleece Hoodie'
                        },
                        status: 'REDEEMED',
                        usedDate: null
                    }, {
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
                        status: 'REDEEMED',
                        usedDate: null
                    }, {
                        code: 'LYLD-9FZS-46Q4-HL2N-6CX3',
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
                        usedDate: null
                    }],
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
                },
                rewards: []
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let isObject = loyaltyHelper.getRewards();
        assert.typeOf(isObject, 'object');
        assert.property(isObject, 'redeemedRewards');
        assert.lengthOf(isObject.redeemedRewards, 3);
    });

    it('getRewards() Fetches the rewards with Empty Balance', () => {
        // Setup test basket
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                error: 0,
                errorMessage: null,
                mockResult: false,
                object: {
                    balance: empty,
                    claimedRewards: [{
                        code: '4M66-MRGB-H377-XDH4',
                        createdDate: '2022-07-13T16:17:47.000Z',
                        reward: {
                            ctaURL: 'new-arrivals',
                            imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/b687581300efcc1769d2a9d605e023b7.jpg',
                            name: 'UA Mens Gear | UA Rival Fleece Hoodie',
                            points: 6875,
                            posCode: '1357092',
                            productID: '1357092',
                            rewardCTA: 'Redeem',
                            rewardFlowType: 'FREE_PRODUCT',
                            rewardID: 8366,
                            rewardType: 'BASE',
                            subTitle1: 'UA Mens Gear',
                            subTitle2: 'Light, comfy & super-soft',
                            title: 'UA Rival Fleece Hoodie'
                        },
                        status: 'REDEEMED',
                        usedDate: null
                    }, {
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
                        status: 'REDEEMED',
                        usedDate: null
                    }, {
                        code: 'LYLD-9FZS-46Q4-HL2N-6CX3',
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
                        usedDate: null
                    }],
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
                },
                rewards: []
            };
        });

        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let isObject = loyaltyHelper.getRewards();
        assert.typeOf(isObject, 'object');
        assert.property(isObject, 'redeemedRewards');
        assert.lengthOf(isObject.redeemedRewards, 3);
    });

    it('checkRewardRedeemed() Check if a reward is among the redeemed rewards', () => {
        var redeemProxy = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyHelper', {
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        removeProductLineItem: () => {},
                        getAllProductLineItems: () => {
                            return {
                                toArray: () => [{
                                    UUID: '1234',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    }
                                }, {
                                    UUID: '1235',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
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
                                usedDate: null
                            };
                        },
                        custom: {
                            loyaltyPointsBalance: 0,
                            loyaltyPointsBalanceCheckDate: new Date()
                        }
                    };
                }
            }
        });

        const redeemedRewards = [{
            code: '4M66-MRGB-H377-XDH4',
            createdDate: '2022-07-13T16:17:47.000Z',
            reward: {
                ctaURL: 'new-arrivals',
                imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/b687581300efcc1769d2a9d605e023b7.jpg',
                name: 'UA Mens Gear | UA Rival Fleece Hoodie',
                points: 6875,
                posCode: '1357092',
                productID: '1357092',
                rewardCTA: 'Redeem',
                rewardFlowType: 'FREE_PRODUCT',
                rewardID: 8366,
                rewardType: 'BASE',
                subTitle1: 'UA Mens Gear',
                subTitle2: 'Light, comfy & super-soft',
                title: 'UA Rival Fleece Hoodie'
            },
            status: 'REDEEMED',
            usedDate: null
        }, {
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
            status: 'REDEEMED',
            usedDate: null
        }];

        const reward = {
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
        };

        // Call the function0
        let isBool = redeemProxy.checkRewardRedeemed(reward, redeemedRewards);
        assert.isTrue(isBool);
    });

    it('checkRewardRedeemed() Test Empty Reward', () => {
        var redeemProxy = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyHelper', {
            'dw/order/BasketMgr': {
                getCurrentBasket: () => {
                    return {
                        removeProductLineItem: () => {},
                        getAllProductLineItems: () => {
                            return {
                                toArray: () => [{
                                    UUID: '1234',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
                                    }
                                }, {
                                    UUID: '1235',
                                    getQuantity: () => 1,
                                    setQuantityValue: () => {},
                                    getQuantityValue: () => 1,
                                    custom: {
                                        jerseyNameText: 'jerseyNameText',
                                        jerseyNumberText: 'jerseyNumberText',
                                        sponsors: 'Yes'
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
                                usedDate: null
                            };
                        },
                        custom: {
                            loyaltyPointsBalance: 0,
                            loyaltyPointsBalanceCheckDate: new Date()
                        }
                    };
                }
            }
        });

        const redeemedRewards = [{
            code: '4M66-MRGB-H377-XDH4',
            createdDate: '2022-07-13T16:17:47.000Z',
            reward: {
                ctaURL: 'new-arrivals',
                imageUrl: 'https://d1iwtomgj4ct8d.cloudfront.net/merchant/b687581300efcc1769d2a9d605e023b7.jpg',
                name: 'UA Mens Gear | UA Rival Fleece Hoodie',
                points: 6875,
                posCode: '1357092',
                productID: '1357092',
                rewardCTA: 'Redeem',
                rewardFlowType: 'FREE_PRODUCT',
                rewardID: 8366,
                rewardType: 'BASE',
                subTitle1: 'UA Mens Gear',
                subTitle2: 'Light, comfy & super-soft',
                title: 'UA Rival Fleece Hoodie'
            },
            status: 'REDEEMED',
            usedDate: null
        }, {
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
            status: 'REDEEMED',
            usedDate: null
        }];

        const reward = null;

        // Call the function0
        let isBool = redeemProxy.checkRewardRedeemed(reward, redeemedRewards);
        assert.isFalse(isBool);
    });

    it('redeemReward() Redeem a reward', () => {
        // Setup test basket
        const getGraphQLSpy = sinon.spy(() => {
            return {
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
                    rewardsRejected: false
                },
                rewards: []
            };
        });
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let objCouponCode = loyaltyHelper.redeemReward(8366);
        assert.equal(objCouponCode, 'TEST-1234-1234');
    });

    it('redeemReward() Redeem a reward Service Call returned NOT OK', () => {
        // Setup test basket
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: false,
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
                    rewardsRejected: false
                },
                rewards: []
            };
        });
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let objCouponCode = loyaltyHelper.redeemReward(8366);
        assert.equal(objCouponCode, null);
    });

    it('redeemReward() Redeem a reward Service Call returns 404', () => {
        // Setup test basket
        const getGraphQLSpy = sinon.spy(() => {
            throw new Error('404');
        });
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let objCouponCode = loyaltyHelper.redeemReward(8366);
        assert.equal(objCouponCode, null);
    });

    it('rejectReward() Reject a Reward Is False', () => {
        // Setup test basket
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                error: 0,
                errorMessage: null,
                mockResult: false,
                object: {
                    balance: null,
                    claimedRewards: [],
                    coupon: null,
                    couponUpdated: false,
                    customerUpdated: false,
                    enrolled: null,
                    error: undefined,
                    estimatedPoints: null,
                    loyaltyID: null,
                    rewardRejected: false
                },
                rewards: []
            };
        });
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let isBool = loyaltyHelper.rejectReward('LYLD-KTZH-94XN-SNDF-S79C');
        assert.isFalse(isBool);
    });

    it('rejectReward() Reject a Reward Is True', () => {
        // Setup test basket
        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                error: 0,
                errorMessage: null,
                mockResult: false,
                object: {
                    balance: null,
                    claimedRewards: [],
                    coupon: null,
                    couponUpdated: false,
                    customerUpdated: false,
                    enrolled: null,
                    error: undefined,
                    estimatedPoints: null,
                    loyaltyID: null,
                    rewardRejected: true
                },
                rewards: []
            };
        });
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let isBool = loyaltyHelper.rejectReward('LYLD-KTZH-94XN-SNDF-S79C');
        assert.isTrue(isBool);
    });

    it('updateBasketBallance() Success', () => {
        // Setup Mock Basket
        const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
        var lineItemCtnr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();

        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: true,
                error: 0,
                errorMessage: null,
                mockResult: false,
                object: {
                    balance: 8000,
                    claimedRewards: [],
                    coupon: null,
                    couponUpdated: false,
                    customerUpdated: false,
                    enrolled: null,
                    error: undefined,
                    estimatedPoints: 1027,
                    loyaltyID: null,
                    rewardRejected: false
                },

                rewards: []
            };
        });
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let isBool = loyaltyHelper.updateBasketBallance(lineItemCtnr, undefined);
        assert.isTrue(isBool);
    });

    it('updateBasketBallance() Failure', () => {
        // Setup Mock Basket
        const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
        var lineItemCtnr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();

        const getGraphQLSpy = sinon.spy(() => {
            return {
                ok: false,
                error: 0,
                errorMessage: null,
                mockResult: false,
                object: {
                    balance: 8000,
                    claimedRewards: [],
                    coupon: null,
                    couponUpdated: false,
                    customerUpdated: false,
                    enrolled: null,
                    error: undefined,
                    estimatedPoints: 1027,
                    loyaltyID: null,
                    rewardRejected: false
                },

                rewards: []
            };
        });
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: getGraphQLSpy
            };
        };
        // Call the function0
        let isBool = loyaltyHelper.updateBasketBallance(lineItemCtnr, undefined);
        assert.isFalse(isBool);
    });


});
