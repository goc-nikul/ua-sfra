'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var logger = require('dw/system/Logger').getLogger('AtomeService');
var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');
var atomeConfigs = require('~/cartridge/scripts/service/atomeConfigurations');
var atomeApis = require('~/cartridge/scripts/service/atomeApis');
var AtomeCheckoutSessionModel = require('*/cartridge/scripts/atome/helpers/checkoutSessionHelper');


/**
 * Callback URL while paying through Atome
 */
server.post('PaymentCallbackUrl', server.middleware.https, function (req, res, next) {
    var reqBody = JSON.parse(req.body);
    var referenceId = reqBody.referenceId;
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var atomeHelper = require('~/cartridge/scripts/atome/helpers/atomeHelpers');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Site = require('dw/system/Site');


    logger.info('PaymentCallbackUrl Request: referenceId : {0}', referenceId);

    if ((OrderMgr.getOrder(referenceId) !== null)) {
        var order = OrderMgr.getOrder(referenceId);

        var atomeOrder = atomeApis.getPaymentInformation(referenceId);

        // an exception was thrown and will skip the rest of the controller
        // adding a try/catch here to catch the exception and log it
        try {
            Transaction.wrap(function () {
                order.addNote('atomeOrder', atomeOrder.object);
            });
        } catch (ex) {
            logger.error('PaymentCallbackUrl handler exception when trying to addNote to order');
        }

        atomeOrder = JSON.parse(atomeOrder.object);

        if (atomeOrder.status === 'PAID' && order.status.value === Order.ORDER_STATUS_CREATED) {
            // Handles payment authorization
            var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
            if (handlePaymentResult.error) {
                logger.error('Callback-Success: Error In SFCC Handle Payment Result');
                // log the order details for dataDog.
                if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                }
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }

            var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
            if (fraudDetectionStatus.status === 'fail') {
                logger.error('Callback-Apporve: Error In fraud Detection Status');
                Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                // fraud detection failed
                req.session.privacyCache.set('fraudDetectionStatus', true);
                // log the order details for dataDog.
                if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                }
                res.json({
                    error: true,
                    cartError: true,
                    redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }

            // Places the order
            var placeOrder = COHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrder.error) {
                logger.error('Error In SFCC Place Order');
                // log the order details for dataDog.
                if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                }
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }

            // Save Order Transaction details
            atomeHelper.saveOrderTransactionDetails(order, referenceId, atomeOrder.status, atomeOrder.refundableAmount, atomeOrder.currency);

            // Payment status update
            Transaction.wrap(function () {
                order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            });

            if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
                Transaction.wrap(function () {
                    order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
                });
            }

            logger.error('Order has been succeeded : {0}', atomeOrder.status);

            res.setStatusCode(200);
            res.json({ success: true });
        } else {
            // Handles payment authorization
            var handleIPNPayemnt = COHelpers.handlePayments(order, order.orderNo);
            if (handleIPNPayemnt.error) {
                logger.error('Callback-Declined: Error In SFCC Handle Payment Result');
                // log the order details for dataDog.
                if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                    orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
                }
                res.json({
                    error: true,
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                });
                return next();
            }

            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });

            // Save Order Transaction details
            atomeHelper.saveOrderTransactionDetails(order, referenceId, atomeOrder.status, atomeOrder.refundableAmount, atomeOrder.atomeCurrency);

            logger.error('Order has been declined : {0}', atomeOrder.status);

            // log the order details for dataDog.
            if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, 'Order has been declined'));
            }

            res.setStatusCode(400);
            res.json({ success: false });
        }
    }
    return next();
});


/**
 * Result URL after Atome payment
 */
server.get('PaymentResultUrl', server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Site = require('dw/system/Site');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var orderId = req.querystring.orderID
    var orderToken = req.querystring.orderToken
    var order = OrderMgr.getOrder(orderId, orderToken);

    logger.info('PaymentCallbackUrl Request: Order number : {0} Order status : {1}', order.currentOrderNo, order.status.value);

    if (order.status.value === Order.ORDER_STATUS_NEW) {
        req.session.raw.custom.orderID = null;
        AtomeCheckoutSessionModel.removeAtomeOrder();
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
        }
        // log the order details for dataDog.
        if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
        }
        if (Site.getCurrent().getCustomPreferenceValue('atome_SFRA6_Compatibility')) {
            res.render('orderConfirmForm', {
                orderID: orderId,
                orderToken: order.orderToken
            });
        } else {
            res.redirect(URLUtils.https('Order-Confirm', 'ID', orderId, 'token', order.orderToken, 'error', false).toString());
        }
    } else {
        logger.info('PaymentResultUrl redirecting back to Checkout-Begin');
        res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment').toString());
    }

    return next();
});

/**
 * Return from Atome with Cancel Payment
 */
server.get('PaymentCancelUrl', server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var orderId = req.querystring.orderID;
    var order = OrderMgr.getOrder(orderId);
    var Site = require('dw/system/Site');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    if (order.status.value === Order.ORDER_STATUS_CREATED) {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        // log the order details for dataDog.
        if (Site.getCurrent().getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, false));
        }
    }

    res.redirect(URLUtils.https('Checkout-Begin', 'stage', 'payment').toString());
    next();
});

/**
 * Cancel Order in Atome
 * referenceId is required to Cancel the Order
 */
server.get('CancelPayment', server.middleware.https, function (req, res, next) {
    if (atomeConfigs.isAtomeEnabled) {
        var OrderMgr = require('dw/order/OrderMgr');
        var orderID = req.querystring.orderID;
        var order = OrderMgr.getOrder(orderID);
        var cancelOrder = atomeApis.cancelPayment(orderID);

        if (cancelOrder && cancelOrder.status === 'OK') {
            var cancelOrderResult = JSON.parse(cancelOrder.object);
            if (cancelOrderResult.status === 'CANCELLED') {
                Transaction.wrap(function () {
                    OrderMgr.cancelOrder(order);
                });
            }
            res.json({
                error: false,
                message: Resource.msg('atome.cancel.success.msg', 'atome', null)
            });
        } else if (cancelOrder && cancelOrder.error) {
            var errorMessage = JSON.parse(cancelOrder.errorMessage);
            res.json({
                error: true,
                message: errorMessage.message
            });
        }
    }
    next();
});


/**
 * Refund Order from Atome
 * referenceId and refundAmount are required to Initiate Refund Order
 */
server.get('RefundPayment', server.middleware.https, function (req, res, next) {
    if (atomeConfigs.isAtomeEnabled) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Order = require('dw/order/Order');
        var orderID = req.querystring.orderID;
        var refundAmount = req.querystring.refundAmount;
        var order = OrderMgr.getOrder(orderID);

        var refundOrder = atomeApis.refundPayment(refundAmount, orderID, order);
        if (refundOrder && refundOrder.status === 'OK') {
            var refundOrderObj = JSON.parse(refundOrder.object);
            if (refundOrderObj.status === 'REFUNDED' && refundOrderObj.refundableAmount == 0) {
                Transaction.wrap(function () {
                    order.setOrderStatus(Order.ORDER_STATUS_CANCELLED);
                });
            }
            res.json({
                error: false,
                status: refundOrderObj.status,
                amount: refundOrderObj.amount,
                currency: refundOrderObj.currency,
                referenceId: refundOrderObj.referenceId,
                refundableAmount: refundOrderObj.refundableAmount,
                message: Resource.msg('atome.refund.success.msg', 'atome', null)
            });
        } else if (refundOrder && refundOrder.error) {
            var errorMessage = JSON.parse(refundOrder.errorMessage);
            res.json({
                error: true,
                message: errorMessage.message
            });
        }
    }
    next();
});

/**
 * Get Atome Payment Information
 * referenceId required to get Order Status
 */
server.get('GetPaymentInformation', server.middleware.https, function (req, res, next) {
    if (atomeConfigs.isAtomeEnabled) {
        var orderID = req.querystring.orderID;
        var result = atomeApis.getPaymentInformation(orderID);
        // Update order Status
        if (result.status === 'OK') {
            var resultObj = JSON.parse(result.object);
            res.json({
                error: false,
                status: resultObj.status,
                amount: resultObj.amount,
                currency: resultObj.currency,
                referenceId: resultObj.referenceId,
                refundableAmount: resultObj.refundableAmount
            });
        } else {
            res.json({
                error: true,
                message: Resource.msg('atome.get.order.status.error.msg', 'atome', null)
            });
        }
    }
    next();
});

module.exports = server.exports();

