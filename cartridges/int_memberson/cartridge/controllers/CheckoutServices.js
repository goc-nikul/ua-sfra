/* eslint-disable block-scoped-var */
/* eslint-disable spellcheck/spell-checker */
'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');

server.append('PlaceOrder', function (req, res, next) {
    var viewData = res.getViewData();
    if ('error' in viewData && viewData.error && 'membersonRemoveCoupon' in viewData && viewData.membersonRemoveCoupon) {
        // Helper files includes
        var currentBasket = BasketMgr.getCurrentBasket();
        var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');
        membersonHelpers.checkIfMembersonCouponApplied(currentBasket, req.currentCustomer.raw);
    }

    return next();
});

module.exports = server.exports();
