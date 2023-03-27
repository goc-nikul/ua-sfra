/* globals empty */
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var ApplePayLogger = Logger.getLogger('ApplePay', 'Applepay');
var PaymentMgr = require('dw/order/PaymentMgr');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');

/* global session:true, dw */
module.exports.placeOrder = function (order) {
    session.privacy.ordertoken = order.getOrderToken();
    var returnURL = URLUtils.https('AurusPay-ReturnFromApplePay', 'ID', order.getOrderNo(), 'token', order.getOrderToken());
    return new ApplePayHookResult(new Status(Status.OK), returnURL);
};

/**
* This function handles the getSession call
* @returns {Object} aurusSession
*/
function getSession() {
    var aurusSession;

    try {
        var reqBody = aurusPayHelper.getSessionApplePay({ templateId: 1 });
        aurusSession = aurusPaySvc.getSessionService().call(reqBody);
    } catch (error) {
        ApplePayLogger.info('ERROR: Error while executing aurusOrderPayment.js script.', error);
    }

    if (aurusSession.ok) {
        aurusSession = JSON.parse(aurusSession.object.text);
    } else {
        aurusSession = null;
    }
    aurusSession.templateId = 1;
    return aurusSession;
}
/**
* This function handles the getSessionToken call
* @param {*} params - params
* @returns {Object} sessionTokenResponse
*/
function getSessionToken(params) {
    ApplePayLogger.info('ApplePay:authorizeOrderPayment->getSessionToken');
    var sessionTokenResponse = '';
    try {
        var reqBody = aurusPayHelper.getSessionTokenApplePay({ order: params.order, event: params.event, templateId: params.templateId, sessionId: params.sessionId });
        sessionTokenResponse = aurusPaySvc.getSessionTokenService().call(reqBody);
        ApplePayLogger.info(reqBody);
    } catch (err) {
        ApplePayLogger.error(err.toString());
        return null;
    }

    if (sessionTokenResponse.ok) {
        sessionTokenResponse = JSON.parse(sessionTokenResponse.object.text);
    } else {
        sessionTokenResponse = null;
    }

    return sessionTokenResponse;
}

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
* @returns {Object} Pre auth object from service call
*/
function aurusPreAuth(params) {
    var auth;
    try {
        var reqBody = aurusPayHelper.createAuthReqBodyApplePay(params);
        auth = aurusPaySvc.getAuthService().call(reqBody);
    } catch (error) {
        ApplePayLogger.info('ERROR: Error while executing pre auth.', error);
    }

    if (auth.ok) {
        auth = JSON.parse(auth.object.text);
    } else {
        auth = null;
    }
    return auth;
}

/**
* This function handles the getSessionToken call
* @param {dw.order} order - current order
* @param {Object} event -
* @returns {string} authorized
*/
function applePayAuthorize(order, event) {
    try {
        ApplePayLogger.info('ApplePay:authorizeOrderPayment->getSession');

        var sessionObj = getSession({ order: order, event: event });
        var sessionId = '';
        var tokenObject = '';
        var OneTimeToken = '';

        if (sessionObj.SessionResponse.ResponseText === 'APPROVAL') {
            sessionId = sessionObj.SessionResponse.SessionId;
        }

        if (sessionId !== '') {
            tokenObject = getSessionToken({ order: order, event: event, templateId: sessionObj.templateId, sessionId: sessionId });

            if (tokenObject.GetSessionTokenResponse.ResponseText === 'APPROVAL') {
                OneTimeToken = tokenObject.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
            }
        }
        var ott = { value: OneTimeToken };

        // Models for Auth call
        var BillingAddressModel = require('*/cartridge/models/billingAddress');
        var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
        var EcommInfoModel = require('*/cartridge/models/ecommInfo');
        var TransAmountDetails = require('*/cartridge/models/transactionDetails');
        var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');
        var cardType = '';

        // Prepare request body for auth call
        var aurusShippingAddress = new ShippingAddressModel({ shipping: order.defaultShipment.shippingAddress, email: order.customerEmail, phone: order.defaultShipment.shippingAddress.phone });
        var aurusEcommInfo = new EcommInfoModel({ storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'), oneTimeToken: ott, merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'), terminalId: aurusPayHelper.getTerminalID(order), cardId: '', oneOrderToken: '' });
        var aurusCardType = cardType;
        var aurusBillingAddress = new BillingAddressModel({ billing: order.billingAddress, email: order.customerEmail, phone: order.billingAddress.phone });
        var aurusTransAmountDetails = new TransAmountDetails(order);
        var aurusProducts = new Level3Products(order);
        var aurusInvoiceNumber = order.orderNo;

        var authResult = aurusPreAuth({ ShippingAddress: aurusShippingAddress, ECOMMInfo: aurusEcommInfo, cardType: aurusCardType, BillingAddress: aurusBillingAddress, TransAmountDetails: aurusTransAmountDetails, orderNo: aurusInvoiceNumber, Level3ProductsData: aurusProducts });

        // Auth Success
        var aurusPayResponseCode = Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode);

        ApplePayLogger.info('ApplePay->order.orderNo: ' + order.orderNo + ' aurusPayResponseCode: ' + aurusPayResponseCode);
        ApplePayLogger.info('ApplePay->order.orderNo: ' + order.orderNo + ' aurusPayProcessorResponseCode: ' + aurusPayResponseCode);

        if (aurusPayResponseCode > 0) {
            // Response code not 0000
            session.privacy.apResponseCode = aurusPayResponseCode;
            return {
                error: true,
                errorCode: aurusPayResponseCode
            };
        }

        var token = authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken : '';
        var cardIdentifier = authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier : '';

        var apInstruments = order.getPaymentInstruments('DW_APPLE_PAY');
        if (!empty(apInstruments) && 'payment' in event && 'token' in event.payment && 'paymentMethod' in event.payment.token) {
            var paymentInstrument = apInstruments[0];
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
            try {
                Transaction.wrap(function () {
                    paymentInstrument.paymentTransaction.setTransactionID(authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '');
                    paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
                    //  Here is where we set the one time order token
                    paymentInstrument.paymentTransaction.custom.aurusPayOOT = token;
                    paymentInstrument.paymentTransaction.custom.aurusPayAPTN = authResult.TransResponse.AurusPayTicketNum !== null ? authResult.TransResponse.AurusPayTicketNum : '';
                    paymentInstrument.paymentTransaction.custom.aurusPayAPTID = authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '';
                    paymentInstrument.paymentTransaction.custom.aurusPayCID = authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier : '';
                });
            } catch (e) {
                session.privacy.apResponseCode = aurusPayResponseCode;
                ApplePayLogger.error(e.toString() + ' ApplePay->apResponseCode: ' + aurusPayResponseCode);
                return {
                    error: true,
                    errorCode: aurusPayResponseCode
                };
            }
        }
        return {
            authorized: true,
            token: token,
            details: authResult.TransResponse.TransDetailsData.TransDetailData,
            cardIdentifier: cardIdentifier
        };
    } catch (err) {
        ApplePayLogger.info(err.toString());
        return new Status(Status.ERROR);
    }
}

/* eslint-disable no-param-reassign */
module.exports.authorizeOrderPayment = function (order, event) {
    var billingCountry = order.billingAddress.countryCode;
    var shippingCountry = order.shipments[0].shippingAddress.countryCode;

    if (!empty(billingCountry.value)) {
        billingCountry = billingCountry.value.toUpperCase();

    // No billing country is provided (probably an old address record from before country was required in iOS)
    } else if ('applePayAssumedCountryCode' in dw.system.Site.current.preferences.custom && !empty(dw.system.Site.getCurrent().getCustomPreferenceValue('applePayAssumedCountryCode'))) {
        billingCountry = dw.system.Site.getCurrent().getCustomPreferenceValue('applePayAssumedCountryCode').toUpperCase();
    } else {
        var error = new Status(Status.ERROR);
        error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
        return error;
    }
    order.billingAddress.countryCode = billingCountry;

    if (empty(shippingCountry.value)) {
        shippingCountry = billingCountry;
    } else {
        shippingCountry = shippingCountry.value.toUpperCase();
    }
    order.shipments[0].shippingAddress.countryCode = shippingCountry;
    // Set the phone number on the order:
    order.billingAddress.phone = event.payment.shippingContact.phoneNumber;

    var status = applePayAuthorize(order, event);
    var OrderMgr = require('dw/order/OrderMgr');
    var returnStatus = Status.ERROR;

    if (!empty(status.details.ResponseCode)) {
        Transaction.wrap(function () {
            if (OrderMgr.placeOrder(order) === Status.ERROR) {
                OrderMgr.failOrder(order, true);
            }

            order.setConfirmationStatus(dw.order.Order.CONFIRMATION_STATUS_CONFIRMED);
        });
        returnStatus = Status.OK;
    } else {
        OrderMgr.failOrder(order, true);
    }
    return new Status(returnStatus);
};
/* eslint-enable no-param-reassign */
