/* eslint-disable no-unused-vars */
'use strict';

/**
 * Initialize refund process
 * @param {string} referenceNo order Number
 * @param {number} amount order amount
 * @param {string} currency currency code
 * @param {string} returnReference return references
 * @param {Object} order DW Order object
 * @param {string} reason return reason
 * @param {Object} newReturn DW return object
 * @returns {Object} returns status code
 */
function refund(referenceNo, amount, currency, returnReference, order, reason, newReturn) {
    var atomeApis = require('*/cartridge/scripts/service/atomeApis');
    var atomeConfigs = require('*/cartridge/scripts/service/atomeConfigurations');
    var Resource = require('dw/web/Resource');
    var result;
    if (atomeConfigs.isAtomeEnabled) {
        var Transaction = require('dw/system/Transaction');
        var OrderMgr = require('dw/order/OrderMgr');
        var Order = require('dw/order/Order');
        var orderID = order.orderNo;
        var refundAmount = amount;
        var refundOrder = atomeApis.refundPayment(refundAmount, orderID, order);
        if (refundOrder && refundOrder.status === 'OK') {
            var refundOrderObj = JSON.parse(refundOrder.object);
            if (refundOrderObj.status === 'REFUNDED' && refundOrderObj.refundableAmount == 0) {
                Transaction.wrap(function () {
                    order.setOrderStatus(Order.ORDER_STATUS_CANCELLED);
                });
            }
            result = {
                error: false,
                status: refundOrderObj.status,
                amount: refundOrderObj.amount,
                currency: refundOrderObj.currency,
                referenceId: refundOrderObj.referenceId,
                refundableAmount: refundOrderObj.refundableAmount,
                message: Resource.msg('atome.refund.success.msg', 'atome', null)
            };
            var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
            var returnsUtils = new ReturnsUtils();
            var Money = require('dw/value/Money');
            returnsUtils.processReturnToBeRefunded(order, newReturn, true, new Money(amount, currency));
            returnsUtils.SetRefundsCountInfo(false, null, order);
        } else if (refundOrder && refundOrder.error) {
            var errorMessage = JSON.parse(refundOrder.errorMessage);
            result = {
                error: true,
                message: errorMessage.message
            };
            returnsUtils.SetRefundsCountInfo(true, null, order);
        }
    }
    return {
        statusCode: ! result.error ? 200 : 500 // eslint-disable-line
    };
}
module.exports = {
    Refund: refund
};
