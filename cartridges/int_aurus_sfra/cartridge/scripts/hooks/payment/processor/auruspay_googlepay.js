'use strict';

var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var server = require('server');
var Site = require('dw/system/Site');
var OrderMgr = require('dw/order/OrderMgr');

/* global session, order:true, res:true */

/**
 * Verifies GooglePay Payment
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} session Current session
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, session) {
    var currentBasket = basket;
    var billingAddress = currentBasket.getBillingAddress();

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();
        var paymentInstrument = null;

        while (iterator.hasNext()) {
            paymentInstrument = iterator.next();
            currentBasket.removePaymentInstrument(paymentInstrument);
        }

        currentBasket.createPaymentInstrument('GooglePay', currentBasket.totalGrossPrice);

        if (billingAddress.stateCode == null) {
            billingAddress.stateCode = session.forms.billing.billingAddress.addressFields.statesOther.stateOther.value;
        }

        // Create a billing address
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
            server.forms.getFrom('billing.billingAddress.addressFields').copyTo(billingAddress);
            server.forms.getFrom('billing.billingAddress.addressFields.states').copyTo(billingAddress);
        }
    });

    return { success: true };
}

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
* @returns {Object} Pre auth object from service call
*/
function aurusGooglePayPreAuth(params) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var Logger = require('dw/system/Logger');
    var auth;
    try {
        var reqBody = aurusPayHelper.createGooglePayAuthReqBody(params);
        auth = aurusPaySvc.getAuthService().call(reqBody);
    } catch (error) {
        Logger.info('ERROR: Error while executing pre auth.', error);
    }

    if (auth.ok) {
        auth = JSON.parse(auth.object.text);
    } else {
        auth = null;
    }
    return auth;
}

/**
 * This function makes the Aurus Session Token Service Call
 * @param {string} sessionId - Aurus session id
 * @param {string} gpToken - GooglePay Token
 * @return {Object} returns an error object
 */
function getSessionToken(sessionId, gpToken) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var Logger = require('dw/system/Logger');
    var sessionTokenRes;
    try {
        var reqBody = aurusPayHelper.getGooglePaySessionTokenReqBody(sessionId, gpToken);
        sessionTokenRes = aurusPaySvc.getSessionTokenService().call(reqBody);
    } catch (error) {
        Logger.info('ERROR: Error while executing pre auth.', error);
    }

    if (sessionTokenRes.ok) {
        sessionTokenRes = JSON.parse(sessionTokenRes.object.text);
    } else {
        sessionTokenRes = null;
    }
    return sessionTokenRes;
}

/**
 * Authorizes a payment using AurusPay GooglePay.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order} order - The current order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, order, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddressGooglePay');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');

    // EC Token from Google Pay Redirect

    var aurusGooglePaySession = session.privacy.aurusGPSession;

   // Next get Aurus OTT
    var sessionTokenResponse = getSessionToken(aurusGooglePaySession);
    // Handle Session Token Respnse Errors
    if (sessionTokenResponse == null) {
        return {
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        };
    }

    if (sessionTokenResponse.GetSessionTokenResponse.ResponseCode > 0) {
        return {
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        };
    }

    // Set required variables for Pre-Auth from Session Token Response
    var ott = sessionTokenResponse.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
    var walletId = '11';
    var processorToken = sessionTokenResponse.GetSessionTokenResponse.ProcessorToken;

    Transaction.wrap(function () {
        /* eslint-disable no-param-reassign */
        order.customerEmail = session.privacy.BillingEmail;
        /* eslint-enable no-param-reassign */
    });

    // Prepare request body for auth call
    var aurusShippingAddress = new ShippingAddressModel({
        shipping: order.defaultShipment.shippingAddress,
        email: order.customerEmail,
        phone: order.defaultShipment.shippingAddress.phone
    });

    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var aurusEcommInfo = new EcommInfoModel({
        storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'),
        oneTimeToken: ott,
        merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'),
        terminalId: aurusPayHelper.getTerminalID(order),
        cardId: '',
        oneOrderToken: ''
    });

    var billingInfo = {
        BillingName: session.privacy.BillingName,
        BillingAddressLine1: session.privacy.BillingAddressLine1,
        BillingAddressLine2: session.privacy.BillingAddressLine2 !== null && session.privacy.BillingAddressLine2 !== '' ? session.privacy.BillingAddressLine2 : '',
        BillingCity: session.privacy.BillingCity,
        BillingState: session.privacy.BillingState,
        BillingZip: session.privacy.BillingZip,
        BillingCountry: session.privacy.BillingCountry,
        BillngMobileNumber: session.privacy.BillingMobileNumber,
        BillingEmailId: session.privacy.BillingEmail
    };

    var aurusBillingAddress = new BillingAddressModel({
        billinginfo: billingInfo,
        phone: session.privacy.BillingMobileNumber
    });

    var aurusTransAmountDetails = new TransAmountDetails(order);
    var aurusProducts = new Level3Products(order);
    var aurusInvoiceNumber = orderNumber;

    // Aurus PreAuth Call
    var authResult = aurusGooglePayPreAuth({
        ShippingAddress: aurusShippingAddress,
        ECOMMInfo: aurusEcommInfo,
        BillingAddress: aurusBillingAddress,
        TransAmountDetails: aurusTransAmountDetails,
        orderNo: aurusInvoiceNumber,
        pToken: processorToken,
        walletId: walletId,
        Level3ProductsData: aurusProducts
    });

    // Auth Success
    var aurusPayResponseCode = Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode);
    if (aurusPayResponseCode > 0) {
        // Response code not 0000
        // Fail Order
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });

        return ({
            error: true,
            AurusPayResponseCode: authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode,
            AurusPayResponseText: authResult.TransResponse.TransDetailsData.TransDetailData.ResponseText,
            errorMessage: authResult.TransResponse.TransDetailsData.TransDetailData.ResponseText + '\n Please Refresh the page'
        });
    }

    var aurusTokens = {
        aurusPayOOT: authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken : '',
        aurusPayAPTN: authResult.TransResponse.AurusPayTicketNum !== null ? authResult.TransResponse.AurusPayTicketNum : '',
        aurusPayAPTID: authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '',
        isEmpty: (authResult.TransResponse.TransDetailsData.TransDetailData.ECOMMInfo.OneOrderToken + authResult.TransResponse.AurusPayTicketNum + authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId).length === 0
    };

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            // Here is where we set the one time order token
            /* eslint-disable no-param-reassign */
            paymentInstrument.paymentTransaction.custom.aurusPayOOT = aurusTokens.aurusPayOOT;
            paymentInstrument.paymentTransaction.custom.aurusPayAPTN = aurusTokens.aurusPayAPTN;
            paymentInstrument.paymentTransaction.custom.aurusPayAPTID = aurusTokens.aurusPayAPTID;
            /* eslint-enable no-param-reassign */
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
         );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Authorize = Authorize;
exports.Handle = Handle;
