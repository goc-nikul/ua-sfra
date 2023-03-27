'use strict';
/* API includes */
var Order = require('dw/order/Order');
/* Script modules */
var AbstractOrderStatusProvider = require('./AbstractOrderStatusProvider');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
/**
 * Checks if Paymetric payment instrument exposes internal token
 * @param {dw.order.Order} order Order API instance
 * @returns {boolean} internal token exposed
 */
function isPaymetricInternalToken(order) {
    var collections = require('*/cartridge/scripts/util/collections');
    var paymentInstruments = order.getPaymentInstruments('Paymetric');
    var paymentInstrumentFound = collections.find(paymentInstruments, function (paymentInstrument) {
        return !empty(paymentInstrument.custom.internalToken)
            ? paymentInstrument.custom.internalToken.indexOf('INT') === 0
            : false;
    });

    return !empty(paymentInstrumentFound);
}
var DefaultOrderStatusProvider = AbstractOrderStatusProvider.extend({
    handleReadyForExport: function () {
        var orderStatus = this.order.getStatus().value;
        if (!isPaymetricInternalToken(this.order) && (orderStatus === Order.ORDER_STATUS_OPEN || orderStatus === Order.ORDER_STATUS_NEW || orderStatus === Order.ORDER_STATUS_CREATED)) {
            COHelpers.setExportedStatus(this.order);
        }
    }
});

module.exports = DefaultOrderStatusProvider;
