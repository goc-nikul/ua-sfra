'use strict';
/* eslint-disable */

// This file contains unit test scripts for util/SetOrderStatus, util/loggerHelper, util/PriceHelper

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = (data) => {
    return !data;
};

describe('SetOrderStatus: app_ua_core/cartridge/scripts/util/SetOrderStatus test', () => {

    var SetOrderStatus = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/SetOrderStatus', {
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/util/CustomerUtils': function() {
            this.isEmployeeDiscount = function() {
                return true;
            };
            this.isEmployeeFreeShipping = function() {
                return true;
            }
        }
    });

    const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
    const order = new LineItemCtnr();
    // global.customer = {};
    it('Testing method: setEmployeeOrder', () => {
        SetOrderStatus.setEmployeeOrder(order);
        assert.equal(order.custom.isEmployeeOrder, true);
    });

    it('Testing method: setEmployeeOrder order is empty', () => {
        SetOrderStatus.setEmployeeOrder();
        assert.equal(order.custom.isEmployeeOrder, true);
    });

    it('Testing method: setEmployeeOrder order is null', () => {
        var result = SetOrderStatus.setEmployeeOrder(null);
        assert.isUndefined(result);
    });

    it('Testing method: setCustomerName', () => {
        SetOrderStatus.setCustomerName(order);
        assert.isDefined(order.customerName);
    });

    it('Testing method: setCSREmailAddress', () => {
	 global.customer = {
            isMemberOfCustomerGroup: function () {
                return true;
            },
            profile: {
                email: 'csrEmail@test.com'
            }
        };
        SetOrderStatus.setCSREmailAddress(order, customer);
        assert.equal(order.custom.csrEmailAddress, 'csrEmail@test.com');
    });

    it('Testing method: setCSREmailAddress - catch block', () => {
        var SetOrderStatus = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/SetOrderStatus', {
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/system/Transaction': {},
            '*/cartridge/scripts/util/CustomerUtils': function() {
                this.isEmployeeDiscount = function() {
                    return true;
                };
                this.isEmployeeFreeShipping = function() {
                    return true;
                }
            }
        });
        global.customer = {
            isMemberOfCustomerGroup: function () {
                return true;
            },
            profile: {
                email: 'csrEmail@test.com'
            }
        };
        order.custom.csrEmailAddress = '';
        SetOrderStatus.setCSREmailAddress(order, customer);
        assert.equal(order.custom.csrEmailAddress, '');
       });

    it('Testing method: setCSREmailAddress', () => {
        SetOrderStatus.setCSREmailAddress();
    });

    it('Testing method: setOrderType', () => {
        global.customer = {
            isMemberOfCustomerGroup: function () {
                return false;
            }
        };
        order.custom.maoOrderType = {
            value: ''
        }
        order.custom.sr_token = '12345678';
        var Shipment = order.getDefaultShipment();
        Shipment.shippingMethodID = 'shoprunner';
        Shipment.shippingMethod = {
            currencyCode : '',
            description : 'ShopRunner - 2 Business Days',
            displayName : 'ShopRunner',
            ID : 'shoprunner',
            taxClassID : '0',
        };
        order.shipment = [{ Shipment }];
        SetOrderStatus.setOrderType(order);
        assert.equal(order.custom.maoOrderType, 'SHRU');

        order.custom.sr_token = '';
        SetOrderStatus.setOrderType(order);
        assert.isDefined(order.custom.maoOrderType);
        SetOrderStatus.setOrderType();
        assert.isDefined(order.custom.maoOrderType);
    });

    it('Testing method: setOrderType', () => {
        order.custom.maoOrderType = {
            value: true
        };
        SetOrderStatus.setOrderType(null);
        assert.isDefined(order.custom.maoOrderType);
        var result = SetOrderStatus.setOrderType(order);
        assert.isUndefined(result);
        global.customer = {
            isMemberOfCustomerGroup: function () {
                return true;
            }
        };
        order.custom.maoOrderType = {
            value: false
        };
        result = SetOrderStatus.setOrderType(order);
        assert.equal(order.custom.maoOrderType, 'TELE');

    });
});

describe('loggerHelper: app_ua_core/cartridge/scripts/util/loggerHelper test', () => {

    var loggerHelper = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/loggerHelper', {
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
    });

    // global.customer = {};
    it('Testing method: maskSensitiveInfo ', () => {
        var logMessage = '{"logMessage":"logMessage"}';
        var result  = loggerHelper.maskSensitiveInfo(logMessage);
        assert.equal(result, '{"logMessage":"******"}');
    });

});

describe('loggerHelper: app_ua_core/cartridge/scripts/util/loggerHelper test', () => {

    var PriceHelper = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/PriceHelper', {
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        'dw/catalog/PriceBookMgr': require('../../../mocks/dw/dw_web_Resource'),
        'dw/catalog/PriceBookMgr': {
            getPriceBook: function () {
                return 'as';
            },
            setApplicablePriceBooks: function () {
                return '';
            }
        },
        'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
        '*/cartridge/scripts/factories/price': {},
        '*/cartridge/scripts/util/collections' : {},
		'dw/util/StringUtils':{},
    });

    // global.customer = {};
    it('Testing method: getLocalizedPrice ', () => {
        var Money = require('../../../mocks/dw/dw_value_Money');
        var amount = new Money(10);
        amount.class = Money;
        var result  = PriceHelper.getLocalizedPrice(amount);
        assert.equal(result.value, 10);
    });

    // global.customer = {};
    it('Testing method: getLocalizedPrice ', () => {
        var Money = require('../../../mocks/dw/dw_value_Money');
        var amount = new Money(10);
        amount.class = Money;
        amount.currencyCode = 'USD';
        var result  = PriceHelper.getLocalizedPrice(amount);
        assert.equal(result.value, 10);
    });

    // global.customer = {};
    it('Testing method: getLocalizedPrice ', () => {
        var amount;
        var result  = PriceHelper.getLocalizedPrice(amount);
        assert.notEqual(result, 10);
    });

    it('Testing method: getLocalizedPrice ', () => {
        global.parseInt = function () {
            return 0;
        }
        var Money = require('../../../mocks/dw/dw_value_Money');
        var amount = new Money(10);
        amount.class = Money;
        amount.currencyCode = 'USD';
        var result  = PriceHelper.getLocalizedPrice(amount);
        assert.notEqual(result, 10);
    });

    it('Testing method: setSitesApplicablePriceBooks ', () => {
        var countryCode = 'SG';
        var countriesJSON = [{"countryCode":"SG","locales":["en_SG"],"currencyCode":"SGD","hostname":"development-ap01.ecm.underarmour.com.sg","priceBooks":["SGD-list","SGD-sale"],"countryDialingCode":"+65","regexp":"^[0-9]{8}$"},{"countryCode":"AU","locales":["en_AU"],"currencyCode":"AUD","hostname":"development-ap01.ecm.underarmour.com.au","priceBooks":["AUD-list","AUD-sale"]}];
        PriceHelper.setSitesApplicablePriceBooks(countryCode, countriesJSON);
        assert.equal(countryCode, 'SG');
    });

});
