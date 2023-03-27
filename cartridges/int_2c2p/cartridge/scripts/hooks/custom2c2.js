'use strict';

/**
 * Validate payment status
 * @returns {Object} returns payment status
 */
function validatePayment() {
    return {
        error: false
    };
}

/**
 * Handle payment
 * @param {Object} order DW order
 * @returns {Object} handles payment
 */
function handlePayments(order) {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    return hooksHelper('app.payment.processor.2c2payment', 'Authorize', [order], function () { return { error: true }; });
}

/**
 * Dynamically add offline status and for 2c2p it is true
 * @returns {boolean} returns refund is offline process or not
 */
function offlineRefund() {
    return true;
}

/**
 * Update order needed for 2c2p refund
 * @param {Object} order DW order
 */
function updateorder(order) {
    require('dw/system/Transaction').wrap(() => {
        order.custom.offlineRefund = true;// eslint-disable-line
    });
}

module.exports = {
    validatePayment: validatePayment,
    handlePayments: handlePayments,
    offlineRefund: offlineRefund,
    updateorder: updateorder
};
