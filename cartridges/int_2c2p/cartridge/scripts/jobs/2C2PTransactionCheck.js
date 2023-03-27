'use strict';

/**
 * Process demandware order
 * @param {Object} order process demandware order
 */
function processFunction(order) {
    var HookMgr = require('dw/system/HookMgr');
    if (HookMgr.hasHook('app.payment.transaction.2c2')) HookMgr.callHook('app.payment.transaction.2c2', 'verifyTransaction', order.orderNo);
}

/**
 * Exceutes job step
 * @returns {Object} returns status of job
 */
function execute() {
    var Status = require('dw/system/Status');
    require('dw/order/OrderMgr').processOrders(processFunction, 'status = {0} AND custom.transactionCheck2C2P = {1}', require('dw/order/Order').ORDER_STATUS_CREATED, true);
    return new Status(Status.OK);
}

module.exports = {
    execute: execute
};
