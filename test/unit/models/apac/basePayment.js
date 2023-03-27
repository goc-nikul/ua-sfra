'use strict';

function BasePayment() {
    this.applicablePaymentMethods = [{
        paymentMethod: 'Adyen',
        paymentTransaction: {
            amount: {
                value: 100
            }
        },
        custom: {
            adyenPaymentMethod: '',
            adyenIssuerName: '',
            adyenAdditionalPaymentData: '',
            adyenAction: ''
        },
        creditCardNumberLastDigits: '',
        creditCardHolder: '',
        creditCardExpirationYear: '',
        creditCardType: '',
        maskedCreditCardNumber: '',
        creditCardExpirationMonth: '',
        giftCertificateCode: '',
        maskedGiftCertificateCode: ''
    }];
}

module.exports = BasePayment;
