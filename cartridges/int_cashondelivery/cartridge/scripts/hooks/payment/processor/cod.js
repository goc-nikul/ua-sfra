'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var HookMgr = require('dw/system/HookMgr');
var Site = require('dw/system/Site');


/**
 * COD payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket) {
    var currentBasket = basket;
    var serverErrors = [];
    var error = false;
    try {
        Transaction.wrap(function () {
            var paymentInstruments = currentBasket.getPaymentInstruments();

            collections.forEach(paymentInstruments, function (item) {
                currentBasket.removePaymentInstrument(item);
            });

            currentBasket.createPaymentInstrument(
                    'COD', currentBasket.totalGrossPrice
            );
        });
    } catch (e) {
        error = true;
        serverErrors.push(
            'Error in cod.js :' + e.message
        );
    }
    return { serverErrors: serverErrors, error: error };
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

/**
 * Authorizes a payment using a COD. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var Order = require('dw/order/Order');
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;
    var order = OrderMgr.getOrder(orderNumber);
    try {
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
            paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            order.custom.paymentMethod = 'COD';
            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
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
