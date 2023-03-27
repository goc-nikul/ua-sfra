'use strict';

var Locale = require('dw/util/Locale');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderModel = require('*/cartridge/models/order');
var handleOrderConfirm = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/order');
var payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
var constants = require('*/cartridge/adyenConstants/constants');
var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');


// eslint-disable-next-line require-jsdoc
function handleAuthorised(adyenPaymentInstrument, detailsResult, order, options) {
    var req = options.req;

    Transaction.wrap(function () {
        // eslint-disable-next-line no-param-reassign
        adyenPaymentInstrument.paymentTransaction.custom.Adyen_additionalData = JSON.stringify({
            cvcResultRaw: detailsResult.additionalData.cvcResultRaw,
            cardHolderName: detailsResult.additionalData.cardHolderName,
            expiryDate: detailsResult.additionalData.expiryDate,
            alias: detailsResult.additionalData.alias,
            cardBin: detailsResult.additionalData.cardBin,
            paymentMethod: detailsResult.additionalData.paymentMethod,
            threeDAuthenticated: detailsResult.additionalData.threeDAuthenticated,
            cardSummary: detailsResult.additionalData.cardSummary
        });
    });

    // Fraud Protection Check
    var fraudDetectionStatus = require('*/cartridge/modules/providers').get('FraudScreen', order).validate();
    if (fraudDetectionStatus === 'accept') {
        // Fraud check approved
        var placeOrderResult = COHelpers.placeOrder(order);

        if (placeOrderResult.error) {
            return payment.handlePaymentError(order, 'placeOrder', options);
        }
    } else if (fraudDetectionStatus === 'review' || fraudDetectionStatus === 'SERVER_UNAVAILABLE') {
        // Fraud check hold
        session.custom.currentOrder = null;
    } else {
        // Fraud check fail
        var pspReference = order.paymentTransaction && order.paymentTransaction.custom.Adyen_pspReference;
        if (pspReference) {
            // Cancel Adyen payment with reversal API:
            // - cancel non-captured payment
            // - refund auto-captured payment
            var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
            var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
            var paymentRequest = {
                merchantAccount: AdyenConfigs.getAdyenMerchantAccount()
            };
            AdyenHelper.executeCall(
        constants.SERVICE.PAYMENTREVERSAL,
        paymentRequest,
        pspReference
      );
        }

        COHelpers.failOrder(order);

        COHelpers.sendFraudNotificationEmail(order);
        // log the order details for dataDog.
        if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
        }
        return payment.handlePaymentError(order, 'placeOrder', options);
    }
    var currentLocale = Locale.getLocale(req.locale.id);
    var orderModel = new OrderModel(order, {
        countryCode: currentLocale.country
    });

    // Save orderModel to custom object during session
    return handleOrderConfirm(adyenPaymentInstrument, detailsResult, order, orderModel, options);
}
module.exports = handleAuthorised;
