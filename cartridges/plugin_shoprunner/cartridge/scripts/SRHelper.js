'use strict';

/**
 * Helper controller used to execute int_shoprunner scripts from storefront cartridge controllers.
 * This is done to make cartridge integration simpler as well as make future adjustments to scripts easier.
 *
 * @module controllers/SRHelper
 */

  /* API includes */
var Transaction = require('dw/system/Transaction');

/**
 * get Applicable Shipping Methods
 * @param {dw.order.ShipmentShippingModel} params - Shipment
 * @return {dw.order.ShipmentShippingModel} - applicable shipping methods
 */
function getApplicableShippingMethods(params) {
    var applicableMethods;
    Transaction.wrap(function () {
        applicableMethods = require('int_shoprunner/cartridge/scripts/checkout/GetApplicableShippingMethods').getMethods(params);
    });
    return applicableMethods;
}

/**
 * Delete shop runner cookie
 */
function deleteShopRunnerCookie() {
    require('int_shoprunner/cartridge/scripts/DeleteShopRunnerCookie').deleteCookie();
    return;
}


/**
 * check Cart Eligibility
 * @param {dw.order.Basket} cart - basket
 * @return {string} - applicable shipping methods
 */
function checkCartEligibility(cart) {
    var result = require('int_shoprunner/cartridge/scripts/checkout/CheckCartEligibility').checkEligibility(cart);
    return result;
}

/*
 * Private methods
 */
exports.GetApplicableShippingMethods = getApplicableShippingMethods;
exports.DeleteShopRunnerCookie = deleteShopRunnerCookie;
exports.CheckCartEligibility = checkCartEligibility;
