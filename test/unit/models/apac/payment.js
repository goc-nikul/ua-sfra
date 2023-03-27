'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var mockSuperModule = require('../../../mockModuleSuperModule');
var basePaymentModelMock = require('./basePayment');

var PaymentModel;

var currentBasket = {
    paymentInstruments: [{
        paymentMethod: 'Adyen',
        paymentTransaction: {
            amount: {
                value: 100,
                currencyCode: 'AUD'
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
    }]
};

describe('app_ua_apac/cartridge/models/payment', () => {


    before(function () {
        mockSuperModule.create(basePaymentModelMock);
        PaymentModel = proxyquire('../../../../cartridges/app_ua_apac/cartridge/models/payment.js', {
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections'),
            '*/cartridge/config/preferences': {
                isZipPayEnabled: true
            },
            '*/cartridge/scripts/zip/helpers/zip': {
                isPaymentMethodZip: function (paymentMethod) { return paymentMethod === 'zip'; },
                getPaymentMethodName: function () { return 'Zip' }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            'dw/value/Money': require('../../../mocks/dw/dw_value_Money'),
            'dw/order/PaymentMgr': {
                getPaymentMethod: function () {
                    return {
                        getImage: function () {
                            return {
                                getAbsURL: function () { return 'https://www.paymentlocation.com' }
                            }
                        },
                        getName: function () { return 'Adyen' }
                    };
                }
            }
        });
    });

    it('Testing selectedPaymentInstrument payment method in payment modal', () => {
        var payment = new PaymentModel(currentBasket);
        payment.selectedPaymentInstruments.forEach((selectedPaymentInstrument) => {
            assert.equal(selectedPaymentInstrument.paymentMethod, 'Adyen');
        });
    });

    it('Testing applicablePaymentMethods payment method in payment modal', () => {
        var payment = new PaymentModel(currentBasket);
        payment.applicablePaymentMethods.forEach((selectedPaymentInstrument) => {
            assert.equal(selectedPaymentInstrument.paymentMethod, 'Adyen');
        });
    });

    it('Testing selectedPaymentInstrument payment amount in payment modal', () => {
        var payment = new PaymentModel(currentBasket);
        payment.selectedPaymentInstruments.forEach((selectedPaymentInstrument) => {
            assert.equal(selectedPaymentInstrument.amount, 100);
        });
    });

    it('Testing selectedPaymentInstrument payment custom attributes in payment modal', () => {

        currentBasket.paymentInstruments[0].custom.adyenPaymentMethod = 'VISA';
        currentBasket.paymentInstruments[0].custom.adyenIssuerName = 'PaResponse';
        currentBasket.paymentInstruments[0].custom.adyenAdditionalPaymentData = '{"addition": "info"}';
        currentBasket.paymentInstruments[0].custom.adyenAction = 'AdyenComponent';

        var payment = new PaymentModel(currentBasket);
        payment.selectedPaymentInstruments.forEach((selectedPaymentInstrument) => {
            // checking for null
            assert.isNotNull(selectedPaymentInstrument, 'selectedPaymentInstrument is Null');
            assert.isNotNull(selectedPaymentInstrument.selectedAdyenPM, 'selectedPaymentInstrument adyenPaymentMethod is Null');
            assert.isNotNull(selectedPaymentInstrument.selectedIssuerName, 'selectedPaymentInstrument adyenAdditionalPaymentData is Null');
            assert.isNotNull(selectedPaymentInstrument.adyenAdditionalPaymentData, 'selectedPaymentInstrument adyenAdditionalPaymentData is Null');
            assert.isNotNull(selectedPaymentInstrument.adyenAction, 'selectedPaymentInstrument adyenAction is Null');
        });
    });

    it('Testing selectedPaymentInstrument payment custom attributes in payment modal', () => {

        currentBasket.paymentInstruments[0].custom.adyenPaymentMethod = 'VISA';
        currentBasket.paymentInstruments[0].custom.adyenIssuerName = 'PaResponse';
        currentBasket.paymentInstruments[0].custom.adyenAdditionalPaymentData = '{"addition": "info"}';
        currentBasket.paymentInstruments[0].custom.adyenAction = 'AdyenComponent';

        var payment = new PaymentModel(currentBasket);
        payment.applicablePaymentMethods.forEach((selectedPaymentInstrument) => {
            // checking for null
            assert.isNotNull(selectedPaymentInstrument, 'selectedPaymentInstrument is Null');
            assert.isNotNull(selectedPaymentInstrument.selectedAdyenPM, 'selectedPaymentInstrument adyenPaymentMethod is Null');
            assert.isNotNull(selectedPaymentInstrument.selectedIssuerName, 'selectedPaymentInstrument adyenAdditionalPaymentData is Null');
            assert.isNotNull(selectedPaymentInstrument.adyenAdditionalPaymentData, 'selectedPaymentInstrument adyenAdditionalPaymentData is Null');
            assert.isNotNull(selectedPaymentInstrument.adyenAction, 'selectedPaymentInstrument adyenAction is Null');
        });
    });

    it('Testing is payment method is GIFT_CERTIFICATE', () => {
        currentBasket.paymentInstruments[0].paymentMethod = 'GIFT_CERTIFICATE';
        currentBasket.paymentInstruments[0].giftCertificateCode = '1224';
        currentBasket.paymentInstruments[0].maskedGiftCertificateCode = '002'

        var payment = new PaymentModel(currentBasket);
        payment.applicablePaymentMethods.forEach((selectedPaymentInstrument) => {
            assert.isNotNull(selectedPaymentInstrument, 'selectedPaymentInstrument is Null');
            assert.isNotNull(selectedPaymentInstrument.giftCertificateCode, 'giftCertificateCode is Null');
            assert.isNotNull(selectedPaymentInstrument.maskedGiftCertificateCode, 'giftCertificateCode is Null');
        });

    });

    it('Testing if selected payment method in zip', () => {
        currentBasket.paymentInstruments[0].paymentMethod = 'zip';
        var payment = new PaymentModel(currentBasket);
        payment.applicablePaymentMethods.forEach((selectedPaymentInstrument) => {
            assert.isNotNull(selectedPaymentInstrument, 'selectedPaymentInstrument is Null');
            assert.isNotNull(selectedPaymentInstrument.amountFormatted, 'amountFormatted is Null');
            assert.isNotNull(selectedPaymentInstrument.currencyCode, 'currencyCode  is Null');
        });;
    });

    it('Testing if selected payment method in COD', () => {
        currentBasket.paymentInstruments[0].paymentMethod = 'COD';
        var payment = new PaymentModel(currentBasket);
        payment.applicablePaymentMethods.forEach((selectedPaymentInstrument) => {
            assert.isNotNull(selectedPaymentInstrument, 'selectedPaymentInstrument is Null');
            assert.isNotNull(selectedPaymentInstrument.amountFormatted, 'amountFormatted is Null');
            assert.isNotNull(selectedPaymentInstrument.currencyCode, 'currencyCode  is Null');
        });;
    });

    it('Testing if selected payment method in 2c2p', () => {
        currentBasket.paymentInstruments[0].paymentMethod = '2c2';
        var payment = new PaymentModel(currentBasket);
        payment.applicablePaymentMethods.forEach((selectedPaymentInstrument) => {
            assert.isNotNull(selectedPaymentInstrument, 'selectedPaymentInstrument is Null');
            assert.isNotNull(selectedPaymentInstrument.amountFormatted, 'amountFormatted is Null');
            assert.isNotNull(selectedPaymentInstrument.currencyCode, 'currencyCode  is Null');
        });;
    });

    it('Testing if not payment methods selected', () => {
        currentBasket.paymentInstruments = null;
        var payment = new PaymentModel(currentBasket);
        assert.isNull(payment.selectedPaymentInstruments, 'Should be empty');
    });

});