'use strict';

var base = module.superModule;

/**
 * Creates a plain object that contains profile information
 * @param {Object} currentCustomer - current customer's
 * @returns {Object} an object that contains information about the current customer's profile
 */
function getProfile(currentCustomer) {
    var result = base.getProfile(currentCustomer);
    var profile = currentCustomer.profile;

    if (profile && result) {
        result.dob = currentCustomer.raw && currentCustomer.raw.profile && currentCustomer.raw.profile.custom.dob ? currentCustomer.raw.profile.custom.dob : '';
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
