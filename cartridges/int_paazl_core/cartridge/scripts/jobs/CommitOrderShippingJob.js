var Logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var commitOrderTrackingService = require('~/cartridge/scripts/services/SOAP/commitOrderTracking');
var overallSuccess = true;
var Order = require('dw/order/Order');

/**
 * Callback to process the actual orders
 *
 * @param {dw.order.Order} order DW Order
 * @returns {void}
 * @private
 */
function orderCallback(order) {
    try {
        Logger.info('Started Order Tracking Commit for {0}', order.orderNo);
        var output = commitOrderTrackingService.commit({ order: order });
        if (!output || !output.success) {
            overallSuccess = false;
            Logger.fatal('Order {0} tracking not committed successfully into paazl system because of error {1}', order.orderNo, output.errorMessage || '');
        }
    } catch (e) {
        overallSuccess = false;
        Logger.fatal('Order {0} tracking not committed successfully into paazl system because of error {1}', order.orderNo, e);
    }
}

/**
 * Starts the Order Shipment Commit into paazl for all the order which are not
 * yet committed i.e have order custom attribute "notSavedPaazlShipping" set as TRUE
 *
 * @param {dw.List.HashMap} args job parameters
 * @returns {dw.system.Status} - The Status
 */
function process(args) {
    if (args.disabled) {
        return new Status(Status.OK, 'DISABLED');
    }
    var Site = require('dw/system/Site');
    var maxShipmentAttempts = Site.getCurrent().getCustomPreferenceValue('paazlCommitShipmentMaxAttempts');
    // Pulling the orders Shipment for processing if they are not SavedPaazlShipping and exported to MAO
    var query = 'exportStatus = 1 ' + 
        'AND custom.notSavedPaazlShipping = true ' +
        'AND custom.notSavedInPaazl = false ' +
        'AND shippingStatus = 2 ' +
        'AND custom.failedShipmentAttempts < ' + maxShipmentAttempts;
    OrderMgr.processOrders(orderCallback, query);
    if (!overallSuccess) {
        return new Status(Status.ERROR, 'ERROR');
    }
    return new Status(Status.OK, 'OK');
}

/* Exported methods */
module.exports = {
    process : process
};