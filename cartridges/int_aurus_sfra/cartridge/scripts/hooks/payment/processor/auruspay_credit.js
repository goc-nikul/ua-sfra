'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var server = require('server');
var Site = require('dw/system/Site');

/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken() {
    return Math.random().toString(36).substr(2);
}

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
* @returns {Object} Pre auth object from service call
*/
function aurusPreAuth(params) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var Logger = require('dw/system/Logger');
    var auth;
    try {
        var reqBody = aurusPayHelper.createAuthReqBody(params);
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
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var cardNumber = paymentInformation.cardNumber.value;
    var expirationMonth = paymentInformation.expirationMonth.value;
    var expirationYear = paymentInformation.expirationYear.value;
    var serverErrors = [];
    var cardType = paymentInformation.cardType.value;

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(
            PaymentInstrument.METHOD_CREDIT_CARD
        );

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);
        paymentInstrument.setCreditCardToken(
            paymentInformation.creditCardToken
                ? paymentInformation.creditCardToken
                : createToken()
        );
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order} order - the current order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @param {string} aurusTokens - AurusPay Tokens
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, order, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddress');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');

 // Next get Aurus OTT
    var paymentForm = server.forms.getForm('billing');
    var ott = { value: paymentForm.creditCardFields.ott.value };
    var cardType = paymentForm.creditCardFields.cardType.value;
    var aurusCardType = cardType;

    // Test for Custom Aurus site prefs
    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var terminalID = aurusPayHelper.getTerminalID(order)
    if (Site.current.getCustomPreferenceValue('Aurus_storeId') === null && Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier') === null && terminalID === null) {
        return ({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
    }

    // Prepare request body for auth call
    var aurusShippingAddress = new ShippingAddressModel({ shipping: order.defaultShipment.shippingAddress, email: order.customerEmail, phone: order.defaultShipment.shippingAddress.phone });
    var aurusEcommInfo = new EcommInfoModel(
        {
            storeId: Site.current.getCustomPreferenceValue('Aurus_storeId'),
            oneTimeToken: ott,
            merchantId: Site.current.getCustomPreferenceValue('Aurus_merchantIdentifier'),
            terminalId: terminalID,
            cardId: '',
            oneOrderToken: ''
        }
    );
    var aurusBillingAddress = new BillingAddressModel({ billing: order.billingAddress, email: order.customerEmail, phone: order.billingAddress.phone });
    var aurusTransAmountDetails = new TransAmountDetails(order);
    var aurusProducts = new Level3Products(order);
    var aurusInvoiceNumber = order.orderNo;

    // Aurus PreAuth Call
    var authResult = aurusPreAuth({ ShippingAddress: aurusShippingAddress, ECOMMInfo: aurusEcommInfo, cardType: aurusCardType, BillingAddress: aurusBillingAddress, TransAmountDetails: aurusTransAmountDetails, orderNo: aurusInvoiceNumber, Level3ProductsData: aurusProducts, currencyCode: order.currencyCode });

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

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
