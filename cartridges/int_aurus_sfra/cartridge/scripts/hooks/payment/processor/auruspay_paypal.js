'use strict';

var Transaction = require('dw/system/Transaction');
var server = require('server');
var Site = require('dw/system/Site');

/* global session:true */
/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket) {
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

        currentBasket.createPaymentInstrument('PayPal', currentBasket.totalGrossPrice);

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
function aurusPayPalPreAuth(params) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var Logger = require('dw/system/Logger');
    var auth;
    try {
        var reqBody = aurusPayHelper.createPaypalAuthReqBody(params);
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
 * @param {string} baToken - PayPal Billing Agreement Token
 * @return {Object} returns an error object
 */
function getSessionToken(sessionId, baToken) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var Logger = require('dw/system/Logger');
    var sessionTokenRes;
    try {
        var reqBody = aurusPayHelper.getSessionTokenReqBody(sessionId, baToken);
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
 * Authorizes a payment using AurusPay Paypal.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order} order - current order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, order, paymentInstrument, paymentProcessor) {
    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddressPayPal');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');

    // EC Token from Pay Pal Redirect

    var aurusPayPalSession = session.privacy.aurusPPSession;

   // Next get Aurus OTT
    var sessionTokenResponse = getSessionToken(aurusPayPalSession);
    // Handle Session Token Respnse Errors
    if (sessionTokenResponse == null) {
        return {
            error: true
        };
    }

    // Set required variables for Pre-Auth from Session Token Response
    var ott = sessionTokenResponse.GetSessionTokenResponse.ECOMMInfo.OneTimeToken;
    var walletId = sessionTokenResponse.GetSessionTokenResponse.WalletIdentifier;
    var processorToken = sessionTokenResponse.GetSessionTokenResponse.ProcessorToken;
    var payWallet = JSON.parse(sessionTokenResponse.GetSessionTokenResponse.Pay_Wallet);

    var emailId = payWallet.payer.payer_info.email;

    Transaction.wrap(function () {
        /* eslint-disable no-param-reassign */
        order.customerEmail = emailId;
        /* eslint-enable no-param-reassign */
    });

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
        billinginfo: payWallet,
        email: emailId,
        phone: order.billingAddress.phone
    });

    var aurusTransAmountDetails = new TransAmountDetails(order);
    var aurusProducts = new Level3Products(order);
    var aurusInvoiceNumber = orderNumber;

    // Aurus PreAuth Call
    var authResult = aurusPayPalPreAuth({
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
    var aurusPayProcessorResponseCode = authResult.TransResponse.TransDetailsData.TransDetailData.ProcessorResponseCode;

    if (sessionTokenResponse.GetSessionTokenResponse.ResponseCode > 0) {
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
        return {};
    }

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

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '');
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            //  Here is where we set the one time order token
            /* eslint-disable no-param-reassign */
            paymentInstrument.paymentTransaction.custom.aurusPayOOT = token;
            paymentInstrument.paymentTransaction.custom.aurusPayAPTN = authResult.TransResponse.AurusPayTicketNum !== null ? authResult.TransResponse.AurusPayTicketNum : '';
            paymentInstrument.paymentTransaction.custom.aurusPayAPTID = authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '';
            paymentInstrument.paymentTransaction.custom.aurusPayCID = authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.CardIdentifier : '';
            /* eslint-enable no-param-reassign */
        });
    } catch (e) {
        session.privacy.apResponseCode = aurusPayResponseCode;
        return {
            error: true,
            errorCode: aurusPayResponseCode
        };
    }

    return {
        authorized: true,
        token: token,
        cardIdentifier: cardIdentifier
    };
}

exports.Authorize = Authorize;
exports.Handle = Handle;
