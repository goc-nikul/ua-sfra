'use strict';

/**
 * Fetches Return label and tracking number
 * @param {Object} order dw order
 * @returns {Object} returns shippingLabel and tracking number
 */
function getShippingLabelAndTrackingNumber(order) {
    var fedexHelpers = require('*/cartridge/scripts/helpers/fedexHelpers');
    return fedexHelpers.fetchFedexShipmentShippingAndTrackingNumber(order);
}

module.exports = {
    shippingLabelAndTrackingNumber: getShippingLabelAndTrackingNumber
};
