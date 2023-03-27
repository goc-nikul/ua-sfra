'use strict';

/**
* @constructor
* @classdesc Shipping address in Aurus Pay shipping format
* @param {Object} address Shipping address from paymentForm
*/
function ShippingAddress(address) {
    // Name
    this.ShippingFirstName = address.shipping.firstName;
    this.ShippingLastName = address.shipping.lastName;
    this.ShippingMiddleName = '';
    // Address
    this.ShippingAddressLine1 = address.shipping.address1;
    this.ShipingAddressLine2 = address.shipping.address2 ? address.shipping.address2.value : '';
    this.ShippingCity = address.shipping.city;
    this.ShippingState = address.shipping.stateCode;
    this.ShippingCountry = address.shipping.countryCode.value;
    this.ShippingZip = address.shipping.postalCode;
    // Contact
    this.ShippingEmailId = address.email;
    this.ShippingMobileNumber = address.phone;
}

module.exports = ShippingAddress;
