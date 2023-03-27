"use strict";

/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Demandware Script File
 * where
 *   <paramUsageType> can be either 'input' or 'output'
 *   <paramName> can be any valid parameter name
 *   <paramDataType> identifies the type of the parameter
 *   <paramComment> is an optional comment
 *
 * For example:
 *
 * @input CustomObj : dw.object.CustomObject
 * @output Order: dw.order.Order The updated order
 * @output EventCode: String The event code
 * @output SubmitOrder: Boolean Submit order
 * @output RefusedHpp: Boolean Indicates that payment was made with using
 * Adyen method and was refused
 * @output Pending  : Boolean Indicates that payment is in pending status
 * @output SkipOrder  : Boolean Indicates that we should skip order,
 * order creation date > current date
 *
 */

var Logger = require('dw/system/Logger');
var PaymentMgr = require('dw/order/PaymentMgr');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var HookMgr = require('dw/system/HookMgr');
var constants = require('*/cartridge/adyenConstants/constants');
var adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
function execute(args) {
  var result = handle(args.CustomObj);
  args.EventCode = result.EventCode;
  args.SubmitOrder = result.SubmitOrder;
  args.RefusedHpp = result.RefusedHpp;
  args.Pending = result.Pending;
  args.SkipOrder = result.SkipOrder;
  args.Order = result.Order;
  return result.status;
}
function handle(customObj) {
  var OrderMgr = require('dw/order/OrderMgr');
  var Transaction = require('dw/system/Transaction');
  var refusedHpp = false;
  var pending = false;
  var result = {};
  result.status = PIPELET_ERROR;
  result.EventCode = customObj.custom.eventCode;
  result.SubmitOrder = false;
  result.SkipOrder = false;

  var orderId = customObj.custom.orderId.split('-', 2).join('-');
  var order = OrderMgr.getOrder(orderId);
  result.Order = order;
  if (order === null) {
    // check to see if this was a $0.00 auth for recurring payment. if yes, CO can safely be deleted
    if (orderId.indexOf('recurringPayment') > -1) {
      result.SkipOrder = true;
      setProcessedCOInfo(customObj);
    } else {
      Logger.getLogger('Adyen', 'adyen').warn('Notification for not existing order {0} received.', customObj.custom.orderId);
    }
    return result;
  }
  var isAdyen = false;
  var orderCreateDate = order.creationDate;
  var orderCreateDateDelay = createDelayOrderDate(orderCreateDate);
  var currentDate = new Date();
  var reasonCode = 'reason' in customObj.custom && !empty(customObj.custom.reason) ? customObj.custom.reason.toUpperCase() : null;
  Logger.getLogger('Adyen', 'adyen').debug('Order date {0} , orderCreateDateDelay {1} , currentDate {2}', orderCreateDate, orderCreateDateDelay, currentDate);
  if (orderCreateDateDelay < currentDate) {
    var isConfirmationStatusNotUpdate = !!Site.current.getCustomPreferenceValue('isConfirmationStatusNotUpdate');
    switch (customObj.custom.eventCode) {
      case 'AUTHORISATION':
        var paymentInstruments = order.getPaymentInstruments();
        var adyenPaymentInstrument = null;
        var paymentMethods = [];
        // Move adyen log request to order payment transaction
        for (var pi in paymentInstruments) {
          if ([constants.METHOD_ADYEN, constants.METHOD_ADYEN_POS, constants.METHOD_ADYEN_COMPONENT, constants.METHOD_APPLE_PAY].indexOf(paymentInstruments[pi].paymentMethod) !== -1 || PaymentMgr.getPaymentMethod(paymentInstruments[pi].getPaymentMethod()).getPaymentProcessor().ID === 'ADYEN_CREDIT') {
            isAdyen = true;
            paymentInstruments[pi].paymentTransaction.custom.Adyen_log = customObj.custom.Adyen_log;
            adyenPaymentInstrument = paymentInstruments[pi];
          }
          paymentMethods.push(paymentInstruments[pi].paymentMethod);
        }
        if (!adyenPaymentInstrument) {
          Logger.getLogger('Adyen', 'adyen').info('Cannot get Adyen Payment Instrument for order {0}. Payment methods in order: {1}', orderId, paymentMethods.toString());
        }

        // Special case for ApplePay and potentially some other
        // When Adyen_paymentMethod was not set before we do it here
        if (!order.custom.Adyen_paymentMethod) {
          Transaction.wrap(function () {
            order.custom.Adyen_paymentMethod = customObj.custom.paymentMethod;
          });
        }

        if (customObj.custom.success === 'true') {
          var amountPaid = parseFloat(order.custom.Adyen_value) || 0 + parseFloat(customObj.custom.value);
          var totalAmount = adyenPaymentInstrument ? adyenHelper.getCurrencyValueForApi(adyenPaymentInstrument.getPaymentTransaction().getAmount()).value : null;
          if (order.status.value === Order.ORDER_STATUS_FAILED || order.status.value === Order.ORDER_STATUS_CREATED) {
            // This fix is added due to PFAL-1233. Sometimes we recieve status code as not ok, that time order will not get placed but the later Adyen will send Authorization notification so if the order is in created state then we are placing the order and sending the confirmation email. 
            if (order.status.value === Order.ORDER_STATUS_FAILED) {
              try {
                Transaction.wrap(function () {
                      OrderMgr.undoFailOrder(order);
                  });
              } catch (e) {
                Logger.getLogger('Adyen', 'adyen').error("Replacement order not found/can't be created for failed order " + order.orderNo);
                processFailedNotification(order, customObj.custom, "REVIVE_FAILED", "Adyen Payment Notification for Failed Order: " + order.orderNo, customObj);
                  // mark the custom object for removal
                  setProcessedCOInfo(customObj);
                return result;
              }
            }
            // if order still in failed state then remove the CO and send email
            if (order.status.value === Order.ORDER_STATUS_FAILED) {
              processFailedNotification(order, customObj.custom, "REVIVE_FAILED", "Adyen Payment Notification for Failed Order: " + order.orderNo, customObj);
              // mark the custom object for removal
              setProcessedCOInfo(customObj);
              return result;
            }

            if (order.status.value === Order.ORDER_STATUS_CREATED) {
              var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
              if (!('fraudCheckProvider' in Site.current.preferences.custom) || Site.current.getCustomPreferenceValue('fraudCheckProvider').value !== 'Accertify' || !order.custom.onHold) {
                var fraudDetectionStatus = {
                  status: 'success'
                }; // Places the order
                var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus, order.getCurrencyCode());
                if (placeOrderResult.error) {
                  OrderMgr.failOrder(order, true);
                  result.status = PIPELET_ERROR;
                  return result;
                }
              }

              var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT).length > 0 ? order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT) : order.getPaymentInstruments();
              if (paymentInstrument && paymentInstrument.length > 0) {
                paymentInstrument[0].paymentTransaction.transactionID = customObj.custom.pspReference;
              }

              if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                Transaction.wrap(function () {
                  if (!('orderConfirmationEmailStatus' in order.custom) ||
                  ('orderConfirmationEmailStatus' in order.custom &&
                  order.custom.orderConfirmationEmailStatus &&
                  order.custom.orderConfirmationEmailStatus.value &&
                  order.custom.orderConfirmationEmailStatus.value !== 'PROCESSED')) {
                      order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                    }
                });
              } else {
                COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
              }
            }

            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            if (!isConfirmationStatusNotUpdate) {
              order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            }
            Logger.getLogger('Adyen', 'adyen').info('Order {0} updated to status PAID.', order.orderNo);
            result.SubmitOrder = true;
          } else if (order.paymentStatus.value === Order.PAYMENT_STATUS_PAID) {
            Logger.getLogger('Adyen', 'adyen').info('Duplicate callback received for order {0}.', order.orderNo);
          } else if (totalAmount && amountPaid < totalAmount) {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
            Logger.getLogger('Adyen', 'adyen').info('Partial amount {0} received for order number {1} with total amount {2}', customObj.custom.value, order.orderNo, totalAmount);
          } else if ((order.status.value === Order.ORDER_STATUS_OPEN || order.status.value === Order.ORDER_STATUS_NEW) && order.paymentStatus.value === Order.PAYMENT_STATUS_NOTPAID) {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            Logger.getLogger('Adyen', 'adyen').info('Order {0} updated to status PAID.', order.orderNo);
            result.SubmitOrder = true;
          }
          order.custom.Adyen_value = amountPaid.toString();
        } else {
          Logger.getLogger('Adyen', 'adyen').info('Authorization for order {0} was not successful - no update.', order.orderNo);
          // Determine if payment was refused and was used Adyen payment method
          if (!empty(reasonCode) && (reasonCode === 'REFUSED' || reasonCode.indexOf('FAILED') > -1) && isAdyen) {
            refusedHpp = true;
          } else if (order.status.value === Order.ORDER_STATUS_FAILED) {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
            order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
          }
          setProcessedCOInfo(customObj);
          return result;
        }
        break;
      case 'CANCELLATION':
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.trackOrderChange('CANCELLATION notification received');
        Logger.getLogger('Adyen', 'adyen').info('Order {0} was cancelled.', order.orderNo);
        break;
      case 'CANCEL_OR_REFUND':
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.trackOrderChange('CANCEL_OR_REFUND notification received');
        Logger.getLogger('Adyen', 'adyen').info('Order {0} was cancelled or refunded.', order.orderNo);
        break;
      case 'REFUND':
        var ReturnsUtils = require('app_ua_emea/cartridge/scripts/orders/ReturnsUtils');
        var returnsUtils = new ReturnsUtils();
        var Resource = require("dw/web/Resource");
        var Money = require("dw/value/Money");
        var Return = require("dw/order/Return");
        if (customObj.custom.success === 'true') {
          if (order.status.value !== Order.ORDER_STATUS_FAILED) {
            var orderRefundNumber = getOrderReference(customObj.custom.merchantReference).returnRef;
            var toJson = returnsUtils.parseJsonSafely(order.custom.refundsJson) || [];
            var currency = customObj.custom.currency;
            var reason = customObj.custom.reason;
            var amount = customObj.custom.value;
            var multiplier = parseInt(Resource.msg('amount.multiplier.' + currency.toLowerCase(), 'config', '100'), 10);
            var fixedNumber = parseInt(Resource.msg('amount.fixednumber.' + currency.toLowerCase(), 'config', '2'), 10);
            var actualAmount = new Number(amount / multiplier).toFixed(fixedNumber);

            if (orderRefundNumber > 0) {
              var refund = toJson[orderRefundNumber - 1];
              if (!empty(refund)) {
                var parsedLineItems = returnsUtils.getRefundLineItems(refund);
                var returnToBeRefunded = returnsUtils.getReturnToBeRefunded(order, parsedLineItems);
                if (!empty(returnToBeRefunded) && returnToBeRefunded.status != Return.STATUS_COMPLETED) {
                  returnsUtils.processReturnToBeRefunded(order, returnToBeRefunded, true, new Money(actualAmount.toString(), currency.toString()));

                  //set returnNumber in refund
                  try {
                    toJson[orderRefundNumber - 1].returnNumber = returnToBeRefunded.getReturnNumber();
                    order.custom.refundsJson = JSON.stringify(toJson);
                    // if we get XML because of stockout then refund includes all PLI from the order
                    // thus it must be the only one object in refunds array and shippingJson is empty
                    if (returnsUtils.isFullOrderRefund(order, toJson[0]) && empty(order.custom.shippingJson)) {
                      order.setOrderStatus(Order.ORDER_STATUS_CANCELLED);
                      Logger.getLogger("Adyen").info("AdyenNotify.js: Order " + order.orderNo + " was cancelled due to stockout");
                    }
                  } catch (e) {
                    processFailedNotification(order, customObj.custom, "REFUND_SKIPPED", "Can not update refund with returnNumber. OrderNo: " + order.orderNo + ", returnNo: " + returnToBeRefunded.getReturnNumber() + ", refundNo: " + orderRefundNumber - 1 + ". Error: " + e, customObj);
                  }
                } else if(empty(returnToBeRefunded) && order.status !== Order.ORDER_STATUS_CANCELLED) {
                  try {
                    if (returnsUtils.isFullOrderRefund(order, refund) && empty(order.custom.shippingJson)) {
                      order.setOrderStatus(Order.ORDER_STATUS_CANCELLED);
                      Logger.getLogger("Adyen").info("AdyenNotify.js: Order " + order.orderNo + " was cancelled due to stockout");
                    }
                  } catch (e) {
                    Logger.getLogger("Adyen").error("AdyenNotify.js: Error: Order " + order.orderNo + "cannot be canceled: " + e.message);
                  }
                } else if (returnsUtils.isRefundHasIgnoreSku(refund)) {
                } else {
                  processFailedNotification(order, customObj.custom, "REFUND_SKIPPED", "Error: Can't find or create return for order: '" + order.getOrderNo() + "'", customObj);
                }
                Logger.getLogger("Adyen").info("Order " + order.orderNo + " was refunded.");

                if (!empty(currency)) {
                  order.custom.Adyen_refundCurrency = currency;
                }

                if (!empty(reason)) {
                  order.custom.Adyen_refundReason = reason;
                }
                order.custom.Adyen_refundAmount = actualAmount.toString();
                order.custom.Adyen_refundStatus = "Success";
              }
            }
          }
        } else {
          processFailedNotification(order, customObj.custom, "REFUND_FAILED", "Order Refund Processing Failed; Order No: " + order.orderNo, customObj);
          returnsUtils.SetRefundsCountInfo(true, true, order);
        }
        break;
      // CustomAdyen
      case 'CAPTURE_FAILED':
        if (customObj.custom.success === 'true') {
          order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
          order.trackOrderChange('Capture failed, cancelling order');
          OrderMgr.cancelOrder(order);
        }
        Logger.getLogger('Adyen', 'adyen').info('Capture Failed for order {0}', order.orderNo);
        break;
      case 'ORDER_OPENED':
        if (customObj.custom.success === 'true') {
          Logger.getLogger('Adyen', 'adyen').info('Order {0} opened for partial payments', order.orderNo);
        }
        break;
      case 'ORDER_CLOSED':
        if (customObj.custom.success === 'true') {
          order.setExportStatus(Order.EXPORT_STATUS_READY);
          Logger.getLogger('Adyen', 'adyen').info('Order {0} closed', order.orderNo);
        }
        break;
      case 'OFFER_CLOSED':
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.trackOrderChange('Offer closed, failing order');
        Transaction.wrap(function () {
          OrderMgr.failOrder(order, false);
        });
        Logger.getLogger('Adyen', 'adyen').info('Offer closed for order {0} and updated to status NOT PAID.', order.orderNo);
        break;
      case 'PENDING':
        pending = true;
        Logger.getLogger('Adyen', 'adyen').info('Order {0} was in pending status.', order.orderNo);
        if (HookMgr.hasHook('app.payment.cashOrdersExpirationDate')) {
          HookMgr.callHook('app.payment.cashOrdersExpirationDate', 'handleExpirationDate', order, customObj.custom.paymentMethod);
        }
        break;
      case 'CAPTURE':
        if (customObj.custom.success === 'true' && order.status.value === Order.ORDER_STATUS_CANCELLED) {
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
          order.setExportStatus(Order.EXPORT_STATUS_READY);
          if (!isConfirmationStatusNotUpdate) {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
          }
          OrderMgr.undoCancelOrder(order);
          Logger.getLogger('Adyen', 'adyen').info('Undo failed capture, Order {0} updated to status PAID.', order.orderNo);
        }
        break;
      default:
        Logger.getLogger('Adyen', 'adyen').info('Order {0} received unhandled status {1}', order.orderNo, customObj.custom.eventCode);
    }

    // If payment was refused and was used Adyen payment method, the fields
    // are changed when user is redirected back from Adyen HPP
    if (!refusedHpp) {
      // Add received information to order

      /*
        PSP Reference must be persistent.
        Some modification requests (Capture, Cancel) send identificators of the operations,
        we mustn't overwrite the original value by the new ones
      */
      if (empty(order.custom.Adyen_pspReference) && !empty(customObj.custom.pspReference)) {
        order.custom.Adyen_pspReference = customObj.custom.pspReference;
      }
      order.custom.Adyen_eventCode = customObj.custom.eventCode;

      // Add a note with all details
      order.addNote('Adyen Payment Notification', createLogMessage(customObj));
    }
    setProcessedCOInfo(customObj);
  } else {
    Logger.getLogger('Adyen', 'adyen').debug('Order date > current Date.');
    result.SkipOrder = true;
    result.status = PIPELET_NEXT;
    return result;
  }
  result.status = PIPELET_NEXT;
  result.RefusedHpp = refusedHpp;
  result.Pending = pending;
  return result;
}
function setProcessedCOInfo(customObj) {
  var now = new Date();
  customObj.custom.processedDate = now;
  customObj.custom.updateStatus = 'SUCCESS';
  customObj.custom.processedStatus = 'SUCCESS';
}

function getOrderReference(merchantReference) {
  var ref = merchantReference.split('-');
  return {
      "orderNo": merchantReference.split('-', 2).join('-'),
      "returnRef": merchantReference.split('-').slice(2)[0]
  };
}

function processFailedNotification(order, notifyData, notificationType, subject, orderNotify) {
  if (HookMgr.hasHook('app.payment.provider.adyen_component')) {
      Logger.getLogger("Adyen").error("AdyenNotify.js: " + subject);
      HookMgr.callHook('app.payment.provider.adyen_component', 'SendRefundNotifyMail', order, notifyData, notificationType, subject);
  }
}

function createLogMessage(customObj) {
  var VERSION = customObj.custom.version;
  var msg = '';
  msg = "AdyenNotification v ".concat(VERSION, " - Payment info (Called from : ").concat(customObj.custom.httpRemoteAddress, ")");
  msg += '\n================================================================\n';
  // msg = msg + "\nSessionID : " + args.CurrentSession.sessionID;
  msg = "".concat(msg, "reason : ").concat(customObj.custom.reason);
  msg = "".concat(msg, "\neventDate : ").concat(customObj.custom.eventDate);
  msg = "".concat(msg, "\nmerchantReference : ").concat(customObj.custom.merchantReference);
  msg = "".concat(msg, "\ncurrency : ").concat(customObj.custom.currency);
  msg = "".concat(msg, "\npspReference : ").concat(customObj.custom.pspReference);
  msg = "".concat(msg, "\nmerchantAccountCode : ").concat(customObj.custom.merchantAccountCode);
  msg = "".concat(msg, "\neventCode : ").concat(customObj.custom.eventCode);
  msg = "".concat(msg, "\nvalue : ").concat(customObj.custom.value);
  msg = "".concat(msg, "\noperations : ").concat(customObj.custom.operations);
  msg = "".concat(msg, "\nsuccess : ").concat(customObj.custom.success);
  msg = "".concat(msg, "\npaymentMethod : ").concat(customObj.custom.paymentMethod);
  msg = "".concat(msg, "\nlive : ").concat(customObj.custom.live);
  return msg;
}
function createDelayOrderDate(orderCreateDate) {
  // AdyenNotificationDelayMinutes
  var adyenDelayMin = 1;

  // Variable in milliseconds
  var newDate = new Date();
  newDate.setTime(orderCreateDate.getTime() + adyenDelayMin * 60 * 1000);
  return newDate;
}
module.exports = {
  execute: execute,
  handle: handle
};