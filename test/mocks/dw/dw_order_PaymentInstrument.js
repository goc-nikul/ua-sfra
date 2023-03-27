'use strict';

var Money = require('./dw_value_Money');

class PaymentInstrument {
    constructor(paymentMethodId = 'test', amount = new Money(0)) {
        this.paymentTransaction = {
            amount: amount,
            transactionID: '7777007069967974',
            custom: {},
            setTransactionID: function () {
                return {};
            },
            setPaymentProcessor: function () {
                return {};
            }
        };
        this.custom = {
            gcNumber: '7777007069967974',
            gcPin: '91260152'
        };
        this.paymentMethod = paymentMethodId;
        this.paymentProcessor = paymentMethodId;
        this.UUID = '1234567890';
        this.ID = paymentMethodId;
        this.creditCardHolder = '';
        this.creditCardNumber = '';
        this.creditCardType = '';
        this.creditCardExpirationMonth = '';
        this.creditCardExpirationYear = '';
        this.CreditCardToken = '';
    }

    static setClassConstants() {
        this.METHOD_BANK_TRANSFER = 'BANK_TRANSFER';
        this.METHOD_BML = 'BML';
        this.METHOD_CREDIT_CARD = 'CREDIT_CARD';
        this.METHOD_DW_ANDROID_PAY = 'DW_ANDROID_PAY';
        this.METHOD_DW_APPLE_PAY = 'DW_APPLE_PAY';
        this.METHOD_GIFT_CERTIFICATE = 'GIFT_CERTIFICATE';
    }

    getPaymentProcessor() {
        return this.paymentProcessor;
    }

    getPaymentMethod() {
        return this.paymentMethod;
    }

    getCustom() {
        return this.custom;
    }

    getPaymentTransaction() {
        return new Money(10);
    }

    setUUID(uuid) {
        this.UUID = uuid;
    }

    setCreditCardHolder(CreditCardHolder) {
        this.creditCardHolder = CreditCardHolder;
    }

    setCreditCardNumber(creditCardNumber) {
        this.creditCardNumber = creditCardNumber;
    }
    
    setCreditCardType(creditCardType) {
        this.creditCardType = creditCardType;
    }

    setCreditCardExpirationMonth(creditCardExpirationMonth) {
        this.creditCardExpirationMonth = creditCardExpirationMonth;
    }

    setCreditCardExpirationYear(creditCardExpirationYear) {
        this.creditCardExpirationYear = creditCardExpirationYear;
    }

    setCreditCardToken(creditCardToken) {
        this.creditCardToken = creditCardToken;
    }
}

PaymentInstrument.setClassConstants();

module.exports = PaymentInstrument;
