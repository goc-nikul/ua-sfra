'use strict';

var base = module.superModule;

var basketHelper = require('~/cartridge/scripts/basketHelper');

// eslint-disable-next-line no-unused-vars
base.modifyPATCHResponse = function (basket, basketResponse, productItemId) {
    return basketHelper.updateResponse(basketResponse, {
        payment: basketHelper.getPaymentRequest(),
        sessionID: basketHelper.getSessionIDRequest(),
        hook: 'basket.modifyPATCHResponse'
    });
};

module.exports = base;
