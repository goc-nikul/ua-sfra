'use strict';

const sinon = require('sinon');
const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var basketStub = sinon.stub();
var updatePaymentTransactionStub = sinon.stub();
var prefStub = sinon.stub();
var calculateNonGiftCertificateAmountStub = sinon.stub();
var expressCheckoutDetailsStub = sinon.stub();
var shippingAddressStub = sinon.stub();
var billingAddressStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/payment/ocapi/paypalPaymentHelper.js', () => {

    var paypalPaymentHelper = proxyquire('../../../../../cartridges/int_ocapi/cartridge/hooks/payment/ocapi/paypalPaymentHelper.js', {
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            calculateNonGiftCertificateAmount: calculateNonGiftCertificateAmountStub
        },
        '*/cartridge/scripts/paypal/paypalApi': {
            getExpressCheckoutDetails: expressCheckoutDetailsStub
        },
        '*/cartridge/scripts/paypal/paypalHelper': {
            getPrefs: prefStub,
            validateShippingAddress: function(shippingAddress) {
                return false;
            },
            validateBillingAddress: function(billingAddress) {
                return false
            },
            updateBillingAddress: function(responseData, billingAddress) {
                return
            },
            getPaypalPaymentInstrument: function(basket) {
                return [{
                    ID: 'test'
                }];
            },
            isValidShipToAddress: shippingAddressStub,
            isValidBillToAddress: billingAddressStub

        },
        'dw/order/BasketMgr': {
            getCurrentBasket: basketStub
        },
        'dw/order/PaymentMgr': require('../../../../mocks/dw/dw_order_PaymentMgr'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/scripts/giftcard/giftcardHelper': {
            updatePaymentTransaction: updatePaymentTransactionStub,
            getRemainingBalance: () => 10
        },
        '~/cartridge/scripts/basketHelper': {
            updatePaypalTokenExpirationTime: () => true
        },
        'app_ua_core/cartridge/scripts/checkout/shippingHelpers': {
            getApplicableShippingMethods: function (defaultShipment, address) {
                return [{
                    ID: 'test',
                    custom: {
                        storePickupEnabled: false
                    },
                    getID: function () {
                        return 'test';
                    }
                }];
            }
        }
    });
    global.empty = (params) => !params;

    it('Testing method: updatePaymentInstrument with 0 non GC', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        calculateNonGiftCertificateAmountStub.returns({
            value: 0
        });
        basketStub.returns(basket);
        var paymentInstrumentRequest = new (require('../../../../mocks/dw/dw_order_PaymentInstrument'))();
        var result = paypalPaymentHelper.updatePaymentInstrument(paymentInstrumentRequest);
        assert.isTrue(result.error);
        basketStub.resetBehavior();
        calculateNonGiftCertificateAmountStub.resetBehavior();
    });

    it('Testing method: updatePaymentInstrument with 10 non GC', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createShipment('test1');
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        calculateNonGiftCertificateAmountStub.returns({
            value: 10
        });
        basketStub.returns(basket);
        expressCheckoutDetailsStub.returns({
            error: false
        });
        prefStub.returns({
            PP_API_RequestBillingAddressFromPayPal: true,
            PP_API_BillingAddressOverride: true
        });
        var result = paypalPaymentHelper.updatePaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                payment_method_id: 'PayPalCA',
                c_paypalPayerID_s: '124',
                c_paypalToken_s: 'abc'
            }
        }));
        assert.isTrue(result.error);
        basketStub.resetBehavior();
        calculateNonGiftCertificateAmountStub.resetBehavior();
        expressCheckoutDetailsStub.resetBehavior();
    });

    it('Testing method: updatePaymentInstrument with 10 non GC CA', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createShipment('test1');
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        calculateNonGiftCertificateAmountStub.returns({
            value: 10
        });
        basketStub.returns(basket);
        expressCheckoutDetailsStub.returns({
            error: false
        });
        prefStub.returns({
            PP_API_RequestBillingAddressFromPayPal: true,
            PP_API_BillingAddressOverride: true
        });
        basket.defaultShipment.shippingAddress.countryCode.value = 'CA';
        shippingAddressStub.returns(false);
        billingAddressStub.returns(false);
        global.request.getLocale = function () {
            return 'en_CA';
        };
        var result = paypalPaymentHelper.updatePaymentInstrument(JSON.stringify({
            basketpaymentinstrumentrequest: {
                payment_method_id: 'PayPalCA',
                c_paypalPayerID_s: '124',
                c_paypalToken_s: 'abc'
            }
        }));
        assert.isFalse(result.error);
        basketStub.resetBehavior();
        calculateNonGiftCertificateAmountStub.resetBehavior();
        expressCheckoutDetailsStub.resetBehavior();
    });

    it('Testing method: adjustPaymentInstrument with error US', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        basketStub.returns(basket);
        updatePaymentTransactionStub.returns({
            error: true
        });
        var result = paypalPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                payment_method_id: 'PayPal',
                c_gcNumber_s: '1234'
            }
        }));
        assert.isFalse(result.error);
        updatePaymentTransactionStub.resetBehavior();
        basketStub.resetBehavior();
    });

    it('Testing method: adjustPaymentInstrument without error US', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        basketStub.returns(basket);
        updatePaymentTransactionStub.returns({
            error: false,
            giftCardsWithZeroBalance: [{
                cardNumber: '1234'
            }]
        });
        var result = paypalPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                payment_method_id: 'PayPal',
                c_gcNumber_s: '1234'
            }
        }));
        assert.isFalse(result.error);

        var result2 = paypalPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                payment_method_id: 'PayPal',
                c_gcNumber_s: '1235'
            }
        }));
        assert.isFalse(result2.error);

        updatePaymentTransactionStub.resetBehavior();
        basketStub.resetBehavior();
    });
    it('Testing method: adjustPaymentInstrument with error CA', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        basketStub.returns(basket);
        updatePaymentTransactionStub.returns({
            error: true
        });
        var result = paypalPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                payment_method_id: 'PayPalCA',
                c_gcNumber_s: '1234'
            }
        }));
        assert.isFalse(result.error);
        updatePaymentTransactionStub.resetBehavior();
        basketStub.resetBehavior();
    });

    it('Testing method: adjustPaymentInstrument without error CA', () => {
        var basket = new (require('../../../../mocks/dw/dw_order_Basket'))();
        basket.createPaymentInstrument('NON_GIFT_CARD', 10);
        basketStub.returns(basket);
        updatePaymentTransactionStub.returns({
            error: false,
            giftCardsWithZeroBalance: [{
                cardNumber: '1234'
            }]
        });
        var result = paypalPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                payment_method_id: 'PayPalCA',
                c_gcNumber_s: '1234'
            }
        }));
        assert.isFalse(result.error);

        var result2 = paypalPaymentHelper.adjustPaymentInstrument(JSON.stringify({
            basket_payment_instrument_request: {
                payment_method_id: 'PayPalCA',
                c_gcNumber_s: '1235'
            }
        }));
        assert.isFalse(result2.error);

        updatePaymentTransactionStub.resetBehavior();
        basketStub.resetBehavior();
    });
});
