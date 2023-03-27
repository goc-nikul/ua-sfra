module.exports = {
    /**
     * build address map object to send to FedEx
     * @param {Object} order Object
     * @return {Object} Mapped order object passed to FedEx createFedExShipmentProcessRequest
     */
    getAddressMapFromOrder: function (order) {
        var Site = require('dw/system/Site');
        var isOrder = order instanceof require('dw/order/Order');
        var customerServicePhone = Site.getCurrent().getCustomPreferenceValue('customerServicePhone');
        var addressData = {};
        var addressObject = {};
        var isCommercialPickup = order && !empty(order.isCommercialPickup) ? order.isCommercialPickup : false;
        if (isOrder && !isCommercialPickup) {
            addressData = order.defaultShipment;
        } else if (!empty(order.billingAddress)) {
            addressData = order.billingAddress;
        } else {
            addressData = order;
        }

        if (addressData && addressData.shippingAddress) {
            addressObject.name = addressData.shippingAddress.fullName;
            addressObject.city = addressData.shippingAddress.city;
            addressObject.postalCode = addressData.shippingAddress.postalCode;
            addressObject.stateCode = addressData.shippingAddress.stateCode;
            addressObject.countryCode = addressData.shippingAddress.countryCode;
            addressObject.address1 = addressData.shippingAddress.address1;
            addressObject.address2 = addressData.shippingAddress.address2 || '';
            addressObject.phone = addressData.shippingAddress.phone || customerServicePhone;
        } else {
            addressObject.name = addressData.fullName;
            addressObject.city = addressData.city;
            addressObject.postalCode = addressData.postalCode;
            addressObject.stateCode = addressData.stateCode;
            addressObject.countryCode = addressData.countryCode;
            addressObject.address1 = addressData.address1;
            addressObject.address2 = addressData.address2 || '';
            addressObject.phone = addressData.phone || customerServicePhone;
        }

        return addressObject;
    }
};
