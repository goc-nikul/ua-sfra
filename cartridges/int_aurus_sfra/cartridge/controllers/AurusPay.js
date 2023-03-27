'use strict';

var server = require('server');
var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var BasketMgr = require('dw/order/BasketMgr');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');

/* global session:true, request, shippingAddress:true */

server.get('GetPayPalSession', server.middleware.https, function (req, res, next) {
    var payPalSession;

    try {
        var reqBody = aurusPayHelper.getPayPalReqBody();
        payPalSession = aurusPaySvc.getSessionService().call(reqBody);
    } catch (error) {
        Logger.info('ERROR: Error while executing aurusPayServices.js script.', error);
    }

    if (payPalSession.ok) {
        payPalSession = payPalSession.object.text;
        // Set a custom session variable
        var sessionId = JSON.parse(payPalSession).SessionResponse.SessionId;
        session.privacy.aurusPPSession = sessionId;
    } else {
        payPalSession = null;
        session.privacy.aurusPPSession = null;
    }

    res.json({
        session: payPalSession
    });

    return next();
});

server.post('ReturnFromApplePay', server.middleware.https, function (req, res, next) {
    var redirectURL = URLUtils.https('Order-Confirm', 'ID', request.httpParameterMap.ID.stringValue, 'token', request.httpParameterMap.token);
    res.redirect(redirectURL);
    return next();
});


server.get('GetGooglePaySession', server.middleware.https, function (req, res, next) {
    var googlePaySession;

    try {
        var reqBody = aurusPayHelper.getGooglePayReqBody();
        googlePaySession = aurusPaySvc.getSessionService().call(reqBody);
    } catch (error) {
        Logger.info('ERROR: Error while executing aurusPayServices.js script.', error);
    }

    if (googlePaySession.ok) {
        googlePaySession = googlePaySession.object.text;
        // Set a custom session variable
        var sessionId = JSON.parse(googlePaySession).SessionResponse.SessionId;
        session.privacy.aurusGPSession = sessionId;
    } else {
        googlePaySession = null;
        session.privacy.aurusPPSession = null;
    }

    res.json({
        session: googlePaySession
    });

    return next();
});

server.get('ReturnFromPayPal', server.middleware.https, function (req, res, next) {
    var basket = BasketMgr.getCurrentBasket();
    var result = aurusPayHelper.returnFromPaypal(basket);

    var baToken = result.ba_token;
    var token = result.token;

    session.privacy.ba_token = baToken;
    session.privacy.token = token;

    res.redirect(result.redirectUrl);
    next();
});

server.get('ReturnFromGooglePay', server.middleware.https, function (req, res, next) {
    var basket = BasketMgr.getCurrentBasket();
    var result = aurusPayHelper.returnFromGooglePay(basket);

    var gpToken = result.gp_token;

    var billingAddress = {
        BillingName: result.paymentData.get('[paymentMethodData][info][billingAddress][name]'),
        BillingAddressLine1: result.paymentData.get('[paymentMethodData][info][billingAddress][address1]'),
        BillingAddressLine2: (!result.paymentData.get('[paymentMethodData][info][billingAddress][address2]') && result.paymentData.get('[paymentMethodData][info][billingAddress][address2]') !== null) ? result.paymentData.get('[info][billingAddress][address2]') : '',
        BillingCity: result.paymentData.get('[paymentMethodData][info][billingAddress][locality]'),
        BillingState: result.paymentData.get('[paymentMethodData][info][billingAddress][administrativeArea]'),
        BillingZip: result.paymentData.get('[paymentMethodData][info][billingAddress][postalCode]'),
        BillingCountry: result.paymentData.get('[paymentMethodData][info][billingAddress][countryCode]'),
        BillingMobileNumber: result.paymentData.get('[paymentMethodData][info][billingAddress][phoneNumber]')
    };

    var country = billingAddress.BillingCountry;

    session.privacy.gp_token = gpToken.value;
    session.privacy.BillingName = billingAddress.BillingName.value;
    session.privacy.BillingAddressLine1 = billingAddress.BillingAddressLine1.value;
    session.privacy.BillingAddressLine2 = (!billingAddress.BillingAddressLine2.value && billingAddress.BillingAddressLine2.value !== null) ? billingAddress.BillingAddressLine2.value : '';
    session.privacy.BillingCity = billingAddress.BillingCity.value;
    session.privacy.BillingState = billingAddress.BillingState.value;
    session.privacy.BillingZip = billingAddress.BillingZip.value;
    session.privacy.BillingCountry = country.value;
    session.privacy.BillingMobileNumber = billingAddress.BillingMobileNumber.value;
    session.privacy.BillingEmail = result.contactEmail.value;

    res.redirect(result.redirectUrl);
    next();
});

server.get('GetSession', server.middleware.https, function (req, res, next) {
    var session;
    try {
        var uuid = request.httpParameterMap.ccId.stringValue; // eslint-disable-line
        var reqBody = aurusPayHelper.getSessionReqBody(req, uuid);
        session = aurusPaySvc.getSessionService().call(reqBody);
    } catch (error) {
        Logger.info('ERROR: Error while executing aurusPayServices.js script.', error);
    }

    if (session.ok) {
        session = session.object.text;
    } else {
        session = null;
    }

    res.json({
        session: session
    });

    return next();
});

server.get('GetGooglePaySessionToken', server.middleware.https, function (req, res, next) {
    try {
        var uuid = request; // eslint-disable-line
        var reqBody = aurusPayHelper.getGooglePaySessionTokenReqBody(req, uuid);
        session = aurusPaySvc.getBillingToken().call(reqBody);
    } catch (error) {
        Logger.info('ERROR: Error while executing aurusPayServices.js script.', error);
    }

    if (session.ok) {
        session = session.object.text;
    } else {
        session = null;
    }

    res.json({
        session: session
    });

    return next();
});

server.get('GetBillerToken', server.middleware.https, function (req, res, next) {
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
            var reqBody = aurusPayHelper.getPayPalTokenReqBody(shippingAddress, req, uuid);
            session = aurusPaySvc.getBillingToken().call(reqBody);
        } catch (error) {
            Logger.info('ERROR: Error while executing aurusPayServices.js script.', error);
        }

        if (session.ok) {
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

module.exports = server.exports();
