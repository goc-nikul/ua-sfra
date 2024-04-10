var adyenCheckoutConfiguration = require('adyen/adyen_checkout/checkoutConfiguration');

var setCheckoutConfiguration = adyenCheckoutConfiguration.setCheckoutConfiguration;

var store = require('int_adyen_SFRA/cartridge/store');

/**
 * Update Paypal preferences to block PayPal Credit and PayPal Pay Later.
 */
var setCheckoutConfigurationOverride = function () {
    setCheckoutConfiguration();
    if (window.sitePreferences.blockPayPalPayLaterButton && store && store.checkoutConfiguration && store.checkoutConfiguration.paymentMethodsConfiguration && store.checkoutConfiguration.paymentMethodsConfiguration.paypal) {
        store.checkoutConfiguration.paymentMethodsConfiguration.paypal.blockPayPalPayLaterButton = true;
    }
};

adyenCheckoutConfiguration.setCheckoutConfiguration = setCheckoutConfigurationOverride;

module.exports = adyenCheckoutConfiguration;
