'use strict';

/* API Includes */
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
/* Script includes */
var PaymetricHelper = require('int_paymetric/cartridge/scripts/util/PaymetricHelper');
var COHelpers = require('app_ua_core/cartridge/scripts/checkout/checkoutHelpers');


/**
 * Tokens exchange job
 * @returns {Status} Job status
 */
function execute() {
    var ordersIterator = OrderMgr.searchOrders('status = {0} AND custom.onHold = {1} AND paymentStatus = {2}', null, Order.ORDER_STATUS_CREATED, true, Order.PAYMENT_STATUS_NOTPAID);

    while (ordersIterator.hasNext()) {
        var order = ordersIterator.next();
        var paymentIterator = order.getPaymentInstruments('Paymetric').iterator();
        var paymentInstrument = paymentIterator.hasNext() ? paymentIterator.next() : null;

        if (paymentInstrument) {
            var intToken = paymentInstrument.custom.internalToken;
            var extToken = PaymetricHelper.exchangeInternalToken(intToken);
            var tokenStatus = Site.getCurrent().getCustomPreferenceValue('ExchangeTokenAPIStatus');
            var today = new Date();
            var orderDate = new Date(order.creationDate);
            var diffTime = Math.abs(orderDate - today);
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (extToken && !(tokenStatus.includes(extToken))) {
                PaymetricHelper.updateOrderToken(order, extToken);

                var customer = order.getCustomer();

                if (customer.registered && customer.profile) {
                    PaymetricHelper.updateCustomerToken(customer.profile, extToken, intToken);
                }

                COHelpers.handleHoldStatus(order, false, 'paymentDetailsUpdate');

                var fraudDetectionStatus = require('*/cartridge/modules/providers').get('FraudScreen', order).validate();

                if (fraudDetectionStatus === 'accept') {
                    // Fraud check approved
                    COHelpers.placeOrder(order);
                    COHelpers.handleHoldStatus(order, false, 'fraudCheck');
                } else if (fraudDetectionStatus === 'review') {
                    // Fraud check hold
                    COHelpers.handleHoldStatus(order, true, 'fraudCheck');
                } else if (fraudDetectionStatus === 'reject') {
                    // Fraud check fail
                    COHelpers.failOrder(order);
                    COHelpers.handleHoldStatus(order, false, 'fraudCheck');

                    COHelpers.sendFraudNotificationEmail(order);
                }
            } else if (diffDays > 7 && extToken === 'ERROR') {
                // Payment fail
                COHelpers.failOrder(order);
                COHelpers.handleHoldStatus(order, false, 'paymentFail');
            } else if (!(tokenStatus.includes(extToken))) {
                // Payment fail
                COHelpers.failOrder(order);
                COHelpers.handleHoldStatus(order, false, 'paymentFail');
            }
        }
    }

    return new Status(Status.OK);
}

module.exports.execute = execute;
