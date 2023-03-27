'use strict';

var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var Constants = require('*/cartridge/scripts/constants/constants.js');
/**
 *process Form Function.
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

/**
 * Handle entry point for SafetyPay
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(basket) {
    var currentBasket = basket;

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();
        var paymentInstrument = null;

        while (iterator.hasNext()) {
            paymentInstrument = iterator.next();
            currentBasket.removePaymentInstrument(paymentInstrument);
        }

        currentBasket.createPaymentInstrument(Constants.AURUS_SAFETYPAY, currentBasket.totalGrossPrice);
    });

    return { success: true };
}

/**
* This function handles the auth call
* @param {Object} params contains shipping, billing, and OTT
* @returns {Object} Pre auth object from service call
*/
function aurusSafetyPayPreAuth(params) {
    // Custom Scripts for Auth call
    var aurusPaySvc = require('*/cartridge/scripts/services/aurusPayServices');
    var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
    var Logger = require('dw/system/Logger');
    var auth;
    try {
        var reqBody = aurusPayHelper.createSafetyPayAuthReqBody(params);
        auth = aurusPaySvc.getAuthService().call(reqBody);
    } catch (error) {
        Logger.error('ERROR: Error while executing pre auth for Paypal :: {0}', error.message);
    }

    if (auth.ok) {
        auth = JSON.parse(auth.object.text);
    } else {
        auth = null;
    }
    return auth;
}

/**
 * Authorizes a payment using AurusPay SafetyPay.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var OrderMgr = require('dw/order/OrderMgr');

    // Models for Auth call
    var BillingAddressModel = require('*/cartridge/models/billingAddressPayPal');
    var ShippingAddressModel = require('*/cartridge/models/shippingAddress');
    var EcommInfoModel = require('*/cartridge/models/ecommInfo');
    var TransAmountDetails = require('*/cartridge/models/transactionDetails');
    var Level3Products = require('*/cartridge/models/aurusLevelThreeProduct');

    // Set required variables for Pre-Auth from Session Token Response
    var ott = session && session.privacy ? session.privacy.ott : null;
    var order = OrderMgr.getOrder(orderNumber);

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
        terminalId: Site.current.getCustomPreferenceValue('Aurus_terminalId')
    });

    var aurusBillingAddress = new BillingAddressModel({
        billing: order.billingAddress,
        phone: order.billingAddress.phone
    });

    var aurusTransAmountDetails = new TransAmountDetails(order);
    var aurusProducts = new Level3Products(order);
    var aurusInvoiceNumber = orderNumber;

    // Aurus PreAuth Call
    var authResult = aurusSafetyPayPreAuth({
        ShippingAddress: aurusShippingAddress,
        ECOMMInfo: aurusEcommInfo,
        BillingAddress: aurusBillingAddress,
        TransAmountDetails: aurusTransAmountDetails,
        orderNo: aurusInvoiceNumber,
        Level3ProductsData: aurusProducts,
        currencyCode: order.currencyCode
    });

    // Auth Success
    var aurusPayResponseCode = authResult && authResult.TransResponse && authResult.TransResponse.TransDetailsData && authResult.TransResponse.TransDetailsData.TransDetailData ? Number(authResult.TransResponse.TransDetailsData.TransDetailData.ResponseCode) : 1;

    if (aurusPayResponseCode > 0) {
        // Response code not 0000
        session.privacy.apResponseCode = aurusPayResponseCode;
        return {
            error: true,
            errorCode: aurusPayResponseCode
        };
    }

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '');
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            /* eslint-disable no-param-reassign */
            paymentInstrument.paymentTransaction.custom.aurusPayAPTN = authResult.TransResponse.AurusPayTicketNum !== null ? authResult.TransResponse.AurusPayTicketNum : '';
            paymentInstrument.paymentTransaction.custom.aurusPayAPTID = authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId !== null ? authResult.TransResponse.TransDetailsData.TransDetailData.AuruspayTransactionId : '';
            order.setPaymentStatus(require('dw/order/Order').PAYMENT_STATUS_PAID);
        });
    } catch (e) {
        session.privacy.apResponseCode = aurusPayResponseCode;
        return {
            error: true,
            errorCode: aurusPayResponseCode
        };
    }

    return {
        authorized: true
    };
}

exports.Authorize = Authorize;
exports.Handle = Handle;
exports.processForm = processForm;
