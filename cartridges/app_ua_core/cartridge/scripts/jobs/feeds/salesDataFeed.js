'use strict';

/**
 * @module feeds/salesDataFeed
 */

/**
 * @type {dw.order.OrderMgr}
 */
const OrderMgr = require('dw/order/OrderMgr');

/**
 * @type {module:models/analyticsDataExport~Export}
 */
const Export = require('../models/analyticsDataExport');

/**
 * @type {module:models/analyticsDataExport~Export}
 */
var exportModel;

/**
 * @type {dw.util.StringUtils}
 */
var StringUtils = require('dw/util/StringUtils');

/**
 * @type {dw.util.Calendar}
 */
var Calendar = require('dw/util/Calendar');

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
    var skip = order.status.value === order.ORDER_STATUS_FAILED || order.status.value === order.ORDER_STATUS_CREATED;
    if (!skip) {
        exportModel.buildRows(order);
    }
}

/**
 * @param {dw.List.HashMap} parameters job parameters
 * @param {dw.system.Site} site current site
 * @returns {Date} input date
 */
function initInputDate(parameters, site) {
    var inputDate;
    if (parameters.date && parameters.endDate) {
        inputDate = new Date(parameters.date);
    } else {
        inputDate = new Date();
        inputDate.setTime(inputDate.valueOf() + site.timezoneOffset);
        inputDate.setHours(0);
        inputDate.setMinutes(0);
        inputDate.setSeconds(0);
    }
    inputDate.setTime(inputDate.valueOf() - site.timezoneOffset);
    return inputDate;
}

/**
 * @param {dw.List.HashMap} parameters job parameters
 * @returns {dw.system.Status} the status
 */
function process(parameters) {
    exportModel = new Export(parameters);
    exportModel.archiveFiles();
    exportModel.writeHeader();

    var site = require('dw/system/Site').current;
    var inputDate = initInputDate(parameters, site);
    var inputCalendarDate = new Calendar(inputDate);
    var startDate = StringUtils.formatCalendar(inputCalendarDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
    var endDate;

    if (parameters.date && parameters.endDate) {
        var inputEndDate = new Date(parameters.endDate);
        inputEndDate.setTime(inputEndDate.valueOf() - site.timezoneOffset);
        var inputCalendarEndDate = new Calendar(inputEndDate);
        inputCalendarEndDate.add(inputCalendarEndDate.HOUR, 24);
        endDate = StringUtils.formatCalendar(inputCalendarEndDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
    } else {
        inputCalendarDate.add(inputCalendarDate.HOUR, 24);
        endDate = StringUtils.formatCalendar(inputCalendarDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
    }

    OrderMgr.processOrders(orderCallback, 'creationDate >= {0} AND creationDate <= {1}', startDate, endDate);

    exportModel.close();

    return new Status(Status.OK, 'OK');
}

module.exports = {
    process: process
};
