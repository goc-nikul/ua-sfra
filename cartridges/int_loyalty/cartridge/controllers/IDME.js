'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Return', function (req, res, next) {
    const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
    const currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    if (!loyaltyHelper.isLoyaltyEnabled() || !loyaltyHelper.isLoyalCustomer()) {
        return next();
    }
    if (empty(currentBasket)) {
        return next();
    }
    const Transaction = require('dw/system/Transaction');
    const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    loyaltyHelper.estimate(currentBasket);

    return next();
});

module.exports = server.exports();
