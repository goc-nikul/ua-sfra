'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_memberson/cartridge/scripts/hooks/membersonHooks', () => {
    var membersonHooks = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/hooks/membersonHooks', {
        'dw/util/Locale': require('../../../../../../mocks/dw/dw_util_Locale'),
        'dw/system/Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/helpers/membersonHelpers': {
            getCountryConfig: function (countryCode) {
                return countryCode;
            },
            searchProfile: function (email, mobile, mobileCountryCode) {
                return {
                    profile: {}
                };
            },
            createProfile: function (regFormObj, countryConfig) {
                return {
                    profile: {}
                };
            },
            getMembershipSummary: function (membersonCustomerNo) {
                return membersonCustomerNo;
            },
            storeCustomerRegistration: function (registerForm) {
                return {
                    storeDataToCustomObj: {}
                };
            },
            sendProfileValidationEmail: function (customObjectID, registrationFormObj) {
                return {
                    status: 'OK'
                };
            },
            viewTnCConsent: function (membersonCustomerNo, setConsent, consentValue) {
                return true;
            },
            setTnCConsent: function (membersonCustomerNo) {
                return true;
            },
            getMemberVouchers: function (memberNo) {
                return {
                    status: 'OK'
                };
            },
            utilizeMemberVoucher: function (order, loyaltyVoucherName, locationCode) {
                return {
                    status: 'OK'
                };
            },
            unUtilizeMemberVoucher: function (order, loyaltyVoucherName) {
                return {
                    status: 'OK'
                };
            }
        }
    });

    it('Testing method: check getMembersonCountryConfig Function with country code', () => {
        assert.isNotNull(membersonHooks.getMembersonCountryConfig('US'), 'null');
    });

    it('Testing method: check getMembersonCountryConfig Function without country code', () => {
        assert.isNotNull(membersonHooks.getMembersonCountryConfig(), 'null');
    });

    it('Testing method: check Search Profile Function', () => {
        var email = 'test@test.com';
        var mobile = '9999999999';
        var mobileCountryCode = '+1';
        assert.isNotNull(membersonHooks.SearchProfile(email, mobile, mobileCountryCode ), 'null');
    });

    it('Testing method: check Create Profile Function', () => {
        var regFormObj = {};
        var countryConfig = {};
        assert.isNotNull(membersonHooks.CreateProfile(regFormObj, countryConfig), 'null');
    });

    it('Testing method: check getMembershipSummary Function', () => {
        var membersonCustomerNo = '001';
        assert.isNotNull(membersonHooks.getMembershipSummary(membersonCustomerNo), 'null');
    });

    it('Testing method: check StoreCustomerRegistration Function', () => {
        var registerForm = {};
        assert.isNotNull(membersonHooks.StoreCustomerRegistration(registerForm), 'null');
    });

    it('Testing method: check sendProfileValidationEmail Function', () => {
        var customObjectID = '001';
        var registrationFormObj = {};
        assert.isNotNull(membersonHooks.sendProfileValidationEmail(customObjectID, registrationFormObj), 'null');
    });

    it('Testing method: check viewTnCConsentStatus Function', () => {
        var membersonCustomerNo = '000';
        var setConsent = true;
        var consentValue = 'test';
        assert.isNotNull(membersonHooks.viewTnCConsentStatus(membersonCustomerNo, setConsent, consentValue), 'null');
    });

    it('Testing method: check viewTnCConsentStatus Function', () => {
        var membersonCustomerNo = '12345';
        assert.isNotNull(membersonHooks.setTnCConsentStatus(membersonCustomerNo), 'null');
    });

    it('Testing method: check getMemberVouchers Function', () => {
        var memberNo = '12345';
        assert.isNotNull(membersonHooks.getMemberVouchers(memberNo), 'null');
    });

    it('Testing method: check getMemberVouchers Function', () => {
        var order = '001';
        var loyaltyVoucherName = 'test';
        var locationCode = 'test';
        assert.isNotNull(membersonHooks.utilizeMemberVoucher(order, loyaltyVoucherName, locationCode), 'null');
    });

    it('Testing method: check unUtilizeMemberVoucher Function', () => {
        var order = '001';
        var loyaltyVoucherName = 'test';
        assert.isNotNull(membersonHooks.unUtilizeMemberVoucher(order, loyaltyVoucherName), 'null');
    });
});

describe('int_memberson/cartridge/scripts/hooks/membersonHooks', () => {
    var membersonHooks = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/hooks/membersonHooks', {
        'dw/util/Locale': require('../../../../../../mocks/dw/dw_util_Locale'),
        'dw/system/Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
        '*/cartridge/scripts/helpers/membersonHelpers': {}
    });

    it('Testing method: check sendProfileValidationEmail Function', () => {
        assert.isNotNull(membersonHooks.sendProfileValidationEmail());
    });
});
