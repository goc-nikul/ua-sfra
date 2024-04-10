'use strict';
var PaymentMgr = function() {

    this.activePaymentMethods = ['PayPal', 'PayPalCA', 'DW_APPLE_PAY', 'AURUS_CREDIT_CARD', 'KLARNA_PAYMENTS'];

    var getPaymentInstrument = function (paymentMethodID) {
        if (paymentMethodID === 'PayPal') {
            return 'AURUSPAY_PAYPAL';
        } else if (paymentMethodID === 'PayPalCA') {
            return 'PayPalCA';
        } else if (paymentMethodID === 'DW_APPLE_PAY') {
            return 'AURUSPAY_APPLEPAY';
        } else if (paymentMethodID === 'AURUS_CREDIT_CARD') {
            return 'AURUS_CREDIT_CARD';
        } else if (paymentMethodID === 'KLARNA_PAYMENTS') {
            return 'KLARNA_PAYMENTS';
        } else {
            return null;
        }
    }

    this.getPaymentMethod = function(id) {
        var paymentMethods = this.activePaymentMethods;
        var filteredPaymentMethod;
        if (id) {
            filteredPaymentMethod = paymentMethods.find(function (paymentMethod) {
                return id.toString() === paymentMethod;
            });
        }
        if (!filteredPaymentMethod) {
            return null;
        }
        return {
            getPaymentProcessor: function () {
                return {
                    getID: function() {
                        return getPaymentInstrument(filteredPaymentMethod);
                    },
                    ID: getPaymentInstrument(filteredPaymentMethod)
                };
            },
            paymentProcessor: {
                ID: {
                    toLowerCase: function () {
                        return 'processor';
                    }
                }
            },
            getApplicablePaymentCards: function () {
                return [];
            }
        };
    }

    this.getApplicablePaymentMethods= function() {
        return {
            contains: function () {
                return true;
            }
        };
    }
}
module.exports = new PaymentMgr();
