"use strict";

// Array of payment methods which require localization
// scheme -> credit card
var paymentMethods = ['scheme'];

var Resource = require('dw/web/Resource');
var paymentMethodNames = {};
paymentMethods.forEach(function(name) {
  var localizedName = Resource.msg('adyen.paymentMethodTitle.' + name, 'checkout', '');
  if (localizedName) {
    paymentMethodNames[name] = localizedName;
  }
});

module.exports = paymentMethodNames;
