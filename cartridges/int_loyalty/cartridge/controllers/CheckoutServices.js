'use strict';

var server = require('server');
var Logger = require('dw/system/Logger').getLogger('Loyalty');
const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
var BasketMgr = require('dw/order/BasketMgr');
server.extend(module.superModule);

server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    try {
        loyaltyHelper.removeInvalidLoyaltyCoupons(currentBasket);
    } catch (e) {
        Logger.error('Error while removing invalid coupon code from basket before placing an order :: {0}', e.message);
    }
    return next();
});

module.exports = server.exports();
