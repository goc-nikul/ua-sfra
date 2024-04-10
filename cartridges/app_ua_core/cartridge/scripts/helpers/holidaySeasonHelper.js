'use strict';

var Logger = require('dw/system/Logger');

/**
 * Function to return Returns Configuration JSON
 *
 * @return {Object} - Return Configuration
 */
function getReturnConfiguration() {
    var Site = require('dw/system/Site');
    var returnConfiguration = null;
    try {
        if (Site.current.getCustomPreferenceValue('returnsConfiguration')) {
            var returnConfigurationJSON = Site.current.getCustomPreferenceValue('returnsConfiguration');
            returnConfiguration = JSON.parse(returnConfigurationJSON);
        }
    } catch (e) {
        Logger.error('holidaySeasonHelper.js - Error in returnsConfiguration custom preference JSON format : ' + e.message);
    }
    return returnConfiguration;
}

/**
 * Function to set holidaySeason order level custom attribute
 *
 * @param {dw.order.Order} order - Order Object
 */
function setHolidaySeason(order) {
    var Calendar = require('dw/util/Calendar');
    var Transaction = require('dw/system/Transaction');
    var returnConfiguration = getReturnConfiguration();
    var currentSite = require('dw/system/Site').getCurrent();
    if (order && returnConfiguration) {
        try {
            var holidaySeasonStart = returnConfiguration.holidayStart ? returnConfiguration.holidayStart.split('-') : null;
            var holidaySeasonEnd = returnConfiguration.holidayEnd ? returnConfiguration.holidayEnd.split('-') : null;
            var holidaySeason = false;
            var currentDate = currentSite.getCalendar();

            if (holidaySeasonStart && holidaySeasonEnd && holidaySeasonStart.length > 1 && holidaySeasonEnd.length > 1 && !isNaN(holidaySeasonStart[0]) && !isNaN(holidaySeasonStart[1]) && !isNaN(holidaySeasonEnd[0]) && !isNaN(holidaySeasonEnd[1]) && holidaySeasonStart[0] < 13 && holidaySeasonEnd[0] < 13 && holidaySeasonStart[1] < 32 && holidaySeasonEnd[1] < 32) {
                var holidayStartDate = new Calendar(new Date(currentDate.getTime().getTime() + currentSite.timezoneOffset));
                if ((parseInt(holidaySeasonEnd[0], 10) < parseInt(holidaySeasonStart[0], 10)) && (holidayStartDate.get(Calendar.MONTH) + 1) <= parseInt(holidaySeasonEnd[0], 10)) {
                    holidayStartDate.set(holidayStartDate.get(Calendar.YEAR) - 1, holidaySeasonStart[0] - 1, parseInt(holidaySeasonStart[1], 10));
                } else {
                    holidayStartDate.set(holidayStartDate.get(Calendar.YEAR), holidaySeasonStart[0] - 1, parseInt(holidaySeasonStart[1], 10));
                }
                var holidayEndDate = new Calendar(new Date(currentDate.getTime().getTime() + currentSite.timezoneOffset));
                if ((parseInt(holidaySeasonEnd[0], 10) < parseInt(holidaySeasonStart[0], 10)) && (holidayEndDate.get(Calendar.MONTH) + 1) >= parseInt(holidaySeasonStart[0], 10)) {
                    holidayEndDate.set(holidayEndDate.get(Calendar.YEAR) + 1, holidaySeasonEnd[0] - 1, parseInt(holidaySeasonEnd[1], 10));
                } else {
                    holidayEndDate.set(holidayEndDate.get(Calendar.YEAR), holidaySeasonEnd[0] - 1, parseInt(holidaySeasonEnd[1], 10));
                }

                var todayDate = new Calendar(new Date(currentDate.getTime().getTime() + currentSite.timezoneOffset));
                if (todayDate.time >= holidayStartDate.time && todayDate.time <= holidayEndDate.time) {
                    holidaySeason = true;
                }
            }

            Transaction.wrap(function () {
                order.custom.holidaySeason = holidaySeason; // eslint-disable-line no-param-reassign
            });
        } catch (e) {
            Logger.error('holidaySeasonHelper.js - Error in setting order level attribute : ' + e.message);
        }
    }
}

/**
 * Function returns Return Period of an order based on holiday season consideration.
 *
 * @param {string} orderNo - Order Number
 * @return {number} - Return Period
 */
function getReturnPeriod(orderNo) {
    var returnConfiguration = getReturnConfiguration();
    var returnPeriod = 60;
    if (returnConfiguration) {
        try {
            var OrderMgr = require('dw/order/OrderMgr');
            var order = OrderMgr.getOrder(orderNo);
            if (order && order.custom.holidaySeason && order.custom.holidaySeason === true && returnConfiguration.holidayReturnPeriod && !isNaN(returnConfiguration.holidayReturnPeriod)) {
                returnPeriod = returnConfiguration.holidayReturnPeriod;
            } else if (returnConfiguration.nonHolidayReturnPeriod && !isNaN(returnConfiguration.nonHolidayReturnPeriod)) {
                returnPeriod = returnConfiguration.nonHolidayReturnPeriod;
            }
        } catch (e) {
            Logger.error('holidaySeasonHelper.js - Error returning return period : ' + e.message);
        }
    }
    return returnPeriod;
}

module.exports = {
    setHolidaySeason: setHolidaySeason,
    getReturnPeriod: getReturnPeriod
};
