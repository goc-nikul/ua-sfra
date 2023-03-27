'use strict';

/* eslint-disable */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Customer = require('../../mocks/dw/dw_customer_Customer');

class CustomerUtils {
    constructor() {

    }
    isEmployeeDiscount(customer, customerCountry) {
        return customer.profile.custom.isEmployee;
    }
}

class PromotionPlan {
    constructor() {
        this.lineItems = [{
            ID: 'testID',
            custom: {
                isEmployeeDiscount: true
            }
        }];
    }

    getProductPromotions() {
        return this.lineItems;
    }
}

class PromotionMgr {
    constructor() {
        this.activeCustomerPromotions = new PromotionPlan();
    }
}

describe('ShowTerms', function () {
    var showTerms = proxyquire('../../../cartridges/app_ua_core/cartridge/models/product/decorators/showTerms', {
        '*/cartridge/scripts/util/CustomerUtils': CustomerUtils,
        'dw/campaign/PromotionMgr': require('../../mocks/dw/dw_campaign_PromotionMgr')
    });

    var showTermsWithDiscount = proxyquire('../../../cartridges/app_ua_core/cartridge/models/product/decorators/showTerms', {
        '*/cartridge/scripts/util/CustomerUtils': CustomerUtils,
        'dw/campaign/PromotionMgr': new PromotionMgr()
    });

    global.customer = new Customer();

    global.empty = function(value) {
        return !value;
    }

    it('Testing ShowTerms', function() {
        global.session.custom = {
            customerCountry: 'US'
        };
        global.customer.profile.custom.isEmployee = true;
        var showTermsObj = {};
        showTerms.call({}, showTermsObj);
        assert.isTrue(showTermsObj.showTerms);

        global.customer.profile.custom.isEmployee = false;
        showTermsObj = {};
        showTerms.call({}, showTermsObj);
        assert.isFalse(showTermsObj.showTerms);
    });

    it('Testing ShowTerms with no country and with locale', function() {
        global.session.custom = {
            customerCountry: ''
        };
        global.request.getLocale = function() {
            return 'en_US';
        }
        global.customer.profile.custom.isEmployee = true;
        var showTermsObj = {};
        showTerms.call({}, showTermsObj);
    });

    it('Testing ShowTerms with isEmployeeDiscount promo', function() {
        global.session.custom = {
            customerCountry: 'US'
        };
        global.customer.profile.custom.isEmployee = true;
        var showTermsObj = {};
        showTermsWithDiscount.call({}, showTermsObj);
        assert.isFalse(showTermsObj.showTerms);
    });

});
