'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

const assert = require('chai').assert;
const Customer = require('../../../mocks/dw/dw_customer_Customer');
var ArrayList = require('../../../mocks/scripts/util/dw.util.Collection');
const sinon = require('sinon');
const Money = require('../../../mocks/dw/dw_value_Money');
const { expect } = require('chai');
const { ModuleFilenameHelpers } = require('webpack');

var getGraphQLSpy = {
    returnObj: {},
    get: function() {
        return this.returnObj;
    },
    set: function(returnObj) {
        this.returnObj = returnObj;
    }
};

function setGraphQLSpy(object) {
    getGraphQLSpy.set(object);
};

function UACAPIAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}
var hookMgrSpy = sinon.spy();
var hookHelperSpy = sinon.spy();

let loyaltySharedTestHelper;
let mockLoyaltySharedDataService = {
    getGraphQL: () => {
        return {
            call: () => {
                return {
                    ok: true
                };
            }
        };
    }
};
let mockLoyaltySharedServiceHelper = {
    getGraphQLParams: () => {
        return {};
    }
};

loyaltySharedTestHelper = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/helpers/loyaltyHelper', {
    'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
    'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
    'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
    'dw/catalog/ProductMgr' : require('../../../mocks/dw/dw_catalog_ProductMgr'),
    '~/cartridge/scripts/services/loyaltyDataService': mockLoyaltySharedDataService,
    '~/cartridge/scripts/services/serviceHelper': mockLoyaltySharedServiceHelper,
    '~/cartridge/scripts/services/UACAPIAuthTokenHelper': UACAPIAuthTokenHelper,
    '*/cartridge/scripts/LoyaltyConstants': { LOYALTY_PREFIX: 'LYLD' },
    'dw/system/HookMgr': { callHook: hookMgrSpy },
    '*/cartridge/scripts/helpers/hooks': hookHelperSpy,
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
                    loyaltyPointsBalanceCheckDate: new Date(),
                    referenceCustomerNo: undefined
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


function UACAPIAuthTokenHelper() {
    this.getValidToken = () => {
        return {
            accessToken: '12344'
        };
    };
}

function redeemRewardShared() {
    const getLocalGraphQLSpy = sinon.spy(() => {
        return getGraphQLSpy.get();
    });
    mockLoyaltySharedDataService.getGraphQL = () => {
        return {
            call: getLocalGraphQLSpy
        };
    };
    // Call the function0
    let objCouponCode = loyaltySharedTestHelper.redeemReward(8366);
    return objCouponCode;
}

function rejectRewardShared() {
        // Setup test basket
        const getLocalGraphQLSpy = sinon.spy(() => {
            return getGraphQLSpy.get();
        });

        mockLoyaltySharedDataService.getGraphQL = () => {
            return {
                call: getLocalGraphQLSpy
            };
        };
        // Call the function0
        let isBool = loyaltySharedTestHelper.rejectReward('LYLD-KTZH-94XN-SNDF-S79C', null);
        return isBool;

}

function updateBasketBallanceShared() {
        // Setup Mock Basket
        const LoyaltyLineItemCtnr = require('../../../mocks/loyalty/loyalty_order_LineItemCntr');
        var lineItemCtnr = new LoyaltyLineItemCtnr.LoyaltyLineItemCtnr();
        const getLocalGraphQLSpy = sinon.spy(() => {
            return getGraphQLSpy.get();
        });

        mockLoyaltySharedDataService.getGraphQL = () => {
            return {
                call: getLocalGraphQLSpy
            };
        };
        // Call the function0
        let isBool = loyaltySharedTestHelper.updateBasketBallance(lineItemCtnr, undefined);
        return isBool;
}

function removeAndRejectShared() {

}

module.exports = {
    redeemReward: redeemRewardShared,
    rejectReward: rejectRewardShared,
    removeAndReject: removeAndRejectShared,
    updateBasketBallance: updateBasketBallanceShared,
    setGraphQLSpy: setGraphQLSpy
}
