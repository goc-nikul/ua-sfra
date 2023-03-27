'use strict';

/**
 * Fetches Return label and tracking number
 * @param {Object} order dw order
 * @returns {Object} returns shippingLabel and tracking number
 */
function getShippingLabelAndTrackingNumber(order) {
    var upsHelpers = require('*/cartridge/scripts/helpers/upsHelpers');
    return upsHelpers.fetchShippingAndTrackingNumber(order);
}

module.exports = {
    shippingLabelAndTrackingNumber: getShippingLabelAndTrackingNumber
};
