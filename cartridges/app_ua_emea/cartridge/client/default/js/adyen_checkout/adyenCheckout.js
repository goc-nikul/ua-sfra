var adyenCheckoutConfiguration = require('./checkoutConfiguration');

var base = require('adyen/adyenCheckout');

// Overriden to update the checkoutConfiguration
base.adyenCheckoutConfiguration = adyenCheckoutConfiguration;

module.exports = base;
