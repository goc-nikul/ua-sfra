'use strict';

var base = module.superModule;

/**
 * Creates a plain object that contains profile information
 * @param {Object} currentCustomer - current customer's
 * @returns {Object} an object that contains information about the current customer's profile
 */
function getProfile(currentCustomer) {
    var result;
    var profile = currentCustomer.profile;
    var countryDialingCode = currentCustomer.raw && currentCustomer.raw.profile && currentCustomer.raw.profile.custom.countryDialingCode ? currentCustomer.raw.profile.custom.countryDialingCode : '';
    var zipCode = currentCustomer.raw && currentCustomer.raw.profile && currentCustomer.raw.profile.custom.zipCode ? currentCustomer.raw.profile.custom.zipCode : '';

    if (profile) {
        result = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            password: '********',
            countryDialingCode: countryDialingCode,
            zipCode: zipCode
        };
    } else {
        result = null;
    }
    return result;
}

/**
 * Account class that represents the current customer's profile dashboard
 * @param {dw.customer.Customer} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    base.call(this, currentCustomer, addressModel, orderModel);
    this.profile = getProfile(currentCustomer);
}

account.getCustomerPaymentInstruments = base.getCustomerPaymentInstruments;
account.getProfile = getProfile;
module.exports = account;
