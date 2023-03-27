/* eslint-disable spellcheck/spell-checker */
'use strict';

var base = module.superModule;
var deliveryHelper = require('app_ua_core/cartridge/scripts/util/DeliveryHelper');

/**
 * This function takes deliveray date range as input and convert them to the formated date string
 * @param {Object} deliveryDates - delivery date range
 * @return {Object} - formated date string
 */
function formatedEstimatedDate(deliveryDates) {
    if (!deliveryDates) {
        return '';
    }
    var Resource = require('dw/web/Resource');
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');

    // eslint-disable-next-line no-undef
    var fromDate = StringUtils.formatCalendar(deliveryDates[0], request.locale, Calendar.SHORT_DATE_PATTERN);
    // eslint-disable-next-line no-undef
    var toDate = StringUtils.formatCalendar(deliveryDates[1], request.locale, Calendar.SHORT_DATE_PATTERN);
    var arrivalDate = '';
    if (fromDate.equals(toDate)) {
        arrivalDate = fromDate;
    } else {
        arrivalDate = fromDate + ' - ' + toDate;
    }

    return Resource.msgf('shipping.deliverydate', 'checkout', null, arrivalDate);
}

/**
 * Returns getShippingCostValue property for a specific Shipment / ShippingMethod pair
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} shipment - a shipment of the current basket
 * @returns {string} String representation of Shipping Cost
 */
function getShippingCostValue(shippingMethod, shipment) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);

    return shippingCost.amount.value;
}

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} [shipment] - a Shipment
 */
function ShippingMethodModel(shippingMethod, shipment) {
    base.call(this, shippingMethod, shipment);
    const Site = require('dw/system/Site');
    if ('isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled')) {
        this.storePickupEnabled = shippingMethod.custom && shippingMethod.custom.storePickupEnabled ? shippingMethod.custom.storePickupEnabled : false;
        var isEnableIncludeBopisShipmentCost = 'isIncludeBopisShipmentCost' in shippingMethod.custom ? shippingMethod.custom.isIncludeBopisShipmentCost : false;
        if (shippingMethod && isEnableIncludeBopisShipmentCost) {
            var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
            var collections = require('*/cartridge/scripts/util/collections');
            var ShippingMgr = require('dw/order/ShippingMgr');
            var BasketMgr = require('dw/order/BasketMgr');
            var basket = BasketMgr.getCurrentBasket();
            if (basket !== null && instorePickupStoreHelpers.basketHasInStorePickUpShipment(basket.shipments) && !instorePickupStoreHelpers.basketHasOnlyBOPISProducts(basket.shipments)) {
                var totalShipmentCostThreshold = 'totalShipmentCostThreshold' in Site.current.preferences.custom ? Site.getCurrent().getCustomPreferenceValue('totalShipmentCostThreshold') : null;
                var shipmentCost = 0;
                collections.forEach(basket.getShipments(), function (shipmentItr) {
                    shipmentCost += shipmentItr.adjustedMerchandizeTotalPrice.value;
                });
                if (shipmentCost !== 0 && shipmentCost >= totalShipmentCostThreshold) {
                    var Money = require('dw/value/Money');
                    var ShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
                    this.shippingCost = require('dw/util/StringUtils').formatMoney(new Money(0, ShippingModel.getShippingCost(shippingMethod).amount.currencyCode));
                }
            }
        }
        this.isIncludeBopisShipmentCost = isEnableIncludeBopisShipmentCost;
    }
    this.shippingDeliveryDates = formatedEstimatedDate(deliveryHelper.getShippingDeliveryDates(shippingMethod, false));
    this.raw = shippingMethod;
    if (shipment) {
        // Optional model information available with 'shipment' parameter
        this.shippingCostVal = getShippingCostValue(shippingMethod, shipment);
    }
}

module.exports = ShippingMethodModel;
