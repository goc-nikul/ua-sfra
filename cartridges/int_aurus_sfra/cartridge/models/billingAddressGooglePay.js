'use strict';

/**
* @constructor
* @classdesc Billing address in Aurus Pay format
* @param {Object} address Shipping address from paymentForm
*/
function BillingAddress(address) {
    // Name
    this.BillingName = address.billinginfo.BillingName;
    // Address
    this.BillingAddressLine1 = address.billinginfo.BillingAddressLine1;
    this.BillingAddressLine2 = address.billinginfo.BillingAddressLine2 ? address.billinginfo.BillingAddressLine2 : '';
    this.BillingCity = address.billinginfo.BillingCity;
    this.BillingState = address.billinginfo.BillingState;
    this.BillingZip = address.billinginfo.BillingZip;
    this.BillingCountry = address.billinginfo.BillingCountry;
    // Contact
    this.BillingMobileNumber = address.billinginfo.BillingMobileNumber;
    this.BillingEmailId = address.billinginfo.BillingEmailIdemail;
}

module.exports = BillingAddress;
