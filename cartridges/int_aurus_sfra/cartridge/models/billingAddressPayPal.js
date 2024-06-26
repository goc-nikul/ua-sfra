'use strict';

/**
* @constructor
* @classdesc Billing address in Aurus Pay format
* @param {Object} address Shipping address from paymentForm
*/
function BillingAddress(address) {
    // Name
    this.BillingFirstName = address.billinginfo.payer.payer_info.first_name;
    this.BillingLastName = address.billinginfo.payer.payer_info.last_name;
    this.BillingMiddleName = '';
    // Address
    this.BillingAddressLine1 = address.billing.address1;
    this.BillingAddressLine2 = address.billing.address2 ? address.billing.address2.value : '';
    this.BillingCity = address.billing.city;
    this.BillingState = address.billing.stateCode;
    this.BillingZip = address.billing.postalCode;
    this.BillingCountry = address.billing.countryCode.value;
    // Contact
    this.BillingMobileNumber = address.phone;
    this.BillingEmailId = address.email;
}

module.exports = BillingAddress;
