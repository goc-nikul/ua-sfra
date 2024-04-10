'use strict';

/**
 * Controller that renders BM orders management pages
 *
 * @module controllers/BMOrders
 */

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var Calendar = require('dw/util/Calendar');
var Logger = require('dw/system/Logger');

/* Script Modules */
var app = require('bm_tools/cartridge/scripts/app');
var guard = require('bm_tools/cartridge/scripts/guard');
var response = require('bm_tools/cartridge/scripts/util/Response');

/* Custom Managers & Helpers */
var eodReportHelper = require('~/cartridge/scripts/reports/EODReportHelper');
var eodReportMgr = require('*/cartridge/scripts/orders/EODReportMgr');

/**
 * Renders the orders report page.
 */
function reports() {
    app.getView().render('order/orderreports');
}

/**
 * Returns reports data by provided time range.
 */
function getTimeRangeReports() {
    var dateFrom = request.httpParameterMap.dateFrom;
    var dateTo = request.httpParameterMap.dateTo;
    var oneDay = 1000 * 60 * 60 * 24;
    var reportsDaysCount = 1;

    // Validate provided Params
    if (
        empty(dateTo) ||
        empty(dateTo.value) ||
        empty(dateFrom) ||
        empty(dateFrom.value)
    ) {
        response.renderJSON({ success: false, refreshPage: true });
        return;
    }

    try {
        dateFrom = new Date(dateFrom.value);
        dateTo = new Date(dateTo.value);
    } catch (e) {
        Logger.error(
            "BMOrders.js error can not parse '{0}' and/or {1} to Calendar type. Error: {2}",
            dateFrom.value,
            dateTo.value,
            e
        );
        response.renderJSON({ success: false, refreshPage: true });
        return;
    }

    // get range between dateFrom and dateTo in days : Number
    reportsDaysCount += Math.floor(
        (dateTo.getTime() - dateFrom.getTime()) / oneDay
    );

    app.getView({
        reportsEnd: new Calendar(dateTo),
        reportsDaysCount: reportsDaysCount,
        reportTypesList: eodReportHelper.getSiteReportTypes()
    }).render('order/components/orderreportsbody');

    return;
}

/**		Private Function
 *
 *	Update report data in Custom Object by provided Day
 *	@param {Calendar} day -day to report
 */
function updateReportsByDay(day) {
    var eodReportsTypes = eodReportHelper.getSiteReportTypes();

    for (var i = 0; i < eodReportsTypes.length; i++) {
        var reportType = eodReportsTypes[i];

        // Checking for noSuchMethod in eodReports
        var Report = eodReportHelper.performOrderReportByType(reportType, day);
        if (!empty(Report)) {
            eodReportMgr.setReportValue(day, reportType, Report);
        }
    }
    return;
}

/**
 * Updates order reports data for specific Day
 * and renders updated day data
 */
function refreshReportsDayData() {
    var reportDate = request.httpParameterMap.reportDate;
    // Validate provided Date
    if (empty(reportDate) || empty(reportDate.value)) {
        Logger.error('BMOrders.js. Date for refresh report not provided.');
        response.renderJSON({ success: false, refreshPage: true });
        return;
    }

    var day = new Calendar(new Date(reportDate.value));
    // transform Date : String to Day : Calendar and update report data by Day
    try {
        updateReportsByDay(day);
    } catch (e) {
        Logger.error(
            'BMOrders.js error can not parse {0} to Calendar type. Error: {1}',
            reportDate.value,
            e
        );
        response.renderJSON({ success: false, refreshPage: true });
        return;
    }

    app.getView({
        dayData: eodReportMgr.getDayData(day),
        dateFormated: reportDate.value,
        reportTypesList: eodReportHelper.getSiteReportTypes()
    }).render('order/components/orderreportsrow');
    return;
}

/**
 * Renders the orders invoices page.
 */
function invoices() {
    // eslint-disable-next-line no-unused-vars
    var orderInvoicesForm = app.getForm('orderinvoices');

    app.getView({
        ContinueURL: URLUtils.https('BMOrders-InvoicesForm')
    }).render('order/orderinvoices');
}

/**
 * handle order invoices form actions.
 */
function handleInvoicesActions() {
    var orderInvoicesForm = app.getForm('orderinvoices');
    var searchError = false;
    var orderNo = null;
    var order = null;
    orderInvoicesForm.handleAction({
        clear: function () {
            orderInvoicesForm.clear();
            searchError = false;
            orderNo = null;
        },
        find: function (formgroup) {
            orderNo = formgroup.orderno.value;
            var orderModel = app.getModel('Order').get(orderNo);

            if (empty(orderModel) || empty(orderModel.object)) {
                searchError = true;
            } else {
                order = orderModel.object;
            }
        }
    });

    app.getView({
        Order: order,
        SearchError: searchError,
        orderNo: orderNo
    }).render('order/orderinvoices');
}

/*
 * Export the publicly available controller methods
 */
/** Renders the orders report page
 * @see module:controllers/BMOrders-invoices */
exports.Reports = guard.ensure(['get', 'https'], reports);
/** Returns reports by time range
 * @see {@link module:controllers/BMOrders~getTimeRangeReports} */
exports.GetTimeRangeReports = guard.ensure(['post'], getTimeRangeReports);
/** Updates reports by provided date
 * @see {@link module:controllers/BMOrders~refreshReportsDayData} */
exports.RefreshReportsDayData = guard.ensure(['post'], refreshReportsDayData);
/** Renders the orders invoices page
 * @see module:controllers/BMOrders~invoices */
exports.Invoices = guard.ensure(['get', 'https'], invoices);
/** The invoices form handler.
 * @see {@link module:controllers/BMOrders~handleInvoicesActions} */
exports.InvoicesForm = guard.ensure(['post', 'https'], handleInvoicesActions);
