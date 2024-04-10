/*
 *
 *   This job script gets the 'reports' from eodCheck under custom Preference 'Storefront Configurations'
 *
 *   "MX reports" : [                        "EU & SEA reports" : [
 *        "NotExportedOrder",                    "NotExportedOrder",
 *        "NotConfirmedOrder",                   "NotConfirmedOrder",
 *        "NotShippedOrder",                     "NotShippedOrder",
 *        "NotPaidOrder",                    [
 *        "CancelledOrder"
 *     ]
 */

// API Includes
const Status = require('dw/system/Status');
const Calendar = require('dw/util/Calendar');
const Logger = require('dw/system/Logger');

// Scripts Includes
var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
var EODReportHelper = require('bm_underarmour/cartridge/scripts/reports/EODReportHelper');
var EODReportManager = require('*/cartridge/scripts/orders/EODReportMgr');
var timezoneHelper = new TimezoneHelper();

/**
 * execute function check orders Job
 * @return {void}
 */
function execute() {
    try {
        var eodReportsTypes = EODReportHelper.getSiteReportTypes(); // Getting reports from eodCheck
        var eodCheckLimit = EODReportHelper.getSiteReportDaysCount(); // Getting days from eodCheck
        var siteTime = new Calendar(timezoneHelper.getCurrentSiteTime());
        var currentDay;
        var day;

        for (var countDay = 0; countDay < eodCheckLimit; countDay++) {
            // Run daily reports for last eodCheckLimit days
            currentDay = siteTime.getTime();
            currentDay.setDate(currentDay.getDate() - countDay);
            day = new Calendar(currentDay);

            for (var i = 0; i < eodReportsTypes.length; i++) {
                // Performing reports under eodCheck "reports" and update custom object with reports values
                var reportType = eodReportsTypes[i];

                // Get Report Data by report type and Day
                // and set data to CustomObject
                var Report = EODReportHelper.performOrderReportByType(
                    reportType,
                    day
                );

                if (Report && !empty(Report)) {
                    EODReportManager.setReportValue(day, reportType, Report);
                }
            }
        }

        return new Status(
            Status.OK,
            'OK',
            'Check Orders job successfully executed'
        );
    } catch (e) {
        Logger.error('CheckOrder.js: Error - ' + e);
        return new Status(Status.ERROR, 'ERROR', e.toString());
    }
}

module.exports.execute = execute;
