'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend('ExpressCheckout', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var collections = require('*/cartridge/scripts/util/collections');
    var KlarnaPaymentsConstants = require('*/cartridge/scripts/util/klarnaPaymentsConstants');
    var currentBasket = BasketMgr.getCurrentBasket();
    var PAYMENT_METHOD = KlarnaPaymentsConstants.PAYMENT_METHOD;

    if (!currentBasket) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(PAYMENT_METHOD);
        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });
    });
    return next();
});

server.append('ExpressCheckout', function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var userSession = req.session.raw;
    if (COHelpers.isKlarnaPaymentEnabled() || !empty(userSession.privacy.KlarnaPaymentsSessionID)) {
        var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');

        var klarnaSessionManager = new KlarnaSessionManager();
        klarnaSessionManager.createOrUpdateSession();
    }

    return next();
});

module.exports = server.exports();
