'use strict';

/**
 * Fetches Return label and tracking number
 * @param {Object} order dw order
 * @returns {Object} returns shippingLabel and tracking number
 */
function getShippingLabelAndTrackingNumber(order) {
    var dhlHelpers = require('*/cartridge/scripts/helpers/dhlHelpers');
    return dhlHelpers.fetchDHLParcelShippingAndTrackingNumber(order);
}

module.exports = {
    shippingLabelAndTrackingNumber: getShippingLabelAndTrackingNumber
};
