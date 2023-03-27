"use strict";

var store = require('../../../store');
var _require = require('./adyen_checkout/renderGenericComponent'),
  renderGenericComponent = _require.renderGenericComponent;
var _require2 = require('./adyen_checkout/checkoutConfiguration'),
  setCheckoutConfiguration = _require2.setCheckoutConfiguration,
  actionHandler = _require2.actionHandler;
var _require3 = require('./adyen_checkout/helpers'),
  assignPaymentMethodValue = _require3.assignPaymentMethodValue,
  showValidation = _require3.showValidation,
  paymentFromComponent = _require3.paymentFromComponent;
var _require4 = require('./adyen_checkout/validateComponents'),
  validateComponents = _require4.validateComponents;
var clientSideValidation = require('org/components/common/clientSideValidation');
$('#dwfrm_billing').submit(function apiRequest(e) {
  e.preventDefault();
  var form = $(this);
  clientSideValidation.checkMandatoryField(form);
  var url = form.attr('action');
  if (!form.find('input.is-invalid').length && !form.find('select.is-invalid').length) {
    $.ajax({
      type: 'POST',
      url: url,
      data: form.serialize(),
      async: false,
      success: function success(data) {
        store.formErrorsExist = 'fieldErrors' in data;
      }
    });
  } else {
    store.formErrorsExist = true;
  }
});
setCheckoutConfiguration();
if (window.cardholderNameBool !== 'null') {
  store.checkoutConfiguration.paymentMethodsConfiguration.card.hasHolderName = true;
  store.checkoutConfiguration.paymentMethodsConfiguration.card.holderNameRequired = true;
}
if (window.googleMerchantID !== 'null' && window.Configuration.environment === 'live') {
  var id = 'merchantIdentifier';
  store.checkoutConfiguration.paymentMethodsConfiguration.paywithgoogle.configuration[id] = window.googleMerchantID;
  store.checkoutConfiguration.paymentMethodsConfiguration.googlepay.configuration[id] = window.googleMerchantID;
}

// Submit the payment
$('button[value="submit-payment"]').on('click', function () {
  if (store.paypalTerminatedEarly) {
    paymentFromComponent({
      cancelTransaction: true,
      merchantReference: document.querySelector('#merchantReference').value
    });
    store.paypalTerminatedEarly = false;
  }
  if (document.querySelector('#selectedPaymentOption').value === 'AdyenPOS') {
    document.querySelector('#terminalId').value = document.querySelector('#terminalList').value;
  }
  if (document.querySelector('#selectedPaymentOption').value === 'AdyenComponent') {
    assignPaymentMethodValue();
    validateComponents();
    return showValidation();
  }
  return true;
});
module.exports = {
  renderGenericComponent: renderGenericComponent,
  actionHandler: actionHandler
};