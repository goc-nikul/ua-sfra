'use strict';

/**
 * Controller that renders BM deleted customer reports
 *
 * @module controllers/CustomerReport
 */

var app = require('bm_tools/cartridge/scripts/app');
var guard = require('bm_tools/cartridge/scripts/guard');

var Logger = require('dw/system/Logger');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
/**
 *
 * @returns {Array} Array of attribute types for the data report table
 */
function deletedCustomerAttributeList() {
    var deletedCustomerObjectTypeDef;
    var attrDefs;
    var attrList = [];
    try {
        deletedCustomerObjectTypeDef = CustomObjectMgr.describe(
            'deletedCustomerRecords'
        );
        attrDefs = deletedCustomerObjectTypeDef.getAttributeDefinitions();
    } catch (err) {
        Logger.error('CustomerReport.js: error in fetching data attributes from custom object \n' + err.message);
        return attrList;
    }
    attrList = attrDefs
        .toArray()
        .map((item) => {
            return item.ID;
        })
        .filter((ID) => {
            return ID !== 'UUID' && ID !== 'lastModified';
        });

    return attrList;
}
/**
 *
 * @param {boolean} filter check if date range filter applied or not
 * @returns {Object} Object containing result of fetching data records from custom object
 */
function deletedCustomerList(filter) {
    var deletedCustomersDataFiltered;
    var customerReportData = [];
    var result = {
        success: true
    };
    var queryString = '';
    var dateFrom = '';
    var dateTo = '';
    if (filter) {
        var kstOffset = 9 * 60 * 60 * 1000;
        dateFrom = new Date(request.httpParameterMap.dateFrom);
        dateTo = new Date(request.httpParameterMap.dateTo);
        dateFrom.setTime(dateFrom.getTime() - kstOffset);
        dateTo.setDate((dateTo.getDate()) + 1);
        dateTo.setTime(dateTo.getTime() - kstOffset);
        queryString = 'creationDate >= {0} AND creationDate <= {1}';
    }
    try {
        deletedCustomersDataFiltered = CustomObjectMgr.queryCustomObjects(
            'deletedCustomerRecords',
            queryString,
            'creationDate desc',
            dateFrom,
            dateTo
        );
    } catch (err) {
        Logger.error('CustomerReport.js: error in fetching data report from custom object \n' + err.message);
        result.success = false;
        return result;
    }
    while (deletedCustomersDataFiltered.hasNext()) {
        customerReportData.push(deletedCustomersDataFiltered.next());
    }
    result.customerReportDataBody = customerReportData;
    var totalRecordsCount = customerReportData.length;
    result.reportsStartDate = totalRecordsCount ? customerReportData[totalRecordsCount - 1].creationDate : '';
    return result;
}
/**
 * Renders all deleted customer reports data for all
 * the deleted customer so far
 */
function deleteRecords() {
    app.getView({
        columnItemsList: deletedCustomerAttributeList(),
        customerReportData: deletedCustomerList(false)
    }).render('customerreport/deleteRecords');
}
/**
 * Updates deleted customer reports data for specified Date range
 * and renders filtered data
 */
function handleDeleteFilter() {
    app.getView({
        customerReportData: deletedCustomerList(true)
    }).render('customerreport/components/deleteRecordsBody');
}

exports.DeleteRecords = guard.ensure(['get', 'https'], deleteRecords);
exports.HandleDeleteFilter = guard.ensure(['post'], handleDeleteFilter);
