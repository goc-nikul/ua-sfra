'use strict';

var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var Calendar = require('dw/util/Calendar');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var HookMgr = require('dw/system/HookMgr');

exports.execute = function (params) {
    try {
        var startDate = params.startDate;
        var delay = params.delayInHours;
        var endDate = params.endDate;
        if (empty(endDate)) {
            endDate = new Calendar();
            endDate.add(Calendar.HOUR_OF_DAY, (0 - delay));
            endDate = endDate.getTime();
        }
        var queryString = '(status = {0} OR paymentStatus = {1}) AND custom.Loyalty-VoucherCancelled = {2} AND creationDate >= {3} AND creationDate < {4}';

        OrderMgr.processOrders(function (order) {
            // Ignoring COD orders
            if (order.getPaymentInstruments('COD').length === 0 && !empty(order.custom['Loyalty-VoucherName'])) {
                var loyaltyVoucherName = order.custom['Loyalty-VoucherName'].split('=')[1];
                if (HookMgr.hasHook('app.memberson.UnUtilizeMemberVoucher')) {
                    HookMgr.callHook('app.memberson.UnUtilizeMemberVoucher', 'unUtilizeMemberVoucher', order, loyaltyVoucherName);
                }
                Transaction.wrap(function () {
                    var notificationCustomObject = CustomObjectMgr.getCustomObject('membersonVoucherCancellation', order.orderNo);
                    if (empty(notificationCustomObject)) {
                        notificationCustomObject = CustomObjectMgr.createCustomObject('membersonVoucherCancellation', order.orderNo);
                    }
                    var loyaltyCoupon = order.custom['Loyalty-VoucherName'].split('=')[0];
                    notificationCustomObject.custom.voucherCode = loyaltyCoupon;
                    notificationCustomObject.custom.voucherCancellationStatus = order.custom['Loyalty-VoucherCancelled'].value;
                });
            }
        },
            queryString,
            Order.ORDER_STATUS_FAILED,
            Order.PAYMENT_STATUS_NOTPAID,
            0,
            startDate,
            endDate
        );
    } catch (e) {
        Logger.error('Memberson - Could not cancel voucher ' + e.message + e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
};
