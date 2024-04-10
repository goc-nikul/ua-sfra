'use strict';

// API includes
var Locale = require('dw/util/Locale');
var Logger = require('dw/system/Logger');
var LOGGER = Logger.getLogger('UAMembersonAPIs', 'UAMembersonAPIs');

var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');

// Function to get/generate the authToken to customPref.
exports.getMembersonCountryConfig = function (countryCode) {
    if (empty(countryCode)) {
        countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
    }
    return membersonHelpers.getCountryConfig(countryCode);
};

// Function to search the profile from memberson.
exports.SearchProfile = function (email, mobile, mobileCountryCode) {
    return membersonHelpers.searchProfile(email, mobile, mobileCountryCode);
};

// Function to create the profile from memberson.
exports.CreateProfile = function (regFormObj, countryConfig) {
    return membersonHelpers.createProfile(regFormObj, countryConfig);
};

// Function to get the membership summary of the customer.
exports.getMembershipSummary = function (membersonCustomerNo) {
    return membersonHelpers.getMembershipSummary(membersonCustomerNo);
};

// Function to store the alue to the customOBJ
exports.StoreCustomerRegistration = function (registerForm) {
    var storeDataToCustomObj = membersonHelpers.storeCustomerRegistration(registerForm);

    return storeDataToCustomObj;
};


// Function to send the Profile Validation Email
exports.sendProfileValidationEmail = function (customObjectID, registrationFormObj) {
    try {
        // Service call to get the membership summary.
        membersonHelpers.sendProfileValidationEmail(customObjectID, registrationFormObj);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('Error occurred While send the profile validation Email: {0}' + msg);
    }
};

// Function to get the TnC Consent status of the customer.
exports.viewTnCConsentStatus = function (membersonCustomerNo, setConsent, consentValue) {
    return membersonHelpers.viewTnCConsent(membersonCustomerNo, setConsent, consentValue);
};

// Function to SET the TnC Consent status of the customer.
exports.setTnCConsentStatus = function (membersonCustomerNo) {
    // Service call to get the membership summary.
    return membersonHelpers.setTnCConsent(membersonCustomerNo);
};

// Function to GET the member Vouchers
exports.getMemberVouchers = function (memberNo) {
    // Service call to get the GET the member Vouchers.
    return membersonHelpers.getMemberVouchers(memberNo);
};

// Function to UTILIZE the member Voucher
exports.utilizeMemberVoucher = function (order, loyaltyVoucherName, locationCode) {
    // Service call to get the GET the member Vouchers.
    return membersonHelpers.utilizeMemberVoucher(order, loyaltyVoucherName, locationCode);
};

// Function to UN-UTILIZE the member Voucher
exports.unUtilizeMemberVoucher = function (order, loyaltyVoucherName) {
    // Service call to get the GET the member Vouchers.
    return membersonHelpers.unUtilizeMemberVoucher(order, loyaltyVoucherName);
};
