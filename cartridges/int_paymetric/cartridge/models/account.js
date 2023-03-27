'use strict';

/* SFRA script includes */
var base = module.superModule;

/* API includes */
var URLUtils = require('dw/web/URLUtils');

/* eslint-disable no-unused-vars */

/**
 * Creates a plain object that contains payment instrument information
 * @param {Object} userPaymentInstruments - current customer's paymentInstruments
 * @returns {Object} object that contains info about the current customer's payment instruments
 */
function getCustomerPaymentInstruments(userPaymentInstruments) {
    var paymentInstruments;

    paymentInstruments = userPaymentInstruments.map(function (paymentInstrument) {
        var paymetricData = paymentInstrument.raw.getCustom();

        var result = {
            creditCardHolder: paymentInstrument.creditCardHolder,
            maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
            creditCardType: paymentInstrument.creditCardType,
            creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
            creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
            UUID: paymentInstrument.UUID,
            paymetricCardType: 'CreditCardTokenized',
            creditCardToken: paymentInstrument.raw.creditCardToken,
            creditCardTokenInt: paymetricData.internalToken,
            creditCardBinRange: paymetricData.creditCardBinRange,
            creditCardLastFour: paymentInstrument.maskedCreditCardNumber.slice(-4)
        };

        result.cardTypeImage = {
            src: URLUtils.staticURL('/images/' +
                paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                '-dark.svg'),
            alt: paymentInstrument.creditCardType
        };

        return result;
    });

    return paymentInstruments;
}

/**
 * Account class that represents the current customer's profile dashboard
 * @param {dw.customer.Customer} currentCustomer - Current customer
 * @param {Object} addressModel - The current customer's preferred address
 * @param {Object} orderModel - The current customer's order history
 * @constructor
 */
function account(currentCustomer, addressModel, orderModel) {
    base.apply(this, arguments);

    this.customerPaymentInstruments = currentCustomer.wallet &&
        currentCustomer.wallet.paymentInstruments ?
        getCustomerPaymentInstruments(currentCustomer.wallet.paymentInstruments) :
        null;
}

account.getCustomerPaymentInstruments = getCustomerPaymentInstruments;

module.exports = account;
