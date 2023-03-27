'use strict';

/* eslint-disable */

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var mockSuperModule = require('../../../mockModuleSuperModule');
var baseOrderModelMock = require('./baseOrderModel');
var ArrayList = require('../../../mocks/dw/dw.util.Collection');

var items = new ArrayList ([{
    paymentMethod: 'GIFT_CERTIFICATE',
    creditCardNumberLastDigits: '1111',
    creditCardHolder: 'aaaa',
    creditCardExpirationYear: '2030',
    creditCardType: 'VISA',
    maskedCreditCardNumber: '****',
    creditCardExpirationMonth: 'JULY',
    giftCertificateCode: 'aaaa',
    maskedGiftCertificateCode: 'aaaa',
    paymentTransaction: {
       	 amount: {
        	value: 3
    	}
    },
    custom: {
        adyenPaymentMethod: true,
        adyenIssuerName : 'aaaa',
        adyenAdditionalPaymentData: '{"paymentMethod":[{"name":"aaa", "amount":"1212"}]}',
        adyenAction: 'aaa'
    }
}]);

var currentBasket = {
    paymentInstruments: items
};


describe('app_ua_emea/cartridge/models/payment', () => {

    before(function () {
        mockSuperModule.create(baseOrderModelMock);
    });

    it('Testing if container view is not orderDetails or basket', () => {
        var PaymentModel = proxyquire('../../../../cartridges/app_ua_emea/cartridge/models/payment.js', {
            '*/cartridge/scripts/util/collections': require('../../../../cartridges/storefront-reference-architecture/test/mocks/util/collections')
        });
		
        var options = { containerView: 'orderDetails' };
        var countryCode = 'US';
        var payment = new PaymentModel(currentBasket, options, countryCode);
        assert.isDefined(payment, 'line items are not defined');
    });

});
