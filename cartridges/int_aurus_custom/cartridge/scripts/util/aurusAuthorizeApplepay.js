'use strict';

var Site = require('dw/system/Site');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var Logger = require('dw/system/Logger').getLogger('AurusApplePay', 'AurusApplePay');
var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');
var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
/**
* This function handles the getSession call
* @param {Object} order - order object
* @returns {Object} aurusSession
*/
function getSession(order) {
    var aurusSession;

    try {
        var reqBody = aurusPayHelper.createAltPaymentSessionReqBody(order);
        aurusSession = aurusPaySvc.getSessionService().call(reqBody);

        if (aurusSession.ok) {
            aurusSession = JSON.parse(aurusSession.object.text);
        } else {
            aurusSession = null;
        }
    } catch (error) {
        errorLogger.error('getSession {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject(order));
        Logger.error('ERROR: Error while executing applepay getSession request :: {0}', error.message);
    }
    return aurusSession;
}

/**
* This function handles the getSessionToken call
* @param {*} params - params
* @returns {Object} sessionTokenResponse
*/
function getSessionToken(params) {
    Logger.info('ApplePay:authorizeOrderPayment->getSessionToken');
    var sessionTokenResponse;
    try {
        var reqBody = aurusPayHelper.getSessionTokenApplePay({ order: params.order, event: params.event, templateId: params.templateId, sessionId: params.sessionId });
        sessionTokenResponse = aurusPaySvc.getSessionTokenService().call(reqBody);

        if (sessionTokenResponse.ok) {
            sessionTokenResponse = JSON.parse(sessionTokenResponse.object.text);
        } else {
            sessionTokenResponse = null;
        }
    } catch (err) {
        errorLogger.error('getSessionToken {0} : {1}', JSON.stringify(err), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing applepay getSessionToken request :: {0}', err.message);
        return null;
    }

    return sessionTokenResponse;
}

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
* @param {dw.order} order - the current order
* @returns {Object|null} Pre auth object from service call
*/
function aurusPreAuth(params, order) {
    Logger.info('ApplePay:authorizeOrderPayment->TransactionRequest');
    var auth = null;
    try {
        var reqBody = aurusPayHelper.createAuthReqBodyApplePay(params);
        auth = aurusPaySvc.getAuthService().call(reqBody);

        if (auth.ok) {
            auth = JSON.parse(auth.object.text);
        } else {
            if (auth && auth.errorMessage && order) {
                Transaction.wrap(function () {
                    order.trackOrderChange('Credit Card Authorization Issue: ' + auth.errorMessage);
                });
            }
            auth = null;
        }
    } catch (error) {
        errorLogger.error('aurusPreAuth {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing applepay pre-auth request :: {0}', error.message);
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Authorization Issue', JSON.stringify(error).substring(0, 4000));
            });
        }
    }
    return auth;
}

/**
* This function handles the auth call
* @param {Object} order order object for applepay
* @param {Object} event event object for applepay authorizeOrderPayment hook
* @returns {Object} Pre auth response from service call
*/
function aurusAuthorizeApplepay(order, event) {
    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddress');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');
    var cardType = '';
    var sessionId = '';
    var tokenObject = '';
    var OneTimeToken = '';
    Logger.info('ApplePay:authorizeOrderPayment->getSession');
    var sessionObj = getSession(order);

    if (sessionObj && sessionObj.SessionResponse && sessionObj.SessionResponse.ResponseText === 'APPROVAL') {
        sessionId = sessionObj.SessionResponse.SessionId;
    } else {
        errorLogger.error('ERROR: Error in applePay getSession response {0}', LogHelper.getLoggingObject(order));
        Logger.error('ERROR: Error in applePay getSession response');
        return {
            error: true
        };
    }

    if (sessionId !== '') {
        tokenObject = getSessionToken({ order: order, event: event, templateId: '1', sessionId: sessionId });

        if (tokenObject && tokenObject.GetSessionTokenResponse && tokenObject.GetSessionTokenResponse.ResponseText === 'APPROVAL') {
            OneTimeToken = tokenObject.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
        } else {
            errorLogger.error('ERROR: Error in applePay getSessionToken response {0}', LogHelper.getLoggingObject(order));
            Logger.error('ERROR: Error in applePay getSessionToken response');
            return {
                error: true
            };
        }
    }
    var ott = OneTimeToken;
    // Prepare request body for auth call
    var aurusShippingAddress = new ShippingAddressModel({ shipping: order.defaultShipment.shippingAddress, email: order.customerEmail, phone: order.defaultShipment.shippingAddress.phone });
    var aurusEcommInfo = new EcommInfoModel({ storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'), oneTimeToken: ott, merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'), terminalId: aurusPayHelper.getTerminalID(order), cardId: '', oneOrderToken: '' });
    var aurusCardType = cardType;
    var aurusBillingAddress = new BillingAddressModel({ billing: order.billingAddress, email: order.customerEmail, phone: order.billingAddress.phone });
    var aurusTransAmountDetails = new TransAmountDetails(order);
    var aurusProducts = new Level3Products(order);
    var aurusInvoiceNumber = order.orderNo;
    var authResult = aurusPreAuth({ ShippingAddress: aurusShippingAddress, ECOMMInfo: aurusEcommInfo, cardType: aurusCardType, BillingAddress: aurusBillingAddress, TransAmountDetails: aurusTransAmountDetails, orderNo: aurusInvoiceNumber, Level3ProductsData: aurusProducts, currencyCode: order.currencyCode });
    if (empty(authResult) || empty(authResult.TransResponse) || empty(authResult.TransResponse.TransDetailsData) || empty(authResult.TransResponse.TransDetailsData.TransDetailData)) {
        errorLogger.error('ERROR: Error in auruspay Applepay Pre-Auth response object {0}', LogHelper.getLoggingObject(order));
        Logger.error('ERROR: Error in auruspay Applepay Pre-Auth response object');
        return {
            error: true
        };
    }
    // Auth Success
    var aurusPayResponseCode = Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode);
    Logger.info('ApplePay->order.orderNo: ' + order.orderNo + ' aurusPayResponseCode: ' + aurusPayResponseCode);
    Logger.info('ApplePay->order.orderNo: ' + order.orderNo + ' aurusPayProcessorResponseCode: ' + aurusPayResponseCode);
    if (aurusPayResponseCode > 0) {
        // Response code not 0000
        session.privacy.apResponseCode = aurusPayResponseCode;
        errorLogger.error('ERROR: aurusPayResponseCode {0}', LogHelper.getLoggingObject(order));
        Logger.error('ERROR: Error in auruspay Applepay Pre-Auth response with response code: {0} :: customer browser details : {1} :: customer authenticated : {2} :: orderNo : {3} :: paymentType : {4}', aurusPayResponseCode, request.httpUserAgent, session.customerAuthenticated, order.orderNo, 'ApplePay');
        return {
            error: true
        };
    }
    var token = authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken : '';

    try {
        var apInstruments = order.getPaymentInstruments('DW_APPLE_PAY').toArray();
        var paymentInstrument = apInstruments[0];
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

        Transaction.wrap(function () {
            paymentInstrument.creditCardExpirationMonth = authResult.TransResponse.TransDetailsData.TransDetailData.CardExpiryDate.substring(0, 2);
            paymentInstrument.creditCardExpirationYear = authResult.TransResponse.TransDetailsData.TransDetailData.CardExpiryDate.substring(2, 4);
            paymentInstrument.creditCardType = authResult.TransResponse.TransDetailsData.TransDetailData.CardType;
            paymentInstrument.creditCardHolder = authResult.TransResponse.TransDetailsData.TransDetailData.CustomerName;
        });
        aurusPayHelper.setPaymentInstrumentAttributes(paymentInstrument, {
            order: order,
            token: token,
            authResult: authResult,
            aurusTransAmountDetails: aurusTransAmountDetails,
            scope: 'applepay',
            paymentProcessor: paymentProcessor
        });
    } catch (e) {
        session.privacy.apResponseCode = aurusPayResponseCode;
        errorLogger.error('aurusAuthorizeApplepay {0} {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
        Logger.error('ERROR: Error in setting the custom attributes for the payment instrument: {0}', JSON.stringify(e));
    }

    return {
        error: false
    };
}

module.exports = {
    aurusAuthorizeApplepay: aurusAuthorizeApplepay,
    getSession: getSession,
    getSessionToken: getSessionToken,
    aurusPreAuth: aurusPreAuth
};
