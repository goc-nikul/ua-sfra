'use strict';
module.exports.execute = function (jobParameters) {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Calendar = require('dw/util/Calendar');
    var Transaction = require('dw/system/Transaction');
    var atomeApis = require('*/cartridge/scripts/service/atomeApis');
    var StringUtils = require('dw/util/StringUtils');
    try {
        var Site = require('dw/system/Site');
        var currentSite = Site.getCurrent();
        var forceOrderCancellation = jobParameters.forceOrderCancellation ?  jobParameters.forceOrderCancellation : false ;
        var atomeOrderTimeout = currentSite.getCustomPreferenceValue('atomeOrderTimeout');
        var startDateValue = new Date(Date.now() - (new Number(atomeOrderTimeout))  * 60  * 1000);
        var value = new (require('dw/util/Calendar'))(startDateValue);
        value.setTimeZone(require('dw/system/Site').getCurrent().getTimezone());
        var orders;
        if (forceOrderCancellation) {
            orders = OrderMgr.searchOrders('status = {0} AND paymentStatus != {1} AND custom.isAtomePayment = true', 'creationDate desc', Order.ORDER_STATUS_CREATED, Order.PAYMENT_STATUS_PAID);
        } else {
            orders = OrderMgr.searchOrders('status = {0} AND paymentStatus != {1} AND custom.isAtomePayment = true AND creationDate < {2}', 'creationDate desc', Order.ORDER_STATUS_CREATED, Order.PAYMENT_STATUS_PAID, startDateValue);

        }
        if (orders.count > 0) {
            while (orders.hasNext()) {
                var order = orders.next();
                var orderNo = order.getOrderNo();
                var atomeOrder = atomeApis.getPaymentInformation(orderNo);
                if ((atomeOrder.status !== 'PAID' || atomeOrder.status !== 'PROCESSING') && order.status.value === Order.ORDER_STATUS_CREATED) {
                    var cancelOrder = atomeApis.cancelPayment(orderNo);
                    if (cancelOrder && cancelOrder.status === 'OK') {
                        var cancelOrderResult = JSON.parse(cancelOrder.object);
                        if (cancelOrderResult.status === 'CANCELLED') {
                            Transaction.wrap(function () {
                                OrderMgr.failOrder(order, true);
                            });
                        }
                    } else if (cancelOrder && cancelOrder.error) {
                        Logger.error('Error in AtomeOrderCancel.js :: {0}', 'Cancel Not Success for order NO' + orderNo, cancelOrder.errorMessage);
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('Error in AtomeOrderCancel.js :: {0}', e.message);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
};
