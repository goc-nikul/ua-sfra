'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var PaymetricHelper = require('~/cartridge/scripts/util/PaymetricHelper');
var Transaction = require('dw/system/Transaction');

/* eslint-disable no-undef */

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an status object
 */
function handle(basket, paymentInformation) {
    var paymentMethodID = paymentInformation.paymentMethodID.value;
    var payload = paymentInformation.payload.value;
    var result = {};

    if (basket && paymentMethodID && payload) {
        // remove existing payment instruments.
        // TODO: Exclude Gift Certificate from the list of removing Payment Instrument once implemented.
        var iterator = basket.getPaymentInstruments().iterator();
        while (iterator.hasNext()) {
            var pi = iterator.next();
            if (pi && pi.paymentMethod !== 'GIFT_CARD') {
                // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    basket.removePaymentInstrument(pi);
                });
            }
        }
        // create Paymetric payment instrument.
        PaymetricHelper.createPaymentInstrument(basket, paymentMethodID, payload);
        // save Paymetric response data in payment instrument
        var paymentInstruments = basket.getPaymentInstruments(paymentMethodID);
        if (!paymentInstruments.empty) {
            var PIIterator = paymentInstruments.iterator();
            var paymentInstrument = PIIterator.next();
            Transaction.wrap(function () {
                paymentInstrument.creditCardExpirationMonth = (!empty(paymentInformation.expiresMonth) && !empty(paymentInformation.expiresMonth.value)) ? paymentInformation.expiresMonth.value : '';
                paymentInstrument.creditCardExpirationYear = (!empty(paymentInformation.expiresYear) && !empty(paymentInformation.expiresYear.value)) ? paymentInformation.expiresYear.value : '';
                paymentInstrument.creditCardType = (!empty(paymentInformation.cardType) && !empty(paymentInformation.cardType.value)) ? paymentInformation.cardType.value : '';
                if (!empty(paymentInformation.lastFour) && !empty(paymentInformation.lastFour.value) && !empty(paymentInformation.ccBinRange) && !empty(paymentInformation.ccBinRange.value)) {
                    paymentInstrument.creditCardNumber = paymentInformation.ccBinRange.value + '******' + paymentInformation.lastFour.value;
                } else if (!empty(paymentInformation.lastFour) && !empty(paymentInformation.lastFour.value)) {
                    paymentInstrument.creditCardNumber = '************' + paymentInformation.lastFour.value;
                }
                paymentInstrument.custom.defaultPaymentCard = paymentInformation.defaultCard;
            });
        }
        result.error = false;
    } else {
        result.error = true;
    }

    return result;
}

/**
 * Authorizes a payment using a credit card. Customization may use other processors and custom
 * logic to authorize credit card payment.
 * @param {string} orderNo - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @return {Object} returns an status object
 */
function authorize(orderNo, paymentInstrument) {
    var order = OrderMgr.getOrder(orderNo);
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    var result = {
        error: true
    };

    if (order && paymentProcessor) {
        var payload = paymentInstrument.getCustom().payload;
        var authResult = PaymetricHelper.getAuthResult(payload);
        var isSuccessful = authResult && (authResult.authorization.status === 'authorized' || authResult.authorization.status === 'auto_authorized');
        session.privacy.activeOrder = orderNo;

        Transaction.wrap(function () {
            var currentCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
            order.custom.customerLocale = request.locale;
            if (!order.custom.customerCountry) {
                order.custom.customerCountry = currentCountry;
            }
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor; // eslint-disable-line no-param-reassign
        });

        if (isSuccessful) {
            PaymetricHelper.updatePaymentInfo(order, authResult);
            // save CC if current customer is not part of CSR group
            if (!customer.isMemberOfCustomerGroup('CSR')) {
                PaymetricHelper.saveCustomerCreditCard(authResult, paymentInstrument);
            }
            result.error = false;
            var orderHasEGC = require('*/cartridge/scripts/giftcard/giftcardHelper').basketHasGiftCardItems(order).eGiftCards;
            if (orderHasEGC) {
                var paymetricXiPayHelper = require('int_paymetric/cartridge/scripts/util/paymetricXiPayHelper');
                var isAuthorized = paymetricXiPayHelper.doAuthorization(order, 'Paymetric');
                if (!isAuthorized) {
                    result = {
                        error: true
                    };
                }
            }
        }
    }
    return result;
}

exports.Handle = handle;
exports.Authorize = authorize;
