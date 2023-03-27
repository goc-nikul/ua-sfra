'use strict';

/**
 * Forms request model
 * @param {string} orderNo orderNo
 * @param {string} email user email
 */
function consignment(orderNo, email) {
    if (!orderNo || !email) return;
    var nzConfig = require('*/cartridge/config/nzConfig');
    if (nzConfig.nzpostConfigurations) {
        try {
            var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
            var returnsUtils = new ReturnsUtils();
            var nzpostConfig = JSON.parse(nzConfig.nzpostConfigurations);
            var orderAddressMap = JSON.parse(returnsUtils.getPreferenceValue('returnFromAddress', 'en_NZ'));
            var warehouseAddress = JSON.parse(returnsUtils.getPreferenceValue('returnAddress', 'en_NZ'));
            this.carrier = nzpostConfig.carrier;
            this.orientation = nzpostConfig.orientation;
            this.paper_dimensions = nzpostConfig.paper_dimensions;
            this.sender_reference_1 = orderNo;
            this.receiver_details = new (require('*/cartridge/models/request/receiverDetails'))(orderAddressMap, email);
            this.delivery_address = new (require('*/cartridge/models/request/deliveryAddress'))(orderAddressMap);
            this.sender_details = new (require('*/cartridge/models/request/senderDetails'))(warehouseAddress);
            this.pickup_address = new (require('*/cartridge/models/request/pickupAddress'))(warehouseAddress);
            this.parcel_details = nzpostConfig.parcel_details;
        } catch (e) {
            e.stack;// eslint-disable-line
        }
    }
}

module.exports = consignment;
