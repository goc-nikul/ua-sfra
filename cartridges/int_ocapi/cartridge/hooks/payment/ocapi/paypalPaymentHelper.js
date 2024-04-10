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
            if (basketPaymentInstrumentRequest && basketPaymentInstrumentRequest.c_paypalPayerID_s && basketPaymentInstrumentRequest.payment_method_id) {
                var expressCheckoutToken = basketPaymentInstrumentRequest.c_paypalToken_s || null;
                // Check paypal payment processor.
                var PaymentMgr = require('dw/order/PaymentMgr');
                var paymentMethodId = basketPaymentInstrumentRequest.payment_method_id;
                var paymentProcessorId = PaymentMgr.getPaymentMethod(paymentMethodId).getPaymentProcessor().getID();
                if (expressCheckoutToken && paymentProcessorId.toString().toUpperCase() === paymentMethodId.toString().toUpperCase()) {
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
                        var defaultShipment = basket.getDefaultShipment();
                        var shippingHelpers = require('app_ua_core/cartridge/scripts/checkout/shippingHelpers');
                        var address = {};
                        address.countryCode = shippingAddress.countryCode.value;
                        address.stateCode = shippingAddress.stateCode;
                        address.postalCode = shippingAddress.postalCode;
                        address.city = shippingAddress.city;
                        address.address1 = shippingAddress.address1;
                        address.address2 = shippingAddress.address2;
                        var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(defaultShipment, address);
                        if (applicableShippingMethods.length > 0) {
                            var isApplicableShippingMethod = false;
                            if (defaultShipment.getShippingMethod()) {
                                for (var i = 0; i < applicableShippingMethods.length; i++) {
                                    if (defaultShipment.getShippingMethod().ID.equals(applicableShippingMethods[i].ID)) {
                                        isApplicableShippingMethod = true;
                                        break;
                                    }
                                }
                            }
                            // set first applicable shipping method if the selected shipping method is not applicable or no shipping method is set to the shipment
                            if (!isApplicableShippingMethod || !defaultShipment.getShippingMethod()) {
                                Transaction.wrap(function () {
                                    defaultShipment.setShippingMethod(applicableShippingMethods[0].raw);
                                });
                            }
                        }
                        Transaction.wrap(function () {
                            if (shippingAddress && empty(shippingAddress.custom.addressType)) {
                                require('*/cartridge/modules/providers').get('AddressType', shippingAddress).addressType();
                            }
                        });
                        if (prefs.PP_API_RequestBillingAddressFromPayPal && prefs.PP_API_BillingAddressOverride) {
                            var billingAddress;
                            // added for ocapi paypal payment
                            // removing the address check because of EPMD-10977
                            Transaction.wrap(function () {
                                billingAddress = basket.createBillingAddress();
                            });
                            paypalHelper.updateBillingAddress(responseData, billingAddress);
                        }

                        // Restricting US address from Canada checkout
                        // Validate Shipping/Billing address field
                        var paymentInstrument = paypalHelper.getPaypalPaymentInstrument(basket);
                        var isValidShipToAddress = shippingAddress ? paypalHelper.validateShippingAddress(shippingAddress) : false;
                        var isValidBillToAddress = basket.getBillingAddress() ? paypalHelper.validateBillingAddress(basket.getBillingAddress()) : false;
                        if (!isValidShipToAddress || !isValidBillToAddress) {
                            var paypalAddressErrorMessage = !isValidShipToAddress ?
                                dw.web.Resource.msg('paypal.error.code10736', 'locale', null) : dw.web.Resource.msg('paypal.error.billing', 'locale', null);

                            if (!isValidShipToAddress && paymentInstrument) {
                                Transaction.wrap(function () {
                                    basket.removePaymentInstrument(paymentInstrument);
                                    basket.custom.paypalAlreadyHandledPayerID = null;
                                    basket.custom.paypalAlreadyHandledToken = null;
                                    basket.custom.paypalAlreadyHandledEmail = null;
                                });
                            }
                            result.error = true;
                            result.msg = paypalAddressErrorMessage;
                            result.errorCode = 'InvalidAddress';
                            return result;
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
