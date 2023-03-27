'use strict';

var Transaction = require('dw/system/Transaction');

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

/**
 * Handle entry point for OXXO
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(basket) {
    var Constants = require('*/cartridge/scripts/constants/constants.js');
    var currentBasket = basket;
    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();
        var iterator = paymentInstruments.iterator();
        var paymentInstrument = null;

        while (iterator.hasNext()) {
            paymentInstrument = iterator.next();
            currentBasket.removePaymentInstrument(paymentInstrument);
        }

        currentBasket.createPaymentInstrument(Constants.AURUS_OXXO, currentBasket.totalGrossPrice);
    });

    return { success: true };
}

/**
 * Authorizes a payment using AurusPay OXXO.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var Resource = require('dw/web/Resource');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var order = OrderMgr.getOrder(orderNumber);
    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(session.custom.sessionID);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }
    delete session.custom.sessionID;
    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Authorize = Authorize;
exports.Handle = Handle;
exports.processForm = processForm;
