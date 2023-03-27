'use strict';

/**
 * Call UPS services and fetches shipping label and tracking number
 * @param {Object} order DW Order
 * @returns {Object} returns tracking number and shipping label from UPS
 */
function fetchShippingAndTrackingNumber(order) {
    var upsServiceHelpers = require('*/cartridge/scripts/service/upsServiceHelpers');
    var Logger = require('dw/system/Logger');
    try {
        var response = upsServiceHelpers.shipmentShipRequest().call(order);
        if (response && response.ok && response.object) return response.object;
    } catch (e) {
        Logger.error('UPS Service Calls error: ' + e.message + e.stack);
    }
    return null;
}

module.exports = {
    fetchShippingAndTrackingNumber: fetchShippingAndTrackingNumber
};
