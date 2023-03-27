'use strict';

/**
 * Forms a pickup addres model
 * @param {Object} warehouseAddress fetch a value from site preferences
 */
function pickupAddress(warehouseAddress) {
    if (!warehouseAddress) return;
    this.street = warehouseAddress.address1;
    this.floor = warehouseAddress.address2;
    this.suburb = warehouseAddress.suburb;
    this.city = warehouseAddress.city;
    this.country_code = warehouseAddress.countryCode;
    this.postcode = warehouseAddress.postalCode ? warehouseAddress.postalCode.replace(' ', '') : '';
}

module.exports = pickupAddress;
