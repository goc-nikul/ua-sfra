"use strict";

var OrderMgr = require('dw/order/OrderMgr');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');

// order-confirm is POST in SFRA v6.0.0. orderID and orderToken are contained in form.
// This was a GET call with a querystring containing ID & token in earlier versions.
function getOrderId(req) {
  return req.form && req.form.orderID ? req.form.orderID : req.querystring.ID;
}
function getOrderToken(req) {
  return req.form && req.form.orderToken ? req.form.orderToken : req.querystring.token;
}
function handleAdyenGiving(req, res, order) {
  var clientKey = AdyenConfigs.getAdyenClientKey();
  var environment = AdyenHelper.getCheckoutEnvironment();
  var configuredAmounts = AdyenHelper.getDonationAmounts();
  var charityName = AdyenConfigs.getAdyenGivingCharityName();
  var charityWebsite = AdyenConfigs.getAdyenGivingCharityWebsite();
  var charityDescription = AdyenConfigs.getAdyenGivingCharityDescription();
  var adyenGivingBackgroundUrl = AdyenConfigs.getAdyenGivingBackgroundUrl();
  var adyenGivingLogoUrl = AdyenConfigs.getAdyenGivingLogoUrl();
  var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
  var donationAmounts = {
    currency: session.currency.currencyCode,
    values: configuredAmounts
  };
  var viewData = res.getViewData();
  viewData.adyen = {
    clientKey: clientKey,
    environment: environment,
    adyenGivingAvailable: true,
    pspReference: paymentInstrument.paymentTransaction.custom.Adyen_pspReference,
    donationAmounts: JSON.stringify(donationAmounts),
    charityName: charityName,
    charityDescription: charityDescription,
    charityWebsite: charityWebsite,
    adyenGivingBackgroundUrl: adyenGivingBackgroundUrl,
    adyenGivingLogoUrl: adyenGivingLogoUrl
  };
  res.setViewData(viewData);
}
function confirm(req, res, next) {
  var orderId = getOrderId(req);
  var orderToken = getOrderToken(req);
  if (orderId && orderToken) {
    session.custom.currentOrder = null;
    var order = OrderMgr.getOrder(orderId, orderToken);
    var adyenPaymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
    if (!adyenPaymentInstruments.length) {
      return next();
    }
    var paymentInstrument = adyenPaymentInstruments[0];
    var paymentMethod = paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod;

    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;

    if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
      if (!('orderConfirmationEmailStatus' in order.custom) ||
        ('orderConfirmationEmailStatus' in order.custom &&
        order.custom.orderConfirmationEmailStatus &&
        order.custom.orderConfirmationEmailStatus.value &&
        order.custom.orderConfirmationEmailStatus.value !== 'PROCESSED')) {
          Transaction.wrap(function () {
            order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
          });
      }
    } else if (lastOrderID !== req.querystring.ID) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }

    if (AdyenHelper.getAdyenGivingConfig(order) && AdyenHelper.isAdyenGivingAvailable(paymentMethod)) {
      handleAdyenGiving(req, res, order);
    }
  }
  return next();
}
module.exports = confirm;