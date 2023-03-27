var base = module.superModule;
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var HookMgr = require('dw/system/HookMgr');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');

/* global dw */

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @param {string} aurusTokens - The tokens for Aurus
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber, aurusTokens) {
    var result = {};

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0 && aurusTokens.isEmpty) {
            Transaction.wrap(function () { OrderMgr.failOrder(order); });
            result.error = true;
        }

        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.' +
                            paymentProcessor.ID.toLowerCase())) {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            orderNumber,
                            order,
                            paymentInstrument,
                            paymentProcessor,
                            aurusTokens
                        );
                    } else {
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.default',
                            'Authorize'
                        );
                    }

                    if (authorizationResult.error) {
                        Transaction.wrap(function () { OrderMgr.failOrder(order); });
                        result.error = true;
                        break;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Calculates the amount to be payed by a non-gift certificate payment instrument based
 * on the given basket. The method subtracts the amount of all redeemed gift certificates
 * from the order total and returns this value.
 *
 * @param {Object} lineItemCtnr - LineIteam Container (Basket or Order)
 * @returns {dw.value.Money} non gift certificate amount
 */
function calculateNonGiftCertificateAmount(lineItemCtnr) {
    var giftCertTotal = new dw.value.Money(0.0, lineItemCtnr.currencyCode);
    var gcPaymentInstrs = lineItemCtnr.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;

    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    var orderTotal = lineItemCtnr.totalGrossPrice;
    var amountOpen = orderTotal.subtract(giftCertTotal);
    return amountOpen;
}

/**
 * CreatePaymentInstrument
 *
 * @param {Object} basket - Basket
 * @param {string} paymentType - Name of the payment method.
 * @returns {Object} Payment instrument
 */
function createPaymentInstrument(basket, paymentType) {
    var paymentInstr = null;

    if (basket == null) {
        return null;
    }

    var iter = basket.getPaymentInstruments(paymentType).iterator();
    Transaction.wrap(function () {
        while (iter.hasNext()) {
            var existingPI = iter.next();
            basket.removePaymentInstrument(existingPI);
        }
    });

    var amount = calculateNonGiftCertificateAmount(basket);

    Transaction.wrap(function () {
        paymentInstr = basket.createPaymentInstrument(paymentType, amount);
    });

    return paymentInstr;
}


/**
 * getPaypalPaymentInstrument
 *
 * @param {dw.order.LineItemCtnr} basket - Basket
 * @returns {dw.order.OrderPaymentInstrument} payment instrument with id PAYPAL
 */
function getPaypalPaymentInstrument(basket) {
    var paymentInstruments = basket.getPaymentInstruments();

    var iterator = paymentInstruments.iterator();
    var paymentInstrument = null;

    while (iterator.hasNext()) {
        paymentInstrument = iterator.next();
        var paymentMethod = dw.order.PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        if (paymentMethod) {
            var paymentProcessorId = paymentMethod.getPaymentProcessor().getID();
            if (paymentProcessorId === 'PAYPAL') {
                return paymentInstrument;
            }
        }
    }
    return null;
}


/**
 * saves payment instruemnt to customers wallet
 * @param {Object} billingData - billing information entered by the user
 * @param {dw.order.Order} order - The current order
 * @param {dw.customer.Customer} customer - The current customer
 * @returns {dw.customer.CustomerPaymentInstrument} newly stored payment Instrument
 */
function savePaymentInstrumentToWallet(billingData, order, customer) {
    var wallet = customer.getProfile().getWallet();
    var paymentInstrument = order.paymentInstruments.length > 0 && order.paymentInstruments[0];

    return Transaction.wrap(function () {
        var storedPaymentInstrument = wallet.createPaymentInstrument(PaymentInstrument.METHOD_CREDIT_CARD);

        storedPaymentInstrument.setCreditCardHolder(
            order.billingAddress.fullName
        );
        storedPaymentInstrument.setCreditCardNumber(
            paymentInstrument && paymentInstrument.creditCardNumber
        );
        storedPaymentInstrument.setCreditCardType(
            paymentInstrument && paymentInstrument.creditCardType
        );
        storedPaymentInstrument.setCreditCardExpirationMonth(
            paymentInstrument && paymentInstrument.creditCardExpirationMonth
        );
        storedPaymentInstrument.setCreditCardExpirationYear(
            paymentInstrument && paymentInstrument.creditCardExpirationYear
        );

        var token = Number(billingData.cardIdentifier);

        storedPaymentInstrument.setCreditCardToken(token);

        return storedPaymentInstrument;
    });
}

base.handlePayments = handlePayments;
base.calculateNonGiftCertificateAmount = calculateNonGiftCertificateAmount;
base.createPaymentInstrument = createPaymentInstrument;
base.getPaypalPaymentInstrument = getPaypalPaymentInstrument;
base.savePaymentInstrumentToWallet = savePaymentInstrumentToWallet;
module.exports = base;

