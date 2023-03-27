'use strict';

/* global dw request session customer empty */

var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var paypalHelper = require('~/cartridge/scripts/paypal/paypalHelper');
var paypalApi = require('~/cartridge/scripts/paypal/paypalApi');
var prefs = paypalHelper.getPrefs();
var Logger = require('dw/system/Logger');
var controllerBase = {};

controllerBase.startCheckoutFromCart = function () {
    var basket = BasketMgr.getCurrentBasket();

    if (!basket) {
        return {
            error: 'empty_cart',
            redirectUrl: URLUtils.https(prefs.cartPageEndpoint)
        };
    }

    paypalHelper.prepareBasketForCheckoutFromCart(basket);

    var processorResult = require('~/cartridge/scripts/paypal/processor').handle(basket, true, false);
    if (processorResult.error) {
        return {
            error: processorResult.paypalErrorMessage,
            paypalErrorMessage: processorResult.paypalErrorMessage,
            redirectUrl: URLUtils.https(prefs.cartPageEndpoint, 'showPaypalError', true)
        };
    }
    return {
        token: processorResult.paypalToken
    };
};

controllerBase.returnFromPaypal = function (isFromCart) {
    var basket = BasketMgr.getCurrentBasket();
    if (!basket) {
        return {
            redirectUrl: URLUtils.https(prefs.cartPageEndpoint)
        };
    }

    var paymentInstrument = paypalHelper.getPaypalPaymentInstrument(basket);
    var expressCheckoutToken = request.httpParameterMap.token.stringValue;
    if (!paymentInstrument || !expressCheckoutToken) {
        var result = {
            paypalErrorMessage: dw.web.Resource.msg('paypal.error.notoken', 'locale', null),
            redirectUrl: URLUtils.https(prefs.checkoutBillingPageEndpoint, 'showPaypalError', true, 'stage', 'payment').toString()
        };

        if (isFromCart) {
            result = {
                paypalErrorMessage: dw.web.Resource.msg('paypal.error.notoken', 'locale', null),
                redirectUrl: URLUtils.https(prefs.cartPageEndpoint, 'showPaypalError', true).toString()
            };
        }
        return result;
    }

    var getExpressCheckoutDetailsResult = paypalApi.getExpressCheckoutDetails(expressCheckoutToken, basket.getCurrencyCode());

    if (getExpressCheckoutDetailsResult.error) {
        var payPalErrorMessage = paypalHelper.createPaypalErrorMessage(getExpressCheckoutDetailsResult.responseData);
        var errorResult = {
            paypalErrorMessage: payPalErrorMessage,
            redirectUrl: URLUtils.https(prefs.checkoutBillingPageEndpoint, 'showPaypalError', true, 'stage', 'payment')
        };
        if (isFromCart) {
            errorResult = {
                paypalErrorMessage: payPalErrorMessage,
                redirectUrl: URLUtils.https(prefs.cartPageEndpoint, 'showPaypalError', true)
            };
        }
        return errorResult;
    }
    var responseData = getExpressCheckoutDetailsResult.responseData;
    
    var paypalToken = responseData.token || expressCheckoutToken;
    if (!paypalToken) {
        Logger.error('Processing PayPal callback. Missing PayPal token.');
        var result = {
            paypalErrorMessage: dw.web.Resource.msg('paypal.error.notoken', 'locale', null),
            redirectUrl: URLUtils.https(prefs.checkoutBillingPageEndpoint, 'showPaypalError', true, 'stage', 'payment').toString()
        };

        if (isFromCart) {
            result = {
                paypalErrorMessage: dw.web.Resource.msg('paypal.error.notoken', 'locale', null),
                redirectUrl: URLUtils.https(prefs.cartPageEndpoint, 'showPaypalError', true).toString()
            };
        }
        return result;
    }
    var paypalPayerId = !empty(responseData.payerid) ? responseData.payerid : request.httpParameterMap.PayerID.stringValue;
    Logger.debug('Processing PayPal callback. PayPal Payer ID: {0}', !empty(paypalPayerId) ? paypalPayerId : 'No PayPal Payer ID provided');

    Transaction.wrap(function () {
        if (customer.authenticated) {
            basket.setCustomerEmail(customer.getProfile().getEmail());
        } else if (isFromCart) {
            basket.setCustomerEmail(responseData.email);
        }

        paymentInstrument.custom.paypalPayerID = paypalPayerId;
        paymentInstrument.custom.paypalEmail = responseData.email;
        paymentInstrument.custom.paypalToken = paypalToken;
        paymentInstrument.getPaymentTransaction().setAmount(new dw.value.Money(responseData.amt, basket.getCurrencyCode()));

        basket.custom.paypalAlreadyHandledPayerID = responseData.payerid;
        basket.custom.paypalAlreadyHandledToken = paypalToken;
        basket.custom.paypalAlreadyHandledEmail = responseData.email;

        if (!prefs.PP_API_ShippingAddressOverride || isFromCart) {
            var shippingAddress = basket.getDefaultShipment().getShippingAddress();
            paypalHelper.updateShippingAddress(responseData, shippingAddress, 0);
        }
        /*PHX-1586 : The Code has been modified to update billing from PayPal even if user has entered billing address 
         * in UA Site. However this should not be correct behavior but modifying the code as per the ticket requirement.
         * Commenting out isFromCart boolean variable, so that it should take billing address from PayPal every time
         * rather than only when it's from cart.
         */
        if ((prefs.PP_API_RequestBillingAddressFromPayPal && isFromCart) || (prefs.PP_API_RequestBillingAddressFromPayPal && prefs.PP_API_BillingAddressOverride)) {
            var billingAddress = basket.getBillingAddress();
            Transaction.wrap(function () {
                if (!billingAddress) {
                    billingAddress = basket.createBillingAddress();
                }
            });
            paypalHelper.updateBillingAddress(responseData, billingAddress);
        }

        if (!prefs.PP_API_RequestBillingAddressFromPayPal) {
            if (!basket.getCustomer().isAuthenticated() && empty(basket.getBillingAddress().getFirstName())) {
                basket.getBillingAddress().setFirstName(dw.web.Resource.msg('paypal.checkout.guest', 'locale', null));
            }
        }
    });
    // Update shipping address type | PayPal express checkout flow
    var shippingAddress = basket.getDefaultShipment().getShippingAddress();
    var defaultShipment = basket.getDefaultShipment();
    var address = {};
    address.countryCode = shippingAddress.countryCode.value;
    address.stateCode = shippingAddress.stateCode;
    address.postalCode = shippingAddress.postalCode;
    address.city = shippingAddress.city;
    address.address1 = shippingAddress.address1;
    address.address2 = shippingAddress.address2;
    var shippingHelpers = require('app_ua_core/cartridge/scripts/checkout/shippingHelpers');
    var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(defaultShipment, address);
    if(applicableShippingMethods.length > 0) {
        var isApplicableShippingMethod = false;
        if (defaultShipment.getShippingMethod()) {
            for (var i = 0; i < applicableShippingMethods.length; i++) {
                if (defaultShipment.getShippingMethod().getID().equals(applicableShippingMethods[i].ID)) {
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
    var billingAddress = basket.getBillingAddress();
    if(shippingAddress && empty(shippingAddress.custom.addressType)){
        require('*/cartridge/modules/providers').get('AddressType', shippingAddress).addressType();
    }

    var paypalForm = session.forms.billing.paypal;

    //Validate Shipping/Billing address field
    var isValidShipToAddress = shippingAddress ? paypalHelper.validateShippingAddress(shippingAddress) : false;
    var isValidBillToAddress = billingAddress ? paypalHelper.validateBillingAddress(billingAddress) : false;
    if (!isValidShipToAddress || !isValidBillToAddress) {
        var addressRedirectUrl = URLUtils.https('Cart-Show', 'showPaypalError', true); //redirect to cart page if any issue in address with error message
        var paypalAddressErrorMessage = !isValidShipToAddress ? 
            dw.web.Resource.msg('paypal.error.code10736', 'locale',null) : dw.web.Resource.msg('paypal.error.billing', 'locale',null);
        if (basket && basket.custom && basket.custom.isCommercialPickup && !isValidBillToAddress ) {
            addressRedirectUrl = URLUtils.https('Checkout-Begin', 'showPaypalError', true);
        }

        if (!isValidShipToAddress && paymentInstrument) {
            Transaction.wrap(function () {
                basket.removePaymentInstrument(paymentInstrument);
                basket.custom.paypalAlreadyHandledPayerID = null;
                basket.custom.paypalAlreadyHandledToken = null;
                basket.custom.paypalAlreadyHandledEmail = null;
            });
        }

        return {
            error: true,
            paypalErrorMessage: paypalAddressErrorMessage,
            redirectUrl : addressRedirectUrl
        };
    }
    var isAddressLengthExceeded = shippingAddress ? paypalHelper.validateShippingAddressLength(shippingAddress) : false;
    if (isAddressLengthExceeded) {
        return {
            redirectUrl : URLUtils.https(prefs.summaryPageEndpoint, 'stage', 'shipping')
        };
    }
    if (paypalForm.saveBillingAgreement.checked || paypalForm.useCustomerBillingAgreement.checked || isFromCart) {
        var customerBillingAgreement = paypalHelper.getCustomerBillingAgreement(basket.getCurrencyCode());
        if (!customerBillingAgreement.getDefaultShippingAddress() || paypalForm.saveBillingAgreement.checked) {
            require('~/cartridge/scripts/paypal/accountHelpers').saveShippingAddressToAccountFromBasket(basket);
        }

        if (!isFromCart) {
            customerBillingAgreement.setUseCheckboxState(paypalForm.saveBillingAgreement.checked || paypalForm.useCustomerBillingAgreement.checked);
        }
    }
    return {
        redirectUrl: URLUtils.https(prefs.summaryPageEndpoint, 'stage', 'placeOrder')
    };
};

controllerBase.startBillingAgreementCheckout = function () {
    var basket = BasketMgr.getCurrentBasket();
    if (!basket) {
        return {
            redirectUrl: URLUtils.https(prefs.cartPageEndpoint)
        };
    }

    paypalHelper.prepareBasketForCheckoutFromCart(basket);
    var orderShippingAddress = basket.getDefaultShipment().getShippingAddress();
    var customerBillingAgreement = paypalHelper.getCustomerBillingAgreement(basket.getCurrencyCode());
    var defaultShippingAddress = customerBillingAgreement.getDefaultShippingAddress();

    if (!defaultShippingAddress && orderShippingAddress.getAddress1() === null && basket.getDefaultShipment().productLineItems.length > 0) {
        return {
            redirectUrl: URLUtils.https('Paypal-EditDefaultShippinAddress')
        };
    }

    var processorResult = require('~/cartridge/scripts/paypal/processor').handle(basket, true, true);
    if (processorResult.error) {
        return {
            redirectUrl: URLUtils.https(prefs.cartPageEndpoint)
        };
    }

    Transaction.wrap(function () {
        basket.setCustomerEmail(customer.getProfile().getEmail());

        if (orderShippingAddress.getAddress1() === null && basket.getDefaultShipment().productLineItems.length > 0) {
            orderShippingAddress.setFirstName(defaultShippingAddress.firstName);
            orderShippingAddress.setLastName(defaultShippingAddress.lastName);
            orderShippingAddress.setAddress1(defaultShippingAddress.address1);
            orderShippingAddress.setAddress2(defaultShippingAddress.address2);
            orderShippingAddress.setCity(defaultShippingAddress.city);
            orderShippingAddress.setPostalCode(defaultShippingAddress.postalCode);
            orderShippingAddress.setStateCode(defaultShippingAddress.stateCode);
            orderShippingAddress.setCountryCode(defaultShippingAddress.countryCode.value);
            orderShippingAddress.setPhone(defaultShippingAddress.phone);
        }
    });

    if (prefs.PP_API_RequestBillingAddressFromPayPal) {
        Transaction.wrap(function () {
            paypalHelper.updateBillingAddress(processorResult.actualBillingAgreementData.responseData, basket.getBillingAddress());
        });
    }

    return {
        redirectUrl: URLUtils.https(prefs.summaryPageEndpoint, 'stage', 'placeOrder')
    };
};

module.exports = controllerBase;
