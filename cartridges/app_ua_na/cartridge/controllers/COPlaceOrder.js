'use strict';

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.prepend('Submit', csrfProtection.generateToken, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var URLUtils = require('dw/web/URLUtils');
    var Logger = require('dw/system/Logger');

    var order = OrderMgr.getOrder(req.querystring.order_id);
    // Added condition to redirect on refresh of Order Confirmation Page.
    if (order && order.status.value !== Order.ORDER_STATUS_CREATED) {
        Logger.error('COPlaceOrder.js: Order Confirmation page refreshed, redirected to homepage. Order Number - {0}, Order Status - {1}', order.orderNo, order.status.displayValue);
        res.redirect(URLUtils.url('Home-Show'));
    }
    return next();
});

module.exports = server.exports();
