'use strict';

var Money = require('dw/value/Money');
var Resource = require('dw/web/Resource');

var formatMoney = require('dw/util/StringUtils').formatMoney;

/**
 * Returns shippingCost property for the selected shipping option
 * @param {number} shippingCost - the shippingCost value of the selected shipping option
 * @returns {string} String representation of Shipping Cost
 */
function getShippingCost (shippingCost) {
    var cost = new Money(shippingCost, session.getCurrency()); // eslint-disable-line no-undef
    return formatMoney(cost);
}


/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {Object} paazlDeliveryInfo - JSON object of the Paazl delivery info
 */
function PaazlShippingMethodModel (paazlDeliveryInfo) {
    var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
    this.ID = paazlHelper.getShippingMethodID();

    var displayName;

    if (paazlDeliveryInfo && paazlDeliveryInfo.carrierDescription) {
        displayName = paazlDeliveryInfo.carrierDescription;
        if (paazlDeliveryInfo.name) {
            displayName += ' - ' + paazlDeliveryInfo.name;
        }
    } else if (paazlDeliveryInfo && paazlDeliveryInfo.name) {
        displayName = paazlDeliveryInfo.name;
    } else if (paazlDeliveryInfo && paazlDeliveryInfo.deliveryType) {
        displayName = paazlDeliveryInfo.deliveryType;
    } else {
        displayName = Resource.msg('default.shipping.name', 'paazl', null);
    }

    this.displayName = displayName;

    this.shippingCost = getShippingCost((paazlDeliveryInfo && paazlDeliveryInfo.cost) || 0);
}

module.exports = PaazlShippingMethodModel;
