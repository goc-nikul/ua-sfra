'use strict';

require('dw-api-mock/demandware-globals');
var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var ArrayList = require('../../../../mocks/scripts/util/dw.util.Collection');

function BasePayment() {}

let payment;
let PaymentModel;
let currentBasket;
let paymentInstrument;
let paymentTransaction;
let currentCustomer;
let countryCode;

describe('app_ua_mx/cartridge/models/payment.js', () => {
    before(() => {
        mockSuperModule.create(BasePayment);
    });

    beforeEach(() => {
        PaymentModel = proxyquire('../../../../../cartridges/app_ua_mx/cartridge/models/payment.js', {
            '*/cartridge/scripts/util/collections': require('../../../../mocks/scripts/util/collections')
        });
        currentBasket = new (require('dw/order/Basket'))();
        paymentInstrument = new (require('dw/order/OrderPaymentInstrument'))();
        paymentTransaction = new (require('dw/order/PaymentTransaction'))();
        paymentTransaction.amount = {
            value: 9.99
        };
        paymentInstrument.paymentTransaction = paymentTransaction;
        currentCustomer = new (require('dw/customer/Customer'))();
        countryCode = 'US';
    });

    it('Testing the initialization of the MX payment model, paymentInstruments are undefined', () => {
        assert.doesNotThrow(() => payment = new PaymentModel(currentBasket, currentCustomer, countryCode));
        assert.isNull(payment.selectedPaymentInstruments);
    });

    it('Testing the initialization of the MX payment model, paymentInstruments are defined', () => {
        currentBasket.paymentInstruments = new ArrayList([
            paymentInstrument
        ]);
        assert.doesNotThrow(() => payment = new PaymentModel(currentBasket, currentCustomer, countryCode));
        assert.isNotNull(payment.selectedPaymentInstruments);
    });

    it('Testing the initialization of the MX payment model, paymentInstruments contain Adyen payment data', () => {
        paymentInstrument.custom.adyenPaymentMethod = 'adyenPaymentMethod';
        paymentInstrument.custom.adyenIssuerName = 'adyenIssuerName';
        paymentInstrument.custom.adyenAdditionalPaymentData = '{"payment":"data"}';
        paymentInstrument.custom.adyenAction = 'adyenAction';
        currentBasket.paymentInstruments = new ArrayList([
            paymentInstrument
        ]);
        assert.doesNotThrow(() => payment = new PaymentModel(currentBasket, currentCustomer, countryCode));
        assert.isArray(payment.selectedPaymentInstruments);
        assert.propertyVal(payment.selectedPaymentInstruments[0], 'selectedAdyenPM', paymentInstrument.custom.adyenPaymentMethod);
        assert.propertyVal(payment.selectedPaymentInstruments[0], 'selectedIssuerName', paymentInstrument.custom.adyenIssuerName);
        assert.propertyVal(payment.selectedPaymentInstruments[0], 'adyenAction', paymentInstrument.custom.adyenAction);
        assert.deepEqual(payment.selectedPaymentInstruments[0].adyenAdditionalPaymentData, JSON.parse(paymentInstrument.custom.adyenAdditionalPaymentData));
    });

    it('Testing the initialization of the MX payment model, paymentMethod is a GIFT_CERTIFICATE', () => {
        paymentInstrument.paymentMethod ='GIFT_CERTIFICATE';
        paymentInstrument.giftCertificateCode = 'GFTCERTCODE';
        paymentInstrument.maskedGiftCertificateCode = 'GFT****CODE';
        currentBasket.paymentInstruments = new ArrayList([
            paymentInstrument
        ]);
        assert.doesNotThrow(() => payment = new PaymentModel(currentBasket, currentCustomer, countryCode));
        assert.isArray(payment.selectedPaymentInstruments);
        assert.propertyVal(payment.selectedPaymentInstruments[0], 'giftCertificateCode', paymentInstrument.giftCertificateCode);
        assert.propertyVal(payment.selectedPaymentInstruments[0], 'maskedGiftCertificateCode', paymentInstrument.maskedGiftCertificateCode);
    });
});
