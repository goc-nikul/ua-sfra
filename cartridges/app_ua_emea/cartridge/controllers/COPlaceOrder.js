'use strict';

var server = require('server');

server.extend(module.superModule);

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderModel = require('*/cartridge/models/order');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');

server.replace('Submit', csrfProtection.generateToken, function (req, res, next) {
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
        // eslint-disable-next-line no-undef
        order.custom.customerLocale = request.locale;
        // eslint-disable-next-line no-undef
        order.custom.customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
    });
    // delete  deviceID cookies
    cookieHelper.deleteCookie('deviceID');
    // Set isEmployeeOrder boolean attribute for Employee Orders
    require('*/cartridge/scripts/util/SetOrderStatus').setEmployeeOrder(order);

    // Set MAO Order Type
    require('*/cartridge/scripts/util/SetOrderStatus').setOrderType(order);

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

    // Change ordr confirmation status to not confirmed, export status to not exported and payment status to not paid, so that adyen notification job will update the order after consuming the notification object
    if (order) {
        Transaction.wrap(() => {
            order.setConfirmationStatus(require('dw/order/Order').CONFIRMATION_STATUS_NOTCONFIRMED);
            order.setExportStatus(require('dw/order/Order').EXPORT_STATUS_NOTEXPORTED);
            order.setPaymentStatus(require('dw/order/Order').PAYMENT_STATUS_NOTPAID);
        });
    }

    // Update order status to ready for export
    require('*/cartridge/modules/providers').get('OrderStatus', order).handleReadyForExport();
    //	TODO : Time being displaying the out of the box order confirmation page.
    var config = {
        numberOfLineItems: '*'
    };
    var viewData = res.getViewData();
    viewData.pageContext = {
        ns: 'order.confirmation'
    };
    var orderModel = new OrderModel(order, { config: config });
    if (!req.currentCustomer.profile) {
        var passwordForm = server.forms.getForm('newPasswords');
        var profileForm = server.forms.getForm('profile');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            orderUUID: order.getUUID(),
            returningCustomer: false,
            passwordForm: passwordForm,
            profileForm: profileForm,
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
