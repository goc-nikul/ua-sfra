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
var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');

server.replace('Submit', csrfProtection.generateToken, function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);
    var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();

    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        return next(new Error('Order token does not match'));
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

        // Change order confirmation status to not confirmed, export status to not exported and payment status to not paid, so that Adyen notification job will update the order after consuming the notification object
        if (order) {
            Transaction.wrap(() => {
                order.setConfirmationStatus(require('dw/order/Order').CONFIRMATION_STATUS_NOTCONFIRMED);
                order.setExportStatus(require('dw/order/Order').EXPORT_STATUS_NOTEXPORTED);
                order.setPaymentStatus(require('dw/order/Order').PAYMENT_STATUS_NOTPAID);
            });
        }
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
    require('*/cartridge/modules/providers').get('OrderStatus', order).handleReadyForExport();
    //	TODO : Time being displaying the out of the box order confirmation page.
    var config = {
        numberOfLineItems: '*'
    };
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
