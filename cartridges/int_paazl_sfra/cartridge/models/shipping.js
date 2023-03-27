'use strict';

var base = module.superModule;
var PaazlShippingMethodModel = require('*/cartridge/models/shipping/paazlShippingMethod');
var logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');

/**
 * @constructor
 * @classdesc Model that represents shipping information
 *
 * @param {dw.order.Shipment} shipment - the default shipment of the current basket
 * @param {Object} address - the address to use to filter the shipping method list
 * @param {Object} customer - the current customer model
 * @param {string} containerView - the view of the product line items (order or basket)
 */
function ShippingModel (shipment, address, customer, containerView) { // eslint-disable-line no-unused-vars
    base.apply(this, arguments);
    var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
    var currentPaazlShippingMethodID = paazlHelper.getShippingMethodID();
    var paazlStatus = paazlHelper.getPaazlStatus(shipment);
    if (paazlStatus.active && shipment && shipment.custom.paazlDeliveryInfo) {
        // In case of PICKUP_LOCATION, get the PICKUP_LOCATION to use in the shipping summary
        this.pickupPointAddress = null;
        var paazlDeliveryInfo = null;
        try {
            paazlDeliveryInfo = JSON.parse(shipment.custom.paazlDeliveryInfo);
            if (paazlDeliveryInfo && paazlDeliveryInfo.deliveryType) {
                this.paazlDeliveryType = paazlDeliveryInfo.deliveryType;
            }
            if (paazlDeliveryInfo && paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION' && paazlDeliveryInfo.pickupLocation && paazlDeliveryInfo.pickupLocation.address) {
                this.pickupPointAddress = paazlDeliveryInfo.pickupLocation.address;
            }
        } catch (error) {
            this.pickupPointAddress = this.shippingAddress;
            logger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', error);
        }
        this.selectedShippingMethod = new PaazlShippingMethodModel(paazlDeliveryInfo);
    } else if (shipment && shipment.shippingMethodID === currentPaazlShippingMethodID && shipment.custom.paazlSelectedShippingMethod) {
        this.selectedShippingMethod.displayName = shipment.custom.paazlSelectedShippingMethod;
    }
}

module.exports = ShippingModel;
