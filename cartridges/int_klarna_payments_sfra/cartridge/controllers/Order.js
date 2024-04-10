var page = module.superModule; // inherits functionality
var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

server.extend(page);

server.replace('Confirm', function (req, res, next) {
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var order;

    if (!req.form.orderToken || !req.form.orderID) {
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });

        return next();
    }

    order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);

    if (!order || order.customer.ID !== req.currentCustomer.raw.ID
    ) {
        res.setStatusCode(404);
        res.render('error/notFound');

        return next();
    }
    var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
    if (lastOrderID === req.form.orderID) {
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }

    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale = Locale.getLocale(req.locale.id);

    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );
    var passwordForm;

    var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);

    var viewData = res.getViewData();
    viewData.klarna = {
        currency: order.getCurrencyCode()
    };

    if (!req.currentCustomer.profile) {
        passwordForm = server.forms.getForm('newPasswords');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: false,
            passwordForm: passwordForm,
            reportingURLs: reportingURLs,
            orderUUID: order.getUUID()
        });
    } else {
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: true,
            reportingURLs: reportingURLs,
            orderUUID: order.getUUID()
        });
    }
    req.session.raw.custom.orderID = req.form.orderID; // eslint-disable-line no-param-reassign

    return next();
});

module.exports = server.exports();
