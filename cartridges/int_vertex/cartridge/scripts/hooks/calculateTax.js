'use strict';

var HookMgr = require('dw/system/HookMgr');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

/**
 * @function calculateTax
 *
 * Vertex service tax calculation
 * Use service for order calculation, and in case of fallback use default DW tax hooks
 * @param {dw.order.Basket} basket The basket containing the elements for which taxes need to be calculated
 */
exports.calculateTax = function(basket) {
    var Vertex = require('~/cartridge/scripts/Vertex');
    var Helper = require('~/cartridge/scripts/helper/Helper');

    var isAvailableShipAddress = (basket.defaultShipment.shippingAddress && 
                                basket.defaultShipment.shippingAddress.postalCode &&
                                basket.defaultShipment.shippingAddress.countryCode.value) ? true : false;
    if (Vertex.isEnabled()) {
        if (isAvailableShipAddress) {
            // Compare basket state hash
            var isValidHash = false;
            if (Vertex.isHashEnabled()) {
                var cachedBasketHash = session.privacy['taxRequestHash'];
                var currentBasketHash = Helper.getBasketHash(basket);
                isValidHash = cachedBasketHash === currentBasketHash;
            }

            if (!isValidHash) {
                // Trigger service API
                var result = Vertex.CalculateTax('Quotation', basket);

                if (!result || !result.result) {
                    Transaction.wrap(function() {
                        var vertexTaxDetails = new dw.util.HashSet();
                        vertexTaxDetails.add('Error: SERVICE_UNAVAILABLE OR ERROR RESPONSE');
                        basket.custom.vertex_Taxation_Details = JSON.stringify(vertexTaxDetails.toArray());
                    });
                    // Service error, trigger default calculations
                    HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);
                } else if (Vertex.isHashEnabled()){
                    // Add basket hash to track its modifications
                    session.privacy['taxRequestHash'] = currentBasketHash;
                }
            } else {
                Helper.recalculatePriceAdjustmentsTax(basket);
            }

            // Do not trigger API nor recalculate taxes if hash is valid

        } else {
            Helper.prepareCart(basket);
            HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);
        }
    } else {
        HookMgr.callHook('dw.order.calculateTax', 'calculateTax', basket);
    }

    return new Status(Status.OK);
}
