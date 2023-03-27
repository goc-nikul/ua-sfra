'use strict';

/**
 * Forms a delivery address model
 * @param {Object} orderAddressMap value from site preferences
 */
function deliveryAddress(orderAddressMap) {
    if (!orderAddressMap) return;
    this.street = orderAddressMap.address1;
    this.floor = orderAddressMap.address2;
    this.suburb = orderAddressMap.suburb;
    this.city = orderAddressMap.city;
    this.country_code = orderAddressMap.countryCode;
    this.postcode = orderAddressMap.postalCode ? orderAddressMap.postalCode.replace(' ', '') : '';
}

module.exports = deliveryAddress;
