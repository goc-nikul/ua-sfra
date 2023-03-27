'use strict';

/**
 * Forms a sender details model
 * @param {Object} warehouseAddress fetches values from site preferences
 */
function senderDetails(warehouseAddress) {
    if (!warehouseAddress) return;
    this.name = warehouseAddress.name;
    this.phone = warehouseAddress.phone;
}

module.exports = senderDetails;
