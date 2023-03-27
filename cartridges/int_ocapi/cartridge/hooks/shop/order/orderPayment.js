'use strict';

/* eslint-disable no-unused-vars */

/* API Includes */
var Status = require('dw/system/Status');

/* Script modules */
var paymentHelper = require('~/cartridge/scripts/paymentHelper');

/**
 * Adds a payment instrument to an order.
 * @param {Order} order - Current order
 * @param {OrderPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @returns {Status} - Status
 */
exports.beforePOST = function (order, paymentInstrumentRequest) {
    var paymentUpdateStatus = paymentHelper.updatePaymentInstrument(paymentInstrumentRequest);

    return paymentUpdateStatus;
};

/**
 * Updates a payment instrument of an order.
 * @param {Order} order - Current order
 * @param {OrderPaymentInstrument} paymentInstrument - Order payment instrument
 * @param {OrderPaymentInstrumentRequest} paymentInstrumentRequest - Payment instrument request
 * @returns {Status} - Status
 */
exports.beforePATCH = function (order, paymentInstrument, paymentInstrumentRequest) {
    var paymentUpdateStatus = paymentHelper.updatePaymentInstrument(paymentInstrumentRequest);

    return paymentUpdateStatus;
};
