'use strict';

var Status = require('dw/system/Status');
var ShippingMgr = require('dw/order/ShippingMgr');

/**
 * Calculate shipping cost including Paazl selected option's cost.
 * @param {dw.order.Basket} basket - the current basket
 * @returns {dw.system.Status} Status - status
 */
function calculateShipping (basket) {
	// Check if Paazl is enable and selected as shipping method
    var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
    var paazlStatus = paazlHelper.getPaazlStatus(basket.defaultShipment);
    ShippingMgr.applyShippingCost(basket);
    if (paazlStatus.active) {
        // override default sfcc calculation of shipping cost
        paazlHelper.calculateShipping(basket);
    }
    return new Status(Status.OK);
}
exports.calculateShipping = calculateShipping;
