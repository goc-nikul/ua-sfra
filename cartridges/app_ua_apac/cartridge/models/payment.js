'use strict';

var base = module.superModule;

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
    var collections = require('*/cartridge/scripts/util/collections');
    return collections.map(selectedPaymentInstruments, function (paymentInstrument) {
        var results = {
            paymentMethod: paymentInstrument.paymentMethod,
            amount: paymentInstrument.paymentTransaction.amount.value
        };

        if (paymentInstrument.custom.adyenPaymentMethod) results.selectedAdyenPM = paymentInstrument.custom.adyenPaymentMethod;
        if (paymentInstrument.custom.adyenIssuerName) results.selectedIssuerName = paymentInstrument.custom.adyenIssuerName;
        if (paymentInstrument.custom.adyenAdditionalPaymentData) results.adyenAdditionalPaymentData = JSON.parse(paymentInstrument.custom.adyenAdditionalPaymentData);
        if (paymentInstrument.custom.adyenAction) results.adyenAction = paymentInstrument.custom.adyenAction;

        results.lastFour = paymentInstrument.creditCardNumberLastDigits || null;
        results.owner = paymentInstrument.creditCardHolder || null;
        results.expirationYear = paymentInstrument.creditCardExpirationYear || null;
        results.type = paymentInstrument.creditCardType || null;
        results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber || null;
        results.expirationMonth = paymentInstrument.creditCardExpirationMonth || null;

        if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
            results.giftCertificateCode = paymentInstrument.giftCertificateCode;
            results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
        }

        var transaction = paymentInstrument.paymentTransaction;
        var Money = require('dw/value/Money');
        if (require('*/cartridge/config/preferences').isZipPayEnabled) {
            var ZipHelpers = require('*/cartridge/scripts/zip/helpers/zip');
            if (ZipHelpers.isPaymentMethodZip(paymentInstrument.paymentMethod)) {
                results.name = ZipHelpers.getPaymentMethodName(paymentInstrument.paymentMethod);
                results.amountFormatted = require('dw/util/StringUtils').formatMoney(new Money(transaction.amount.value, transaction.amount.currencyCode));
                results.currencyCode = transaction.amount.currencyCode;
            }
        }
        if (paymentInstrument.paymentMethod === 'COD' || paymentInstrument.paymentMethod === '2c2' || paymentInstrument.paymentMethod === 'TOSS_PAYMENTS_CARD' || paymentInstrument.paymentMethod === 'NAVERPAY') {
            var PaymentMgr = require('dw/order/PaymentMgr');
            results.name = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getName();
            results.amountFormatted = require('dw/util/StringUtils').formatMoney(new Money(transaction.amount.value, transaction.amount.currencyCode));
            results.currencyCode = transaction.amount.currencyCode;
        }

        return results;
    });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);
    var paymentInstruments = currentBasket.paymentInstruments;
    this.selectedPaymentInstruments = paymentInstruments ? getSelectedPaymentInstruments(paymentInstruments) : null;
    if (this.applicablePaymentMethods) {
        this.applicablePaymentMethods.forEach((item) => {
            var logoImg = require('dw/order/PaymentMgr').getPaymentMethod(item.ID).getImage();
            if (logoImg) item.logoImg = logoImg.getAbsURL();// eslint-disable-line
        });
    }
}

module.exports = Payment;
