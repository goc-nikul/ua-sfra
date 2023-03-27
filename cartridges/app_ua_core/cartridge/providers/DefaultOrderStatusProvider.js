'use strict';

/* API includes */
var Order = require('dw/order/Order');

/* Script modules */
var AbstractOrderStatusProvider = require('./AbstractOrderStatusProvider');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var DefaultOrderStatusProvider = AbstractOrderStatusProvider.extend({
    handleReadyForExport: function () {
        var paymentStatus = this.order.getPaymentStatus();
        var orderStatus = this.order.getStatus();

        if ((orderStatus.value === Order.ORDER_STATUS_OPEN || orderStatus.value === Order.ORDER_STATUS_NEW) && paymentStatus.value === Order.PAYMENT_STATUS_PAID) {
            COHelpers.setExportedStatus(this.order);
        }
    }
});

module.exports = DefaultOrderStatusProvider;
