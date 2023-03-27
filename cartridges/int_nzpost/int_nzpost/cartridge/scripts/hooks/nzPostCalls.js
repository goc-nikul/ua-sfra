'use strict';

var nzPostHelpers = require('*/cartridge/scripts/helpers/nzPostHelpers');

/**
 * Fetches tracking number and label
 * @param {string} consignmentId return's consignmentId
 * @returns {Object} returns error object or tracking number
 */
function shippingLabelFromConsignmentId(consignmentId) {
    if (!consignmentId) return { isReturnCase: false, errorDescription: 'Not able to fetch consignmentId' };
    var trackingNumber = nzPostHelpers.getLabelStatusAndTrackingNumber(consignmentId);
    if (!trackingNumber) return { exportStatus: false, isError: true, isReturnCase: true, ConsignmentID: consignmentId, errorDescription: 'Not Available for print' };
    return {
        isReturnCase: true,
        ConsignmentID: consignmentId,
        trackingNumber: trackingNumber,
        shipLabel: nzPostHelpers.getPrintLabel(consignmentId),
        exportStatus: true,
        isError: false
    };
}

/**
 * Fetches shipping label object if it is printable fashion else returns error object
 * @param {Object} order DW order order object
 * @returns {Object} returns shipping label object if it is printable manner else returns error object
 */
function shippingLabelAndTrackingNumber(order) {
    var consignmentId = nzPostHelpers.getConsignmentId(order.orderNo, order.customerEmail);
    return shippingLabelFromConsignmentId(consignmentId);
}


module.exports = {
    shippingLabelAndTrackingNumber: shippingLabelAndTrackingNumber,
    shippingLabelFromConsignmentId: shippingLabelFromConsignmentId
};
