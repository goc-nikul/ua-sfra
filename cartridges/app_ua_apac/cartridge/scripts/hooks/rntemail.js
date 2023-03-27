'use strict';

/**
 * Fetches Return label and tracking number
 * @param {Object} order dw order
 * @returns {Object} returns shippingLabel and tracking number
 */
function getShippingLabelHtml(order) {  // eslint-disable-line no-unused-vars
    return {
        isReturnCase: true,
        shipLabel: '',
        exportStatus: true,
        isError: false
    };
}
module.exports = {
    shippingLabelAndTrackingNumber: getShippingLabelHtml
};
