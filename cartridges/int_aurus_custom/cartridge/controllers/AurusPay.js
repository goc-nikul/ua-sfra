'use strict';

var server = require('server');

server.extend(module.superModule);

var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var basketHelper = require('~/cartridge/scripts/basketHelper');
var Logger = require('dw/system/Logger').getLogger('AurusPay', 'Auruspay');
var BasketMgr = require('dw/order/BasketMgr');
var safetyPayCheckoutSessionModel = require('*/cartridge/scripts/util/checkoutSessionHelper');
var Constants = require('*/cartridge/scripts/constants/constants.js');

server.get('GetAltPaymentSession', server.middleware.https, function (req, res, next) {
    let sessionId = (typeof session !== 'undefined' && typeof session.privacy !== 'undefined' && typeof session.privacy.aurusSessionID !== 'undefined' ? session.privacy.aurusSessionID : null);
    try {
        aurusPayHelper.validateAurusSession();
        // Need to set sessionID again after validate .. in case it got updated.
        sessionId = session.privacy.aurusSessionID;
    } catch (error) {
        Logger.error('ERROR: Error while executing AurusPay-GetAltPaymentSession :: {0}', JSON.stringify(error));
    }

    res.json({
        session: sessionId
    });

    return next();
});

server.get('GetAltPaymentsConsumerObj', server.middleware.https, function (req, res, next) {
    var consumerObject;
    var order;
    var basket = BasketMgr.getCurrentBasket();
    var OrderMgr = require('dw/order/OrderMgr');
    try {
        if (!empty(session.custom.orderNumber)) {
            order = OrderMgr.getOrder(session.custom.orderNumber);
        }

        if (!empty(order) && order.getPaymentInstruments(Constants.AURUS_SAFETYPAY).length > 0 && basket && basket.getPaymentInstruments(Constants.AURUS_OXXO).length > 0) {
            delete session.custom.orderNumber;
            order = null;
        }

        if (!empty(order)) {
            consumerObject = aurusPayHelper.getAltPaymentsConsumerObject(req, order, order.orderNo);
        } else {
            consumerObject = aurusPayHelper.getAltPaymentsConsumerObject(req, basket);
        }
    } catch (error) {
        Logger.error('ERROR: Error while executung Aurus-GetAltPaymentsConsumerObj :: error message : {0} :: customer browser details : {1} :: customer authenticated : {2} :: paymentType : {3}', error.message, request.httpUserAgent, session.customerAuthenticated, 'Klarna');
    }

    res.json({
        consumerObject: consumerObject
    });

    return next();
});

server.get('GetPaypalConsumerObj', server.middleware.https, function (req, res, next) {
    var consumerObject;
    try {
        var basket = BasketMgr.getCurrentBasket();
        if (basket && basket.totalGrossPrice && basket.totalGrossPrice.value) {
            consumerObject = aurusPayHelper.getPaypalConsumerObject(req, basket);
        }
    } catch (error) {
        Logger.error('ERROR: Error while executing Aurus-GetPaypalConsumerObj :: error message : {0} :: customer browser details : {1} :: customer authenticated : {2}', error.message, request.httpUserAgent, session.customerAuthenticated);
    }

    res.json({
        consumerObject: consumerObject
    });

    return next();
});

server.replace('ReturnFromPayPal', server.middleware.https, function (req, res, next) {
    var result = {};
    try {
        var basket = BasketMgr.getCurrentBasket();
        result = aurusPayHelper.returnFromPaypal(basket, req);
        if (result.ott && result.payWallet) {
            session.privacy.ott = result.ott;
            session.privacy.payWallet = result.payWallet;
            session.privacy.aurusSessionID = null;
        }
    } catch (error) {
        Logger.error('ERROR: Error while executung Aurus-ReturnFromPayPal : {0} :: customer browser details : {1} :: customer authenticated : {2} :: paymentType : {3}', error.message, request.httpUserAgent, session.customerAuthenticated, 'PayPal');
    }
    res.json({
        redirectUrl: result.redirectUrl && result.redirectUrl.toString()
    });
    next();
});

server.replace('GetSession', server.middleware.https, function (req, res, next) {
    var session;
    try {
        session = aurusPayHelper.getSessionService();
    } catch (error) {
        Logger.error('ERROR: Error while executing Aurus-GetSession :: {0}', error.message);
    }

    if (typeof session !== 'undefined' && session.ok) {
        session = session.object.text;
    } else {
        session = null;
    }

    res.json({
        session: session
    });

    return next();
});

server.replace('GetBillerToken', server.middleware.https, function (req, res, next) {
    var session;
    var currentBasket = BasketMgr.currentBasket;
    var shippingAddress = null;

    if (currentBasket !== null && currentBasket.defaultShipment.shippingAddress !== null) {
        shippingAddress = {
            country: currentBasket.defaultShipment.shippingAddress.countryCode.value,
            firstName: currentBasket.defaultShipment.shippingAddress.firstName,
            lastName: currentBasket.defaultShipment.shippingAddress.lastName,
            address: currentBasket.defaultShipment.shippingAddress.address1,
            address2: currentBasket.defaultShipment.shippingAddress.address2,
            city: currentBasket.defaultShipment.shippingAddress.city,
            state: currentBasket.defaultShipment.shippingAddress.stateCode,
            postal: currentBasket.defaultShipment.shippingAddress.postalCode
        };
    }

    if (shippingAddress !== null) {
        try {
            var uuid = request; // eslint-disable-line
            var isPayPal = request.httpParameterMap.paypal.stringValue; // eslint-disable-line
            session = aurusPayHelper.getBillingToken({
                shippingAddress: shippingAddress,
                req: req,
                uuid: uuid,
                payment: basketHelper.getPaymentRequest()
            });
        } catch (error) {
            Logger.error('ERROR: Error while executing Aurus-GetBillerToken :: {0}', error.message);
        }

        if (session && session.ok) {
            session = session.object.text;
        } else {
            session = null;
        }
    }
    res.json({
        session: session
    });

    return next();
});

server.get('SafetyPayCallback', server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var HookMgr = require('dw/system/HookMgr');
    var URLUtils = require('dw/web/URLUtils');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Transaction = require('dw/system/Transaction');
    safetyPayCheckoutSessionModel.removeSafetypayOrder();
    session.privacy.ott = req.querystring.ott;
    var order;
    if (!empty(session.custom.orderNumber)) {
        order = OrderMgr.getOrder(session.custom.orderNumber);
    }
    if (!order) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    var result;
    var pis = order.getPaymentInstruments(Constants.AURUS_SAFETYPAY);
    var processor = PaymentMgr.getPaymentMethod(Constants.AURUS_SAFETYPAY).getPaymentProcessor();
    if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
        result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
            'Authorize',
            order.orderNo,
            pis[0],
            processor
        );
    } else {
        result = HookMgr.callHook('app.payment.processor.default', 'Handle');
    }
    if (!result.error) {
        var placeOrderResult = COHelpers.placeOrder(order);

        if (placeOrderResult.error) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment').toString());
            return next();
        }
        res.redirect(URLUtils.https('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
    } else {
        COHelpers.failOrder(order);
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment').toString());
    }
    Transaction.wrap(function () {
        if (customer.authenticated) {
            order.setCustomerEmail(customer.getProfile().getEmail());
        }
    });
    delete session.custom.orderNumber;
    return next();
});

server.get('SafetyPayErrorCallback', server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var order;
    safetyPayCheckoutSessionModel.removeSafetypayOrder();
    if (!empty(session.custom.orderNumber)) {
        order = OrderMgr.getOrder(session.custom.orderNumber);
    }
    if (!order) {
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }
    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
    });
    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment').toString());
    delete session.custom.orderNumber;
    return next();
});

module.exports = server.exports();
