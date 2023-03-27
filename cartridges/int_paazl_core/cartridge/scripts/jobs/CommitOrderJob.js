var Logger = require('dw/system/Logger').getLogger('paazlAPI', 'paazl');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var commitOrderService = require('~/cartridge/scripts/services/REST/commitOrder');
var overallSuccess = true;
var Order = require('dw/order/Order');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require("dw/util/Calendar");
var paazlHelper = require('~/cartridge/scripts/helpers/paazlHelper');

/**
 * Callback to process the actual orders
 *
 * @param {dw.order.Order} order DW Order
 * @returns {void}
 * @private
 */
function orderCallback(order) {
    try {
        Logger.info('Started Order Commit for {0}', order.orderNo);
        var output = commitOrderService.commit({ order: order });
        if (!output || !output.success) {
            overallSuccess = false;
            Logger.fatal('Order {0} not committed successfully into paazl system because of error {1}', order.orderNo, output.errorMessage || '');
        }
    } catch (e) {
        overallSuccess = false;
        Logger.fatal('Order {0} not committed successfully into paazl system because of error {1}', order.orderNo, e);
    }
}

/**
 * Starts the Order Commit into paazl for all the order which are not
 * yet committed i.e have order custom attribute "notSavedInPaazl" set as TRUE
 *
 * @param {dw.List.HashMap} args job parameters
 * @returns {dw.system.Status} - The Status
 */
function process(args) {
    if (args.disabled) {
        return new Status(Status.OK, 'DISABLED');
    }
    var Site = require('dw/system/Site');
    var maxAttempts = Site.getCurrent().getCustomPreferenceValue('paazlCommitOrderMaxAttempts');
    // Pulling the orders for processing if they are not savedToPaazl and exported to MAO
    var query = 'exportStatus = 1 ' + 
        'AND custom.notSavedInPaazl = true ' +
        'AND custom.failedAttempts < ' + maxAttempts;
    OrderMgr.processOrders(orderCallback, query);
    if (!overallSuccess) {
        return new Status(Status.ERROR, 'ERROR');
    }
    trackShipment(args);
    return new Status(Status.OK, 'OK');
}


function getTrackShipmentQuery(exportDays) {
	var orderStartDate = new Date(),
	days = exportDays || 30;//by default export for last 30 days 

	orderStartDate.setDate(orderStartDate.getDate() - days);
	
	var queryParams = [
		Order.SHIPPING_STATUS_SHIPPED, 
	    StringUtils.formatCalendar(new Calendar(orderStartDate), "yyyy-MM-dd'T'HH:mm:ss'+Z'")
	];
	
	var queryString = 'shippingStatus = {0} ' +
		"AND (custom.notSavedInPaazl = false) " + 
		"AND (custom.isTrackedToPaazl = NULL or custom.isTrackedToPaazl = false) " +
		"AND creationDate > {1}";
	
	return StringUtils.format(queryString, queryParams);
}

function trackShipment(args) {
    try {
        var queryString = getTrackShipmentQuery(args.exportDays);
	
        OrderMgr.processOrders(function(order) {
            var shippings = paazlHelper.getShipmentInfo(order);
    
            shippings.forEach(function (shipping) {
                if (!shipping.sentToPaazl) {
                    paazlHelper.updateShippingJson(order, shippings, shipping.trackingCode);
                }
            });
        }, queryString, null);
	} catch (e) {
		var errorMsg = e.message;
		Logger.error('error in CommitOrderJob~trackShipment - errorMsg: {0}', errorMsg);
	}
}

/* Exported methods */
module.exports = {
    process : process
};
