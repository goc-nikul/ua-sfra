'use strict';
var Transaction = require('dw/system/Transaction');
var server = require('server');
var Site = require('dw/system/Site');
var errorLogger = require('dw/system/Logger').getLogger('OrderFail', 'OrderFail');
var Logger = require('dw/system/Logger').getLogger('AurusPayHelper', 'AurusPayHelper');
var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
var LogHelper = require('*/cartridge/scripts/util/loggerHelper');

/**
 * Handle entry point for SG integration
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(basket) {
    var methodId = 'KLARNA_PAYMENTS';
    var amount = basket.totalGrossPrice;

    var paymentInstrument = null;

    Transaction.wrap(function () {
        paymentInstrument = basket.createPaymentInstrument(methodId, amount);
    });

    return {
        success: true,
        paymentInstrument: paymentInstrument
    };
}

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
 * @param {dw.order} order - the current order
* @returns {Object|null} Pre auth object from service call
*/
function aurusKlarnaPreAuth(params, order) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var auth = null;
    try {
        var reqBody = aurusPayHelper.createKlarnaAuthReqBody(params);
        auth = aurusPaySvc.getAuthService().call(reqBody);

        if (auth.ok) {
            auth = JSON.parse(auth.object.text);
        } else {
            if (auth && auth.errorMessage && order) {
                Transaction.wrap(function () {
                    order.trackOrderChange('Klarna Authorization Issue: ' + auth.errorMessage);
                });
            }
            auth = null;
        }
    } catch (error) {
        errorLogger.error('aurusKlarnaPreAuth {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing klarna pre auth :: {0}', error.message);
        if (order) {
            Transaction.wrap(function () {
                order.addNote('Authorization Issue', JSON.stringify(error).substring(0, 4000));
            });
        }
    }

    return auth;
}

/**
 * This function makes the Aurus Session Token Service Call
 * @param {Object} params - Aurus session id, biller token
 * @return {Object} returns an error object
 */
function getSessionToken(params) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var sessionTokenRes;
    try {
        var reqBody = aurusPayHelper.createKlarnaSessionTokenReqBody(params);
        sessionTokenRes = aurusPaySvc.getSessionTokenService().call(reqBody);
    } catch (error) {
        errorLogger.error('getSessionToken {0} : {1}', JSON.stringify(error), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while executing pre auth.', error);
    }

    if (sessionTokenRes && sessionTokenRes.ok) {
        sessionTokenRes = JSON.parse(sessionTokenRes.object.text);
    } else {
        sessionTokenRes = null;
    }
    return sessionTokenRes;
}

/**
 * Authorizes a payment using AurusPay Klarna.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @param {string} scope -  scope of authorization
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor, scope) {
    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddressPayPal');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');
    var OrderMgr = require('dw/order/OrderMgr');

    var order = OrderMgr.getOrder(orderNumber);

    var klarnaForm = server.forms.getForm('klarna');
    var ott = klarnaForm.AuruspayKlarnaOtt.htmlValue;
    // EC Token from Pay Pal Redirect
    var sessionTokenResponse;
    if (scope && scope === 'OCAPI') {
        var aurusKlarnaSession = paymentInstrument.custom.ott || paymentInstrument.custom.KlarnaPaymentsSessionID;
        var aurusKlarnaBATokenSession = paymentInstrument.custom.klarnaPaymentsAuthorizationToken || session.privacy.ba_token;

        // Next get Aurus OTT
        sessionTokenResponse = getSessionToken({
            baToken: aurusKlarnaBATokenSession,
            sessionId: aurusKlarnaSession
        });

        // Handle Session Token Respnse Errors
        if (sessionTokenResponse == null) {
            errorLogger.error('Authorize sessionTokenResponse {0}', LogHelper.getLoggingObject(order));
            Logger.error('ERROR: Error while executing getSessionToken for Klarna');
            return {
                error: true
            };
        }

        if (sessionTokenResponse.GetSessionTokenResponse && (sessionTokenResponse.GetSessionTokenResponse.ResponseText === 'INVALID SESSION ID' || sessionTokenResponse.GetSessionTokenResponse.ResponseText === 'UNABLE TO PROCESS REQUEST' || sessionTokenResponse.GetSessionTokenResponse.ResponseText === 'INVALID_REQUEST_SESSION_ID')) {
            // Handle Session Token Respnse Errors
            errorLogger.error('Authorize ResponseText {0}', LogHelper.getLoggingObject(order));
            if (sessionTokenResponse.GetSessionTokenResponse.ResponseText) {
                Logger.error('ERROR: Error while executing getSessionToken for Klarna, {0}', sessionTokenResponse.GetSessionTokenResponse.ResponseText);
            }

            return {
                error: true
            };
        }

        // Set required variables for Pre-Auth from Session Token Response
        ott = sessionTokenResponse.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
        var payWallet;
        if (sessionTokenResponse.GetSessionTokenResponse.Pay_Wallet) {
            payWallet = JSON.parse(sessionTokenResponse.GetSessionTokenResponse.Pay_Wallet);
        }
        var emailId = '';
        if (payWallet && payWallet.payer) {
            emailId = payWallet.payer.email_address || payWallet.payer.payer_info.email || '';
        }

        if (!order.customerEmail && emailId) {
            Transaction.wrap(function () {
                order.setCustomerEmail(emailId);
            });
        }
    }

    // Prepare request body for auth call
    var aurusShippingAddress = new ShippingAddressModel({
        shipping: order.defaultShipment.shippingAddress,
        email: order.customerEmail,
        phone: order.defaultShipment.shippingAddress.phone
    });

    var aurusEcommInfo = new EcommInfoModel({
        storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'),
        oneTimeToken: ott,
        merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'),
        terminalId: aurusPayHelper.getTerminalID(order),
        cardId: '',
        oneOrderToken: ''
    });

    var aurusBillingAddress = new BillingAddressModel({
        billing: order.billingAddress,
        email: order.customerEmail,
        phone: order.billingAddress.phone
    });

    var aurusTransAmountDetails = new TransAmountDetails(order);
    var aurusProducts = new Level3Products(order);
    var aurusInvoiceNumber = orderNumber;

    // Aurus PreAuth Call
    var authResult = aurusKlarnaPreAuth({
        ShippingAddress: aurusShippingAddress,
        ECOMMInfo: aurusEcommInfo,
        BillingAddress: aurusBillingAddress,
        TransAmountDetails: aurusTransAmountDetails,
        orderNo: aurusInvoiceNumber,
        currencyCode: order.currencyCode,
        Level3ProductsData: aurusProducts
    }, order);

    if (empty(authResult) || empty(authResult.TransResponse) || empty(authResult.TransResponse.TransDetailsData) || empty(authResult.TransResponse.TransDetailsData.TransDetailData)) {
        Logger.error('ERROR: Error in Klarna Pre-Auth response object');
        errorLogger.error('Authorize TransResponse {0}', LogHelper.getLoggingObject(order));
        return {
            error: true
        };
    }

    // Auth Success
    var aurusPayResponseCode = Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode);

    if (scope && scope === 'OCAPI') {
        var aurusPayProcessorResponseCode = authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorResponseCode;
        if (sessionTokenResponse.GetSessionTokenResponse.ResponseCode > 0) {
            errorLogger.error('Authorize ResponseCode {0}', LogHelper.getLoggingObject(order));
            return {
                error: true,
                errorCode: aurusPayResponseCode
            };
        }

        try {
            Transaction.wrap(function () {
                /* eslint-disable no-param-reassign */
                order.custom.aurusResponseCode = aurusPayResponseCode.toString();
                order.custom.aurusProcessorResponseCode = aurusPayProcessorResponseCode;
                /* eslint-enable no-param-reassign */
            });
        } catch (e) {
            errorLogger.error('Authorize 1 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject(order));
            Logger.error('ERROR: Error in executing Pre-Auth OCAPI call for Klarna :: {0}', e.message);
        }
    }

    if (aurusPayResponseCode > 0) {
        // Response code not 0000
        errorLogger.error('Authorize aurusPayResponseCode {0}', LogHelper.getLoggingObject(order));
        session.privacy.apResponseCode = aurusPayResponseCode;
        return {
            error: true,
            errorCode: aurusPayResponseCode
        };
    }

    var token = authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken : '';
    var cardIdentifier = authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier : '';
    var processorToken = authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorToken !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorToken : '';

    try {
        aurusPayHelper.setPaymentInstrumentAttributes(paymentInstrument, {
            order: order,
            token: token,
            authResult: authResult,
            aurusTransAmountDetails: aurusTransAmountDetails,
            processorToken: processorToken,
            scope: 'klarna',
            paymentProcessor: paymentProcessor
        });
    } catch (e) {
        session.privacy.apResponseCode = aurusPayResponseCode;
        errorLogger.error('Authorize 2 {0} : {1}', JSON.stringify(e), LogHelper.getLoggingObject());
        Logger.error('ERROR: Error while setting payment Instruments custom attributes :: {0}', e.message);
    }

    return {
        authorized: true,
        token: token,
        cardIdentifier: cardIdentifier
    };
}

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var viewData = viewFormData;

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    return {
        error: false,
        viewData: viewData
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.processForm = processForm;
exports.getSessionToken = getSessionToken;
