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
    if (!amount || !currency || !order || !order.orderNo || !reason || !newReturn) return { statusCode: 500 };
    var refundStatus = require('*/cartridge/scripts/zip/helpers/orderProcess').Refund(order.orderNo, amount, reason).success; // eslint-disable-line
    if (refundStatus) {
        var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
        var returnsUtils = new ReturnsUtils();
        var Money = require('dw/value/Money');
        returnsUtils.processReturnToBeRefunded(order, newReturn, true, new Money(amount, currency));
    }
    return {
        statusCode: refundStatus ? 200 : 500 // eslint-disable-line
    };
}

/**
 * Get zippay customer payment wallet info
 * @param {Object} paymentInstrument payment instrument model
 * @returns {Object} returns payment instrument data
 */
function getCustomerPaymentInstruments(paymentInstrument) {
    var rawPaymentInstrument = paymentInstrument.raw;
    return {
        hasZipToken: (!empty(rawPaymentInstrument.custom.ZipToken)),
        paymentMethod: rawPaymentInstrument.paymentMethod,
        UUID: paymentInstrument.UUID
    };
}

module.exports = {
    Refund: refund,
    getCustomerPaymentInstruments: getCustomerPaymentInstruments
};
