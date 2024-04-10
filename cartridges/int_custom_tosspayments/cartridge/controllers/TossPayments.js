'use strict';

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('TossPayments');
var Resource = require('dw/web/Resource');

/* Script Modules */
var tossPaymentConstants = require('*/cartridge/scripts/helpers/tossPaymentConstants');
var tossPaymentHelpers = require('*/cartridge/scripts/helpers/tossPaymentHelpers');

server.get(
    'PaymentWindow',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var orderNo = req.querystring.orderNo;
        var order = OrderMgr.getOrder(orderNo);
        var Site = require('dw/system/Site');
        var tossPaymentsClientKey = Site.getCurrent().getCustomPreferenceValue('tossPaymentsClientKey');

        var currentCustomer = req.currentCustomer.raw;
        if (currentCustomer.authenticated && currentCustomer.profile && currentCustomer.profile.custom.isNaverUser) {
            Transaction.wrap(() => {
                order.custom.isOrderWithNaverSSO = true;
            });
        }

        var tossPaymentObject = {
            amount: order.getTotalGrossPrice().value,
            orderId: orderNo,
            orderName: order.getProductLineItems()[0].getProductName() || '',
            customerName: order.getCustomerName(),
            successUrl: URLUtils.https('TossPayments-ReturnFromToss').toString(),
            failUrl: URLUtils.https('TossPayments-ReturnFromTossFail').toString()
        };

        var skipAuth = Site.getCurrent().getCustomPreferenceValue('tossPaymentsSkipAuth').value;
        if (!'NO'.equals(skipAuth)) {
            tossPaymentObject._skipAuth = skipAuth; // eslint-disable-line no-underscore-dangle
        }

        // Check if ammount is 0, redirect customer to checkout with the error
        if (order.getTotalGrossPrice().value === 0) {
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('message.error.zero.amount', 'error', null)).toString());
        } else {
            res.render('checkout/triggerTossPayments', {
                clientKey: tossPaymentsClientKey,
                paymentType: tossPaymentConstants.PAYMENT_METHODS_SDK[order.custom.tossPaymentsType],
                paymentObject: JSON.stringify(tossPaymentObject),
                returnUrl: URLUtils.https('TossPayments-ReturnFromTossFail', 'orderId', orderNo, 'message', 'USER_CANCEL').toString()
            });
        }
        next();
    }
);

server.get(
    'ReturnFromToss',
    server.middleware.https,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        var orderNo = req.httpParameterMap.orderId.stringValue;
        var paymentKey = req.httpParameterMap.paymentKey.stringValue;
        var amount = req.httpParameterMap.amount.stringValue;
        var error = false;
        var order;
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var Site = require('dw/system/Site');
        var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');

        try {
            order = OrderMgr.getOrder(orderNo);
            if (order && parseFloat(amount) === order.getTotalGrossPrice().value) {
                Transaction.begin();
                order.custom.tossPaymentsKey = paymentKey;
                var tossPaymentService = require('*/cartridge/scripts/service/tossPaymentService').paymentService;
                // call Payment Approval API
                tossPaymentService.call({
                    orderId: orderNo,
                    amount: amount,
                    paymentKey: paymentKey
                });
                var httpClient = tossPaymentService.getClient();
                if (httpClient.statusCode === 200) {
                    var responseObject = JSON.parse(httpClient.getText());
                    tossPaymentHelpers.updateOrderJSON(order, httpClient.getText());
                    order.custom.tossPaymentsStatus = responseObject.status;
                    order.custom.tossPaymentsSecret = responseObject.secret;
                    tossPaymentHelpers.saveTransactionID(order, paymentKey);

                    var totalPayAmount = order.getTotalGrossPrice().value;
                    var Order = require('dw/order/Order');
                    if (order.status.value === Order.ORDER_STATUS_FAILED) {
                        // If order is already failed, cancel the payment and redirect customer to checkout with error message
                        tossPaymentHelpers.cancelPayment(order, totalPayAmount, totalPayAmount, '');
                        // log the order details for dataDog.
                        if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                        }
                        var errorMessage = Resource.msg('subheading.error.general', 'error', null);
                        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', errorMessage).toString());
                        return next();
                    }

                    if (tossPaymentConstants.PAYMENT_STATUS.DONE.equalsIgnoreCase(responseObject.status)) {
                        var placeOrderResult = COHelpers.placeOrder(order);
                        if (!placeOrderResult.error) {
                            tossPaymentHelpers.confirmOrder(order);
                        } else {
                            error = true;
                        }
                    }
                } else {
                    Logger.error('Toss Payments - Failed to place order - ' + httpClient.statusCode + httpClient.errorText);
                    error = true;
                }
                Transaction.commit();
            } else {
                Logger.error('Toss Payments - Failed to place order - amount mismatch');
                error = true;
            }
        } catch (e) {
            Logger.error('Toss Payments - Failed to place order ' + e.message + e.stack);
            error = true;
        }
        if (error) {
            Transaction.wrap(() => {
                OrderMgr.failOrder(order, true);
            });
            // log the order details for dataDog.
            if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
            }
            var message = Resource.msg('subheading.error.general', 'error', null);
            res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', message).toString());
        } else {
            // log the order details for dataDog.
            if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
            }
            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                Transaction.wrap(() => {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                });
            } else {
                COHelpers.sendConfirmationEmail(order, order.customerLocaleID);
            }
            if (Site.getCurrent().getCustomPreferenceValue('tossPayments_SFRA6_Compatibility')) {
                res.render('orderConfirmForm', {
                    orderID: orderNo,
                    orderToken: order.orderToken
                });
            } else {
                res.redirect(URLUtils.url('Order-Confirm', 'ID', orderNo, 'token', order.orderToken));
            }
        }
        return next();
    }
);

server.get(
    'ReturnFromTossFail',
    server.middleware.https,
    function (req, res, next) {
        var httpParameterMap = req.httpParameterMap;
        var orderId = httpParameterMap.orderId.stringValue;
        var message = httpParameterMap.message.stringValue;
        var URLUtils = require('dw/web/URLUtils');
        var order = OrderMgr.getOrder(orderId);
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var Site = require('dw/system/Site');
        var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');

        if (Resource.msg('toss.message.error.' + message.toLowerCase(), 'tosspayments', '') !== '') {
            message = Resource.msg('toss.message.error.' + message.toLowerCase(), 'tosspayments', '');
        }

        Transaction.wrap(() => {
            OrderMgr.failOrder(order, true);
        });
        // log the order details for dataDog.
        if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
        }
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment', 'paymentError', message).toString());
        next();
    }
);

server.post(
    'NotificationWebhook',
    server.middleware.https,
    function (req, res, next) {
        var Order = require('dw/order/Order');
        var requestBodyAsString = req.httpParameterMap.requestBodyAsString;

        try {
            var requestBody = JSON.parse(requestBodyAsString);
            var order = OrderMgr.getOrder(requestBody.data.orderId);
            if (order) {
                Transaction.wrap(function () {
                    if (requestBody.data.paymentKey.equals(order.custom.tossPaymentsKey)) {
                        order.addNote('Toss Payment Notification', requestBodyAsString);

                        tossPaymentHelpers.updateOrderJSON(order, requestBodyAsString);

                        if (tossPaymentConstants.PAYMENT_STATUS.CANCELED.equalsIgnoreCase(requestBody.data.status) && (order.status === Order.ORDER_STATUS_OPEN || order.status === Order.ORDER_STATUS_NEW || order.status === Order.ORDER_STATUS_COMPLETED)) {
                            order.setOrderStatus(Order.ORDER_STATUS_CANCELLED);
                        }
                    }
                });
                res.json({
                    success: true
                });
                return next();
            }
        } catch (e) {
            Logger.error('Toss Payments Notification failed ' + e.message + e.stack);
            Logger.error('Toss Payments Notification Body ' + requestBodyAsString);
            res.setStatusCode(500);
            res.json({
                error: true
            });
            return next();
        }
        res.setStatusCode(500);
        res.json({
            error: true
        });
        return next();
    }
);

module.exports = server.exports();
