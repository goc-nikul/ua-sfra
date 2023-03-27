module.exports = {
    /**
     * build address map object to send to FedEx
     * @param {Object} order object
     * @return {Object} Mapped order object passed to FedEx createFedExShipmentProcessRequest
     */
    getAddressMapFromOrder: function (order) {
        var Site = require('dw/system/Site');
        var isOrder = order instanceof require('dw/order/Order');
        var customerServicePhone = Site.getCurrent().getCustomPreferenceValue('customerServicePhone');
        var addressData = order;
        if (isOrder) {
            addressData = order.defaultShipment;
        }
        return {
            name: addressData && addressData.shippingAddress ? addressData.shippingAddress.fullName : addressData.fullName,
            city: addressData && addressData.shippingAddress ? addressData.shippingAddress.city : addressData.city,
            postalCode: addressData && addressData.shippingAddress ? addressData.shippingAddress.postalCode : addressData.postalCode,
            stateCode: addressData && addressData.shippingAddress ? addressData.shippingAddress.stateCode : addressData.stateCode,
            countryCode: addressData && addressData.shippingAddress ? addressData.shippingAddress.countryCode : addressData.countryCode,
            address1: addressData && addressData.shippingAddress ? addressData.shippingAddress.address1 : addressData.address1,
            address2: addressData && addressData.shippingAddress ? addressData.shippingAddress.address2 || '' : addressData.address2 || '',
            phone: addressData && addressData.shippingAddress ? addressData.shippingAddress.phone || customerServicePhone : addressData.phone
        };
    }
};
