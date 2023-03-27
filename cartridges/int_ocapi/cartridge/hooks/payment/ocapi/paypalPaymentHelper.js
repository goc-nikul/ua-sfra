'use strict';

/* Script modules */

/**
 * Handle create payment instrument request for PayPal payment method
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} paymentInstrumentRequest - Updated payment Instrument Request
 */
function updatePaymentInstrument(paymentInstrumentRequest) {
    var result = {
        error: false
    };
    try {
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var paypalApi = require('*/cartridge/scripts/paypal/paypalApi');
        var paypalHelper = require('*/cartridge/scripts/paypal/paypalHelper');
        var prefs = paypalHelper.getPrefs();
        var BasketMgr = require('dw/order/BasketMgr');
        var basket = BasketMgr.getCurrentBasket();
        // Remove all the existing payment instruments
        // As per current implementation, we don't support part/mixed payment with PayPal
        if (!empty(basket)) {
            var paymentInstruments = basket.getPaymentInstruments();
            if (paymentInstruments.size() > 0) {
                var paymentInstrumentsIt = paymentInstruments.iterator();
                Transaction.wrap(function () {
                    while (paymentInstrumentsIt.hasNext()) {
                        var paymentInstrument = paymentInstrumentsIt.next();
                        basket.removePaymentInstrument(paymentInstrument);
                    }
                });
            }
            var nonGiftCertificateAmount = COHelpers.calculateNonGiftCertificateAmount(basket);
            if (nonGiftCertificateAmount.value <= 0) {
                // return error if order total is 0 or null
                result.msg = Resource.msg('error.paymentinstrument.invalid.ordertotal', 'checkout', null);
                result.error = true;
                return result;
            }

            var paymentInstrumentRequestObject = JSON.parse(paymentInstrumentRequest);
            paymentInstrumentRequestObject.amount = nonGiftCertificateAmount.value;
            var basketPaymentInstrumentRequest = paymentInstrumentRequestObject ? paymentInstrumentRequestObject.basket_payment_instrument_request : null;
            if (basketPaymentInstrumentRequest && basketPaymentInstrumentRequest.c_paypalPayerID_s) {
                var expressCheckoutToken = basketPaymentInstrumentRequest.c_paypalToken_s || null;
                if (expressCheckoutToken) {
                    var shippingAddressOverride = true;
                    var getExpressCheckoutDetailsResult = paypalApi.getExpressCheckoutDetails(expressCheckoutToken, basket.getCurrencyCode());

                    if (!getExpressCheckoutDetailsResult.error) {
                        var responseData = getExpressCheckoutDetailsResult.responseData;
                        var shippingAddress = basket.getDefaultShipment() && basket.getDefaultShipment().getShippingAddress() ? basket.getDefaultShipment().getShippingAddress() : null;
                        if (shippingAddress && shippingAddress.firstName && shippingAddress.lastName && shippingAddress.address1 && shippingAddress.city && shippingAddress.postalCode && shippingAddress.stateCode && (shippingAddress.countryCode && shippingAddress.countryCode.value)) {
                            shippingAddressOverride = false;
                        }
                        // added for ocapi paypal payment
                        if (shippingAddress == null) {
                            Transaction.wrap(function () {
                                shippingAddress = basket.getDefaultShipment().createShippingAddress();
                            });
                        }
                        if (shippingAddressOverride) {
                            paypalHelper.updateShippingAddress(responseData, shippingAddress, 0);
                        }
                     // Update shipping address type | PayPal express checkout flow
                        Transaction.wrap(function () {
                            if (shippingAddress && empty(shippingAddress.custom.addressType)) {
                                require('*/cartridge/modules/providers').get('AddressType', shippingAddress).addressType();
                            }
                        });
                        if (prefs.PP_API_RequestBillingAddressFromPayPal && prefs.PP_API_BillingAddressOverride) {
                            var billingAddress = basket.getBillingAddress();
                            // added for ocapi paypal payment
                            if (billingAddress == null) {
                                Transaction.wrap(function () {
                                    billingAddress = basket.createBillingAddress();
                                });
                            }
                            paypalHelper.updateBillingAddress(responseData, billingAddress);
                        }
                    }
                }
            }
        }
    } catch (e) {
        result.error = true;
        result.msg = e.message;
        return result;
    }
    return result;
}


/**
 * Update paypal payment token expiration date
 * @param {Object} paymentInstrumentRequest - Payment Instrument Request
 * @return {Object} result
 */
function adjustPaymentInstrument() {
    var result = { error: false };
    var BasketMgr = require('dw/order/BasketMgr');
    var basketHelper = require('~/cartridge/scripts/basketHelper');
    var basket = BasketMgr.getCurrentBasket();
    basketHelper.updatePaypalTokenExpirationTime(basket);
    return result;
}

exports.updatePaymentInstrument = updatePaymentInstrument;
exports.adjustPaymentInstrument = adjustPaymentInstrument;
