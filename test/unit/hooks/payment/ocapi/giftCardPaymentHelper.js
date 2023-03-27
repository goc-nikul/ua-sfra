'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var basketStub = sinon.stub();
var updatePaymentTransactionStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/payment/ocapi/giftCardPaymentHelper.js', () => {

    var giftCardPaymentHelper = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/payment/ocapi/giftCardPaymentHelper.js', {
        '*/cartridge/scripts/checkout/giftCardPaymentHelper': {
            calculateNonGiftCertificateAmount: () => {
                return {
                    value: 1
                };
            }
        },
        'dw/order/BasketMgr': {
            getCurrentBasket: basketStub
        },
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '*/cartridge/scripts/giftcard/giftcardHelper': {
            updatePaymentTransaction: updatePaymentTransactionStub,
            getRemainingBalance: () => 10
        }
    });
    global.empty = (params) => !params;

    it('Testing method: updatePaymentInstrument', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        basketStub.returns(basket);
        var paymentInstrumentRequest = new (require('../../../../mocks/dw/dw_order_PaymentInstrument'))();
        var result = giftCardPaymentHelper.updatePaymentInstrument(paymentInstrumentRequest);
        assert.isFalse(result.error);
        basketStub.resetBehavior();
    });

    it('Testing method: adjustPaymentInstrument with error', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        basketStub.returns(basket);
        updatePaymentTransactionStub.returns({
            error: true
        });
        var result = giftCardPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                c_gcNumber_s: '1234'
            }
        }));
        assert.isTrue(result.error);
        assert.equal(result.errorCode, 'EmptyOrInvalidGiftcard');
        updatePaymentTransactionStub.resetBehavior();
        basketStub.resetBehavior();
    });

    it('Testing method: adjustPaymentInstrument without error', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        basketStub.returns(basket);
        updatePaymentTransactionStub.returns({
            error: false,
            giftCardsWithZeroBalance: [{
                cardNumber: '1234'
            }]
        });
        var result = giftCardPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                c_gcNumber_s: '1234'
            }
        }));
        assert.isTrue(result.error);
        assert.equal(result.errorCode, 'EmptyOrInvalidGiftcard');

        var result2 = giftCardPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                c_gcNumber_s: '1235'
            }
        }));
        assert.isFalse(result2.error);

        updatePaymentTransactionStub.resetBehavior();
        basketStub.resetBehavior();
    });

    it('Testing method: modifyPaymentResponse', () => {
        assert.isFalse(giftCardPaymentHelper.modifyPaymentResponse(null, {}).error);
    });

});
