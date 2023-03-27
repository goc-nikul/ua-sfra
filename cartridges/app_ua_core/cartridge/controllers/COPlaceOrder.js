'use strict';

/* eslint-disable no-undef */

var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderModel = require('*/cartridge/models/order');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
var orderInfoLogger = require('dw/system/Logger').getLogger('orderInfo', 'orderInfo');

server.post('Submit', csrfProtection.generateToken, function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);
    var token = req.querystring.order_token ? req.querystring.order_token : null;
    var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();

    if (!order || !token || token !== order.orderToken || order.customer.ID !== req.currentCustomer.raw.ID) {
        Logger.error('COPlaceOrder.js: Error while rendering the order confirmation page: Token - {0}, orderToken - {1}, orderCustomerNumber - {2}, currentCustomerNumber - {3}, OrderNumber - {4}', token, order.orderToken, order.customer.ID, req.currentCustomer.raw.ID, order.orderNo);
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }

    // Added condition to redirect on refresh of Order Confirmation Page.
    if (order.status.value !== Order.ORDER_STATUS_CREATED) {
        Logger.error('COPlaceOrder.js: Order Confirmation page refreshed, redirected to homepage. Order Number - {0}, Order Status - {1}', order.orderNo, order.status.displayValue);
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }

    Transaction.wrap(function () {
        order.custom.customerLocale = request.locale;
        // eslint-disable-next-line no-undef
        order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
        order.custom.accertifyInAuthTransactionID = !empty(cookieHelper.read('deviceID')) ? cookieHelper.read('deviceID') : '';
    });
    // delete  deviceID cookies
    cookieHelper.deleteCookie('deviceID');
    // Set isEmployeeOrder boolean attribute for Employee Orders
    require('*/cartridge/scripts/util/SetOrderStatus').setEmployeeOrder(order);

    // Set MAO Order Type
    require('*/cartridge/scripts/util/SetOrderStatus').setOrderType(order);

    // Fraud Protection Check
    var fraudDetectionStatus = require('*/cartridge/modules/providers').get('FraudScreen', order).validate();
    if (fraudDetectionStatus === 'accept') {
        // Fraud check approved
        var placeOrderResult = checkoutHelper.placeOrder(order);
        if (placeOrderResult.error) {
            // log the order details for dataDog.
            if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
                orderInfoLogger.info(checkoutHelper.getOrderDataForDatadog(order, false));
            }
            return next(new Error('Could not place order'));
        }
        if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
            Transaction.wrap(function () {
                order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
            });
        } else {
            checkoutHelper.sendConfirmationEmail(order, req.locale.id);
        }
        //	Since authorization passes setting payment status as paid
        Transaction.wrap(function () {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        });
    } else if (fraudDetectionStatus === 'review' || fraudDetectionStatus === 'SERVER_UNAVAILABLE') {
        // Fraud check hold
        session.custom.currentOrder = null;
        if (Site.getCurrent().getCustomPreferenceValue('isSetOrderConfirmationEmailStatusForJob')) {
            Transaction.wrap(function () {
                order.custom.orderConfirmationEmailStatus = 'READY_FOR_PROCESSING'; // eslint-disable-line no-undef
            });
        } else {
            checkoutHelper.sendConfirmationEmail(order, req.locale.id);
        }
    } else {
        // Fraud check fail
        checkoutHelper.failOrder(order);
        checkoutHelper.sendFraudNotificationEmail(order);
        // log the order details for dataDog.
        if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
            orderInfoLogger.info(checkoutHelper.getOrderDataForDatadog(order, false));
        }
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url(
                'Error-ErrorCode',
                'err',
                fraudDetectionStatus
            ).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next(new Error('Could not place order'));
    }
    // Update order status to ready for export
    var orderExportStatus = order.exportStatus.getValue();
    if (orderExportStatus !== Order.EXPORT_STATUS_EXPORTED && orderExportStatus !== Order.EXPORT_STATUS_FAILED && orderExportStatus !== Order.EXPORT_STATUS_READY) {
        require('*/cartridge/modules/providers').get('OrderStatus', order).handleReadyForExport();
    } else {
        orderInfoLogger.error('Order has already been set to ready for export: ' + checkoutHelper.getOrderDataForDatadog(order, false));
    }
    //	TODO : Time being displaying the out of the box order confirmation page.
    var config = {
        numberOfLineItems: '*'
    };
    // log the order details for dataDog.
    if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
        orderInfoLogger.info(checkoutHelper.getOrderDataForDatadog(order, false));
    }
    var orderModel = new OrderModel(order, { config: config });

    if (!req.currentCustomer.profile) {
        var passwordForm = server.forms.getForm('newPasswords');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: false,
            passwordForm: passwordForm,
            passwordRules: passwordRequirements
        });
    } else {
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: true
        });
    }
    return next();
});

module.exports = server.exports();
