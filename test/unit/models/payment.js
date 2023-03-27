'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var mockSuperModule = require('../../mockModuleSuperModule');
var collections = require('../../mocks/scripts/util/collections');
var ArrayList = require('../../mocks/scripts/util/dw.util.Collection');
var PaymentInstrument = require('../../mocks/dw/dw_order_PaymentInstrument');
var PaymentModel;

// stubs
var getApplicablePaymentMethodsStub = sinon.stub();
var getApplicablePaymentCardsStub = sinon.stub();

function baseTotalsModelMock() { }

var paymentInstruments = new ArrayList([new PaymentInstrument('CREDIT_CARD'), new PaymentInstrument('Paymetric'), new PaymentInstrument('AURUS_CREDIT_CARD'), new PaymentInstrument('GIFT_CERTIFICATE'), new PaymentInstrument('GIFT_CARD'), new PaymentInstrument('KLARNA_PAYMENTS'), new PaymentInstrument('AURUS_SAFETYPAY'), new PaymentInstrument('AURUS_OXXO')]);

var currentBasket = {
    totalGrossPrice: 2943,
    paymentInstruments: paymentInstruments,
    getCurrencyCode: () => {
        return '$';
    },
    custom: {
        paypalAlreadyHandledPayerID: 'AS323'
    }
};

var applicablePaymentCards = new ArrayList([{
    cardType: 'Visa',
    name: 'Visa',
    UUID: 'some UUID'
}, {
    cardType: 'Amex',
    name: 'American Express',
    UUID: 'some UUID'
}, {
    cardType: 'Master Card',
    name: 'MasterCard'
}, {
    cardType: 'Discover',
    name: 'Discover'
}]);

var applicablePaymentMethods = new ArrayList([{
    ID: 'AURRUS_CREDIT_CARD',
    name: 'Aurus_Credit_Card'
}, {
    ID: 'GIFT_CERTIFICATE',
    name: 'Gift Certificate'
}]);

describe('app_ua_core/cartridge/models/payment.js', () => {
    var paymentModel;
    before(() => {
        mockSuperModule.create(baseTotalsModelMock);

        PaymentModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/payment.js', {
	        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/order/PaymentMgr': {
                getApplicablePaymentMethods: getApplicablePaymentMethodsStub,
                getPaymentMethod: () => {
                    return {
                        getApplicablePaymentCards: getApplicablePaymentCardsStub,
                        getName(params) {
                            return params;
                        }
                    };
                },
                getApplicablePaymentCards: () => {
                    return ['Visa'];
                },
                getPaymentCard: () => {
                    return 'Visa';
                }
            },
            'dw/order/PaymentInstrument': PaymentInstrument,
            '*/cartridge/scripts/util/collections': collections,
            'dw/util/StringUtils': require('../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/helpers/accountHelpers': {
                getCardType: (params) => {
                    return params;
                }
            },
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/constants/constants.js': {
                AURUS_SAFETYPAY: 'AURUS_SAFETYPAY',
                AURUS_OXXO: 'AURUS_OXXO'
            },
            'dw/value/Money': require('../../mocks/dw/dw_value_Money'),
            '*/cartridge/scripts/util/klarnaHelper': {
                getSplitPaymentAmount(params) {
                    return params;
                }
            }
        });
    });

    it('should return applicablePaymentMethods as null when aplicable Payment Methods for the basket are null', () => {
        getApplicablePaymentMethodsStub.returns(null);

        paymentModel = new PaymentModel(currentBasket, {}, {});
        assert.isDefined(paymentModel);
        assert.isNotNull(paymentModel);
        assert.isNull(paymentModel.applicablePaymentMethods);
        getApplicablePaymentMethodsStub.reset();
    });
    it('should return applicablePaymentCards as null when applicablePaymentCards for the basket are null', () => {
        getApplicablePaymentCardsStub.returns(null);

        paymentModel = new PaymentModel(currentBasket, {}, {});
        assert.isDefined(paymentModel);
        assert.isNotNull(paymentModel);
        assert.isNull(paymentModel.applicablePaymentCards);
        getApplicablePaymentCardsStub.reset();
    });
    it('should return selectedPaymentInstruments as null when there is no paymentInstruments for basket', () => {
        currentBasket.paymentInstruments = null;
        paymentModel = new PaymentModel(currentBasket, {}, {});
        assert.isDefined(paymentModel);
        assert.isNotNull(paymentModel);
        assert.isNull(paymentModel.selectedPaymentInstruments);
    });

    it('should return paymentCards, selectedPaymentInstruments and paymentCards if they present in the basket', () => {
        getApplicablePaymentCardsStub.returns(applicablePaymentCards);
        getApplicablePaymentMethodsStub.returns(applicablePaymentMethods);
        currentBasket.paymentInstruments = paymentInstruments;

        paymentModel = new PaymentModel(currentBasket, {}, {});
        assert.isDefined(paymentModel);
        assert.isNotNull(paymentModel);
        assert.equal(paymentModel.applicablePaymentMethods.length, applicablePaymentMethods.length);
        assert.equal(paymentModel.applicablePaymentCards.length, applicablePaymentCards.length);
        assert.equal(paymentModel.selectedPaymentInstruments.length, paymentInstruments.length);
    });

    it('should return the paid status of Paypal payment method when basket contains Paypal PaymentInstrument ', () => {
        var paypalPaymentInstrument = new PaymentInstrument('PayPal');
        paypalPaymentInstrument.custom.paypalToken = 'testtoken';
        paymentInstruments.add(paypalPaymentInstrument);
        currentBasket.paymentInstruments = paymentInstruments;

        paymentModel = new PaymentModel(currentBasket, {}, {});
        assert.isDefined(paymentModel);
        assert.isTrue(paymentModel.isAlreadyPaidFromPayPal);

        delete currentBasket.custom.paypalAlreadyHandledPayerID;
        paymentModel = new PaymentModel(currentBasket, {}, {});
        assert.isDefined(paymentModel);
        assert.isFalse(paymentModel.isAlreadyPaidFromPayPal);
    });
});
