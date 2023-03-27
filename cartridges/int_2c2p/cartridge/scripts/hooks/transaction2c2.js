'use strict';

/**
 * Verify transaction
 * @param {string} orderNo verify transaction with current order
 */
function verifyTransaction(orderNo) {
    var logger = require('*/cartridge/scripts/logs/2c2p');
    try {
        var service2c2pHelper = require('*/cartridge/scripts/helpers/serviceHelper');
        if (!service2c2pHelper.getTransactionInquiry(orderNo)) throw new Error('Order Number: ' + orderNo + ' not succedded please verify service logs');
    } catch (e) {
        logger.writelog(logger.LOG_TYPE.ERROR, e.message + '\n' + e.stack);
    }
}

module.exports = {
    verifyTransaction: verifyTransaction
};
