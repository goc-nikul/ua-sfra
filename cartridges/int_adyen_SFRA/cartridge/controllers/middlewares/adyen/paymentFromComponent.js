"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Money = require('dw/value/Money');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var constants = require('*/cartridge/adyenConstants/constants');
var collections = require('*/cartridge/scripts/util/collections');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
  var reqDataObj = JSON.parse(req.form.data);
  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error("Shopper cancelled paymentFromComponent transaction for order ".concat(reqDataObj.merchantReference));
    var _order = OrderMgr.getOrder(reqDataObj.merchantReference, reqDataObj.orderToken);
    Transaction.wrap(function () {
      OrderMgr.failOrder(_order, true);
    });
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
    return next();
  }
  var currentBasket = BasketMgr.getCurrentBasket();
  var paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
    var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
      paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    if (reqDataObj.partialPaymentsOrder) {
      paymentInstrument.custom.adyenPartialPaymentsOrder = JSON.stringify(reqDataObj.partialPaymentsOrder);
    }
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;
  });
  var orderNo = OrderMgr.createOrderNo();
  var result;
  Transaction.wrap(function () {
    result = adyenCheckout.createPaymentRequest({
      Order: currentBasket,
      orderNo: orderNo,
      PaymentInstrument: paymentInstrument
    });
  });
  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    Logger.getLogger('Adyen').error("Payment refused for order ".concat(order.orderNo));
    result.paymentError = true;

    // Decline flow for Amazon pay is handled different from other Component PMs
    // Order needs to be failed here to handle Amazon decline flow.
    /* Commented out due to PFAL-562
    if (reqDataObj.paymentMethod === 'amazonpay') {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
    }
    */
  }

  // Check if gift card was used
  if (session.privacy.giftCardResponse) {
    var divideBy = AdyenHelper.getDivisorForCurrency(currentBasket.totalGrossPrice);
    var parsedGiftCardObj = JSON.parse(session.privacy.giftCardResponse);
    var remainingAmount = {
      value: parsedGiftCardObj.remainingAmount.value,
      currency: parsedGiftCardObj.remainingAmount.currency
    };
    var formattedAmount = new Money(remainingAmount.value, remainingAmount.currency).divide(divideBy);
    var mainPaymentInstrument = currentBasket.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
    // update amount from order total to PM total
    Transaction.wrap(function () {
      mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount);
    });
    var paidGiftcardAmount = {
      value: parsedGiftCardObj.value,
      currency: parsedGiftCardObj.currency
    };
    var formattedGiftcardAmount = new Money(paidGiftcardAmount.value, paidGiftcardAmount.currency).divide(divideBy);
    Transaction.wrap(function () {
      var giftcardPM = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, formattedGiftcardAmount);
      var _PaymentMgr$getPaymen2 = PaymentMgr.getPaymentMethod(giftcardPM.paymentMethod),
        paymentProcessor = _PaymentMgr$getPaymen2.paymentProcessor;
      giftcardPM.paymentTransaction.paymentProcessor = paymentProcessor;
      giftcardPM.custom.adyenPaymentMethod = parsedGiftCardObj.brand;
      giftcardPM.paymentTransaction.custom.Adyen_log = session.privacy.giftCardResponse;
      giftcardPM.paymentTransaction.custom.Adyen_pspReference = parsedGiftCardObj.giftCardpspReference;
    });
  }
  result.orderNo = orderNo;
  res.json(result);
  return next();
}
module.exports = paymentFromComponent;