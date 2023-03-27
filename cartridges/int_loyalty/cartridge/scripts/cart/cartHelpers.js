'use strict';

/**
 * This module extends cartHelpers.js as defined in app_ua_core. It exports
 * everything from the base module and overrides or adds to module.exports.
 */

var base = require('app_ua_core/cartridge/scripts/cart/cartHelpers');

/**
* Removes product from the cart.
* @param {string} productId - the productId of the product being added to the cart
* @return {boolean} returns true if product has been removed
*/
function removeProductFromCart(productId) {
    const BasketMgr = require('dw/order/BasketMgr');
    const Transaction = require('dw/system/Transaction');
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    const currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        return false;
    }

    let isProductLineItemFound = false;

    Transaction.wrap(function () {
        if (!empty(productId)) {
            var productLineItems = currentBasket.getAllProductLineItems(productId);
            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                if ((item.productID === productId)) {
                    var shipmentToRemove = item.shipment;
                    currentBasket.removeProductLineItem(item);
                    if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                        currentBasket.removeShipment(shipmentToRemove);
                    }
                    isProductLineItemFound = true;
                    break;
                }
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    return isProductLineItemFound;
}

base.removeProductFromCart = removeProductFromCart;
module.exports = base;
