'use strict';
var superMdl = module.superModule;

/* global dw */

var KlarnaPaymentsProcessor = require('*/cartridge/scripts/payments/processor');

/**
 * Authorize entry point for SG integration
 * @param {Object} orderNumber order numebr
 * @param {Object} paymentInstrument payment intrument
 * @param {Object} paymentProcessor payment processor
 * @param {string} scope - The order scope - OCAPI
 * @returns {Object} processor result
 */
superMdl.Authorize = function (orderNumber, paymentInstrument, paymentProcessor, scope) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    var result = KlarnaPaymentsProcessor.authorize(order, orderNumber, paymentInstrument, scope);
    return result;
};

module.exports = superMdl;
