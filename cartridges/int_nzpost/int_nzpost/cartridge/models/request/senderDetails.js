'use strict';

/**
 * Forms a sender details model
 * @param {Object} warehouseAddress fetches values from site preferences
 */
function senderDetails(warehouseAddress) {
    if (!warehouseAddress) return;
    this.name = warehouseAddress.name;
    this.phone = warehouseAddress.phone;
    this.site_code = warehouseAddress.site_code;
}

module.exports = senderDetails;
