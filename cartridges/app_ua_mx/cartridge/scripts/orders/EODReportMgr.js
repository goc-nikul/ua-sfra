'use strict';

var JSONUtils = require('int_customfeeds/cartridge/scripts/util/JSONUtils');
var Transaction = require('dw/system/Transaction');
var EODCustomObjectType = 'EODOrderReportData';
var queue = 'queue';
var StringUtils = require('dw/util/StringUtils');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var SeekableIterator = require('dw/util/SeekableIterator');
const Logger = require('dw/system/Logger').getLogger('ImportOrderShipment');
var Calendar = require('dw/util/Calendar');

var MAX_ARRAY_SIZE = 10000;

/** ****** private functions of EODReportMgr.ds **********/

/**
 * Get formated date
 * @param {Object} day - day of the month
 * @return {Object} - returns formated date
 */
function getDayKeyValue(day) {	// do not change format "MM-dd-yyyy" because it will break Custom object management (CRU)
    return !empty(day) ? StringUtils.formatCalendar(day, 'MM-dd-yyyy') : '';
}

/**
 * Returns the custom objectID based on the date
 * @param {Object} day - day of the month
 * @return {Object} - returns custom objectID
 */
function getCustomObjectID(day) {	// calculate object id for specified day
    // return format "YYYY-MM", YYYY - the date year, NN - the number of month (a value between 0 and 11)
    return !empty(day) ? StringUtils.formatCalendar(day, 'yyyy-MM') : '';
}

/**
 * Finds the day date
 * @param {Object} day - day of the month
 * @return {Object} - returns day key value
 */
function findDayData(day) {
    let objectID = getCustomObjectID(day);
    let co = CustomObjectMgr.getCustomObject(EODCustomObjectType, objectID);

    return !empty(co) && !empty(co.custom.data) ? JSONUtils.getValue(co.custom.data, getDayKeyValue(day)) : {};
}

/**
 * Finds the order date
 * @param {dw.order.Order} order - day of the month
 * @return {string} - returns the order number
 */
function getOrderDataForEOD(order) {
    return order.getOrderNo();
}

/**
 * generates simple report data
 * @param {Object} report - day of the month
 * @return {Object} data - returns the report data
 */
function getSimpleReportData(report) {
    var data = {
        count: report.count,
        orders: []
    };
    var order;

    while (report.orders.hasNext()) {
        order = report.orders.next();
        data.orders.push(order.getOrderNo());
    }

    if (report.orders instanceof SeekableIterator) {
        report.orders.close();
    }

    return data;
}

/**
 * generates multiple report data
 * @param {Object} report - day of the month
 * @return {Object} data - returns the report data
 */
function getMultipleReportData(report) {
    var data = {
        count: report.count,
        orders: []
    };
    var i = 0;
    var order;

    while (report.orders.hasNext()) {
        if (i === 0) {
            data.orders.push([]);
        } else if (i >= MAX_ARRAY_SIZE) {
            i = 0;
            // eslint-disable-next-line no-continue
            continue;
        }

        order = report.orders.next();
        data.orders[data.orders.length - 1].push(order.getOrderNo());
        i++;
    }

    if (report.orders instanceof SeekableIterator) {
        report.orders.close();
    }

    return data;
}

module.exports = {
    getDayData: function (day) {
        var dayData = findDayData(day);
        return !empty(dayData) ? dayData : {};
    },

    getCustomObjectForEdit: function (day, incDec) {
        let co;
        let objectID;
        try {
            objectID = incDec || getCustomObjectID(day);
            co = CustomObjectMgr.getCustomObject(EODCustomObjectType, objectID);
        } catch (e) {
            Logger.debug('EODReportMgr.ds: Can not find custom object with id {0}, type of custom object {1}. Error: {2}.', objectID, EODCustomObjectType, e);
        }

        if (empty(co)) {
            try {
                Transaction.wrap(function () {
                    co = CustomObjectMgr.createCustomObject(EODCustomObjectType, objectID);
                });
            } catch (e) {
                Logger.error('EODReportMgr.ds: Can not create custom object with id {0}, type of custom object {1}. Error: {2}.', objectID, EODCustomObjectType, e);
                return {};
            }
        }

        return co;
    },

    getReportValue: function (day, reportType) {
        var dayData = findDayData(day);
        return !empty(dayData) ? dayData[reportType] : {};
    },

    setReportValue: function (day, reportType, value, incDec) {
        if (empty(day) || empty(reportType) || empty(value)) {
            Logger.error('EODReportMgr.ds: Some of arguments were not defined for function \'setReportValue()\'. This function requires all arguments to be defined.');
            return false;
        }

        var isIncDec = function () {
            return (incDec) ? queue + value.order + (+new Date()) : false;
        };

        var co = this.getCustomObjectForEdit(day, isIncDec());

        if (empty(co) || !co.custom) {
            return false;
        }

        let coData = JSONUtils.parse(co.custom.data, {});
        let dayKeyVal = getDayKeyValue(day);

        if (!(dayKeyVal in coData)) {
            coData[dayKeyVal] = {};
        }

        if (value.orders && value.orders instanceof SeekableIterator) {
            coData[dayKeyVal][reportType] = value.count < MAX_ARRAY_SIZE
                                                        ? getSimpleReportData(value)
                                                        : getMultipleReportData(value);
        } else if (value.order) {
            coData[dayKeyVal][reportType] = value;
        } else {
            Logger.error('EODReportMgr.ds: value is invalid for setReportValue');
            return false;
        }

        try {
            Transaction.wrap(function () {
                co.custom.data = JSON.stringify(coData);
            });
        } catch (e) {
            Logger.error('EODReportMgr.ds: JSON stringify custom object failed. Error:', e);
            return false;
        }
        return true;
    },

    incrementReportValue: function (reportType, day, order) {
        if (empty(day) && !empty(order)) {
            // eslint-disable-next-line no-param-reassign
            day = !empty(order.replacedOrder) ? new Calendar(order.replacedOrder.getCreationDate()) : new Calendar(order.getCreationDate());
        }

        if (empty(day) || empty(reportType)) {
            Logger.error('EODReportMgr.ds: Some of arguments were not defined for function \'incrementReportValue()\'. This function requires 2 arguments to be defined: \'day\' and \'reportType\'');
            return false;
        }
        var reportValue = this.getReportValue(day, reportType);
        reportValue = { count: 1 };

        if (!empty(order)) {
            var orderData = getOrderDataForEOD(order);
            reportValue.order = orderData;
        }

        if (this.setReportValue(day, reportType, reportValue, true)) {
            return true;
        }
        return false;
    },

    decrementReportValue: function (reportType, day, order) {
        if (empty(day) && !empty(order)) {
            // eslint-disable-next-line no-param-reassign
            day = !empty(order.replacedOrder) ? new Calendar(order.replacedOrder.getCreationDate()) : new Calendar(order.getCreationDate());
        }

        if (empty(day) || empty(reportType)) {
            Logger.error('EODReportMgr.ds: Some of arguments were not defined for function \'incrementReportValue()\'. This function requires 2 arguments to be defined: \'day\' and \'reportType\'');
            return false;
        }
        var reportValue = this.getReportValue(day, reportType);
        reportValue = { count: -1 };

        if (!empty(order)) {
            var orderData = getOrderDataForEOD(order);
            reportValue.order = orderData;
        }

        if (this.setReportValue(day, reportType, reportValue, true)) {
            return true;
        }
        return false;
    },

    getQueueObjects: function (EODCustomObj, queryString, sortString) {
        var limitedArrayLength = 11000;
        // eslint-disable-next-line no-param-reassign
        sortString = sortString || '';
        // eslint-disable-next-line no-param-reassign
        queryString = queryString || '';
        return CustomObjectMgr.queryCustomObjects(EODCustomObj, queryString, sortString).asList(0, limitedArrayLength).toArray();
    }
};
