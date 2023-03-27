'use strict';

var server = require('server');

server.extend(module.superModule);
var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');

/**
 * Result URL after Atome payment
 */
server.prepend('PaymentResultUrl', server.middleware.https, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');

    var orderId = req.querystring.orderID;
    var orderToken = req.querystring.orderToken;
    var order = OrderMgr.getOrder(orderId, orderToken);

    if (order.status.value !== Order.ORDER_STATUS_NEW) {
        try {
            if (Object.prototype.hasOwnProperty.call(order.custom, 'Loyalty-VoucherName') && !empty(order.custom['Loyalty-VoucherName'])) {
                var loyaltyVoucherName = order.custom['Loyalty-VoucherName'].split('=')[1];
                if (HookMgr.hasHook('app.memberson.UnUtilizeMemberVoucher')) {
                    HookMgr.callHook('app.memberson.UnUtilizeMemberVoucher', 'unUtilizeMemberVoucher', order, loyaltyVoucherName);
                }
            }
        } catch (e) {
            Logger.error('Unable to unutlize Loyalty voucher ' + e.message + e.stack);
        }
    }
    return next();
});


/**
 * Return from Atome with Cancel Payment
 */
server.prepend('PaymentCancelUrl', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var orderId = req.querystring.orderID;
    var order = OrderMgr.getOrder(orderId);
    if (order.status.value === Order.ORDER_STATUS_CREATED) {
        try {
            if (Object.prototype.hasOwnProperty.call(order.custom, 'Loyalty-VoucherName') && !empty(order.custom['Loyalty-VoucherName'])) {
                var loyaltyVoucherName = order.custom['Loyalty-VoucherName'].split('=')[1];
                if (HookMgr.hasHook('app.memberson.UnUtilizeMemberVoucher')) {
                    HookMgr.callHook('app.memberson.UnUtilizeMemberVoucher', 'unUtilizeMemberVoucher', order, loyaltyVoucherName);
                }
            }
        } catch (e) {
            Logger.error('Unable to unutlize Loyalty voucher ' + e.message + e.stack);
        }
    }
    next();
});

module.exports = server.exports();

