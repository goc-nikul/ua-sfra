'use strict';

var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

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
 * Handle entry point for Atome Payment integration
 * @param {Object} basket Basket
 * @returns {Object} processor result
 */
function Handle(basket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var currentBasket = basket;

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments();
        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        currentBasket.createPaymentInstrument(
            'ATOME_PAYMENT', currentBasket.totalGrossPrice
        );
    });

    return { fieldErrors: {}, serverErrors: [], error: false };
}

/**
 * default hook if no payment processor is supported
 * @param {number} orderNumber orderNumber
 * @param {Object} paymentInstrument paymentInstrument
 * @param {Object} paymentProcessor paymentProcessor
 * @return {Object} an object that contains error information
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var Order = require('dw/order/Order');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);

    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            if (!empty(order)) {
                order.setExportStatus(Order.EXPORT_STATUS_READY);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            }
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

/**
 * Validate payment status
 * @returns {Object} returns payment status
 */
 function validatePayment() {
    return {
        error: false
    };
}

/**
 * Handle payment
 * @param {Object} order DW order
 * @returns {Object} handles payment
 */
function handlePayments(order) {
    var result = {};
    var orderNumber = order.orderNo;

    if (order.totalNetPrice !== 0.0) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).paymentProcessor;
                var authorizationResult = void 0; // eslint-disable-line

                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.'.concat(paymentProcessor.ID.toLowerCase()))) {
                        authorizationResult = HookMgr.callHook('app.payment.processor.'.concat(paymentProcessor.ID.toLowerCase()), 'Authorize', orderNumber, paymentInstrument, paymentProcessor);
                    } else {
                        authorizationResult = HookMgr.callHook('app.payment.processor.default', 'Authorize');
                    }

                    result = authorizationResult;

                    if (authorizationResult.error) {
                        Transaction.wrap(function () {
                            OrderMgr.failOrder(order, true);
                        });
                        result.error = true;
                        break;
                    }
                }
            }
        }
    }
    return result;
}
exports.Handle = Handle;
exports.Authorize = Authorize;
exports.processForm = processForm;
exports.validatePayment = validatePayment;
exports.handlePayments = handlePayments;
