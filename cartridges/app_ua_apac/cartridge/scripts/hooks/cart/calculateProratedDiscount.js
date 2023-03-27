'use strict';
var Decimal = require('dw/util/Decimal');
var Transaction = require('dw/system/Transaction');

/**
 * Updates prorated order discount on line item
 * @param {dw.order.Basket} basket dw order
 */
exports.calculateProratedDiscount = (basket) => {
    try {
        var productLineItems = basket.getAllProductLineItems().iterator();
        Transaction.begin();
        while (productLineItems.hasNext()) {
            var productLineItem = productLineItems.next();
            // set prorated order level discount amount, if applicable
            try {
                var pliDiscount = new Decimal(productLineItem.price.value - productLineItem.proratedPrice.value);
                productLineItem.custom.proratedOrderLevelDiscount = pliDiscount.round(2);
            } catch (e) {
                productLineItem.custom.proratedOrderLevelDiscount = 0;
            }
        }
        Transaction.commit();
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('Could not calculate prorated discount ' + e);
        Transaction.rollback();
    }
};
