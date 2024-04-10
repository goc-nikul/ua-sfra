/**
 * @type {dw.util.StringUtils}
 */
var StringUtils = require('dw/util/StringUtils');

/**
 * @type {module:models/orderReconciliationDataExport~Export}
 */
const Export = require('../models/orderReconciliationDataExport');

/**
 * @type {module:models/orderReconciliationDataExport~Export}
 */
var exportModel;

/**
 * @type {dw.util.Calendar}
 */
var Calendar = require('dw/util/Calendar');

/**
 * @type {dw.order.OrderMgr}
 */
const OrderMgr = require('dw/order/OrderMgr');

/**
 * @type {dw.system.Status}
 */
var Status = require('dw/system/Status');

/**
 * Callback to process the actual orders
 *
 * @param {dw.order.Order} order DW Order
 * @returns {void}
 * @private
 */
function orderCallback(order) {
    var skip =
        order.status.value === order.ORDER_STATUS_FAILED ||
        order.status.value === order.ORDER_STATUS_CREATED ||
        order.exportStatus.getValue() !== order.EXPORT_STATUS_EXPORTED;
    if (!skip) {
        exportModel.initRow(order);
        exportModel.buildRow(order);
    }
}

/**
 * @param {dw.List.HashMap} parameters job parameters
 * @returns {dw.system.Status} the status
 */
function process(parameters) {
    var lastXdays = parameters.lastXdays ? parameters.lastXdays : 1;

    var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
    var timezoneHelper = new TimezoneHelper();
    var dateTime = timezoneHelper.getCurrentSiteTime();
    dateTime.setHours(0);
    dateTime.setMinutes(0);
    dateTime.setSeconds(0);
    var utcDateTime = timezoneHelper.convertSiteTimeToUTC(dateTime);

    var currentCalendar = new Calendar(utcDateTime);

    var endDate = StringUtils.formatCalendar(
        currentCalendar,
        "yyyy-MM-dd'T'HH:mm:ss"
    );

    currentCalendar.add(Calendar.DAY_OF_MONTH, -1 * lastXdays);
    var startDate = StringUtils.formatCalendar(
        currentCalendar,
        "yyyy-MM-dd'T'HH:mm:ss"
    );

    exportModel = new Export(parameters);
    exportModel.writeHeader();

    OrderMgr.processOrders(
        orderCallback,
        'creationDate >= {0} AND creationDate <= {1}',
        startDate,
        endDate
    );

    exportModel.close();

    return new Status(Status.OK, 'OK');
}

module.exports = {
    process: process
};
