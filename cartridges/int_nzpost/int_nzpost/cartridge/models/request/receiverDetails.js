'use strict';

/**
 * Forms a receiver details model
 * @param {Object} orderAddressMap fetches a value from site preferences
 * @param {string} email customer's email
 */
function receiverDetails(orderAddressMap, email) {
    if (!orderAddressMap || !email) return;
    this.name = orderAddressMap.name;
    this.phone = orderAddressMap.phone;
    this.email = 'customerservicenz@underarmour.com';
}

module.exports = receiverDetails;
