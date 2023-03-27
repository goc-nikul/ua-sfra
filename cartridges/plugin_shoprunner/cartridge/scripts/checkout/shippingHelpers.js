'use strict';

var shippingHelpers = require('app_storefront_base/cartridge/scripts/checkout/shippingHelpers');

var baseGetApplicableShippingMethods = shippingHelpers.getApplicableShippingMethods.bind(shippingHelpers);

shippingHelpers.getApplicableShippingMethods = function (shipment, address) {
    if (!shipment) return null;

    var filteredMethods = baseGetApplicableShippingMethods(shipment, address);

    // If we don't have both a country and a state, use defaults in their place to ensure
    // ShopRunner is listed as a shipping method
    if (shipment && shipment.getShippingAddress()) {
        var stateCode = shipment.getShippingAddress().getStateCode();
        var countryCode = shipment.getShippingAddress().getCountryCode();

        if (!stateCode || countryCode.getValue() === '') {
            var ShippingMgr = require('dw/order/ShippingMgr');
            var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
            var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

            var addressObj = new Object(); // eslint-disable-line
            addressObj.countryCode = countryCode.getValue() !== '' ? countryCode.getValue() : 'US';
            addressObj.stateCode = stateCode ? stateCode : 'NY'; // eslint-disable-line
            addressObj.postalCode = shipment.getShippingAddress().getPostalCode();
            addressObj.city = shipment.getShippingAddress().getCity();

            var shippingMethods = shipmentShippingModel.getApplicableShippingMethods(addressObj);

            var iterator = shippingMethods.iterator();
            while (iterator.hasNext()) {
                var shippingMethod = iterator.next();
                if (shippingMethod.ID === 'shoprunner') {
                    filteredMethods.unshift(new ShippingMethodModel(shippingMethod, shipment));
                    break;
                }
            }
        }
    }

    return filteredMethods;
};

var baseSelectShippingMethod = shippingHelpers.selectShippingMethod.bind(shippingHelpers);

shippingHelpers.selectShippingMethod = function (shipment, shippingMethodID, shippingMethods, address) { // eslint-disable-line
    if (shippingMethodID === 'shoprunner' && !address) {
        var ShippingMgr = require('dw/order/ShippingMgr');
        shippingMethods = ShippingMgr.getAllShippingMethods(); // eslint-disable-line

        var isShipmentSet = false;

        var iterator = shippingMethods.iterator();
        while (iterator.hasNext()) {
            var shippingMethod = iterator.next();
            if (shippingMethod.ID === shippingMethodID) {
                shipment.setShippingMethod(shippingMethod);
                isShipmentSet = true;
                break;
            }
        }

        if (!isShipmentSet) {
            return baseSelectShippingMethod(shipment, shippingMethodID, shippingMethods, address);
        }
    } else {
        return baseSelectShippingMethod(shipment, shippingMethodID, shippingMethods, address);
    }
};

module.exports = shippingHelpers;
