'use strict';
var base = module.superModule;

/**
 * @constructor
 * @classdesc CartModel class that represents the current basket
 *
 * @param {dw.order.Basket} basket - Current users's basket
 */
function CartModel(basket) {
    base.call(this, basket);

    if (basket && 'custom' in basket && 'loyaltyPointsBalance' in basket.custom) {
        this.loyaltyPointsBalance = basket.custom.loyaltyPointsBalance;
    }
    const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    this.isLoyaltyEnabled = PreferencesUtil.getValue('isLoyaltyEnable');
}


module.exports = CartModel;
