'use strict';

const File = require('dw/io/File');
const Order = require('dw/order/Order');
const Status = require('dw/system/Status');
const System = require('dw/system/System');
const OrderMgr = require('dw/order/OrderMgr');
const Pipeline = require('dw/system/Pipeline');
const StringUtils = require('dw/util/StringUtils');

const site = require('dw/system/Site').getCurrent();
const logger = require('dw/system/Logger').getLogger('ExportOrders');

/**
 * Constracts search order query for provided order channel type.
 *
 * @param {string} channelType - Order channel type to search with.
 * @returns {string} Formatted search order query.
 */
function getSearchOrderQuery(channelType) {
    const queryString = '(exportStatus = {0} OR exportStatus = {1}) ' +
        'AND (status = {2} OR status = {3}) ' +
        'AND paymentStatus = {4} ' +
        'AND channelType = {5}';

    const queryParams = [
        Order.EXPORT_STATUS_READY,
        Order.EXPORT_STATUS_FAILED,
        Order.ORDER_STATUS_NEW,
        Order.ORDER_STATUS_OPEN,
        Order.PAYMENT_STATUS_PAID,
        channelType
    ];

    return StringUtils.format(queryString, queryParams);
}

/**
 * Returns full file name in IMPEX.
 *
 * @param {string} orderType - Order type.
 * @returns {string} Full file path in IMPEX.
 */
function getExportFilePath(orderType) {
    const exportDirectoryPath = File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'download' + File.SEPARATOR + 'order';
    const exportDirectory = File(exportDirectoryPath);
    exportDirectory.mkdirs();

    orderType = orderType || '';
    const fileNamePrefix = 'order_export';
    const fileNameMiddle = orderType + site.ID;
    const fileNameSuffix = StringUtils.formatCalendar(System.getCalendar(), 'yyyyMMdd_HHmmssSSS') + '.xml';
    const exportFileName = fileNamePrefix + '_' + fileNameMiddle + '_' + fileNameSuffix;
    const exportFilePath = 'download' + File.SEPARATOR + 'order' + File.SEPARATOR + exportFileName;

    return exportFilePath;
}

/**
 * Performs order search using provided search query.
 *
 * @param {string} searchQuery - Search order query.
 * @returns {Iterator} Found orders
 */
function getOrders(searchQuery) {
    return OrderMgr.searchOrders(searchQuery, null);
}

/**
 * Executes CustomFeeds-ExportOrders pipeline which performs actual order export process.
 *
 * @param {Iterator} orders - Orders to export
 * @param {string} exportFilePath - Full export file path
 * @returns {dw.system.Status} Job execution status
 */
function exportOrders(orders, exportFilePath) {
    if (!orders.count) {
        logger.info('Order export finished, no orders found for export.');
        return new Status(Status.OK);
    }

    logger.info('Starting to export ' + orders.count + ' orders.');

    // Currently it not possible to export orders via DW API.
    // Use simple pipeline to export orders via ExportOrders pipelet
    // TODO: Implement export process via DW API method once it is available.
    const exportOrdersStatus = Pipeline.execute('ExportOrders-Start', {
        Orders: orders,
        ExportFile: exportFilePath
    });

    if (exportOrdersStatus.EndNodeName === 'ERROR') {
        logger.error('The order export failed. Error: {0}', exportOrdersStatus.ErrorMsg);
        return new Status(Status.ERROR, exportOrdersStatus.ErrorMsg);
    }

    logger.info('DW export successfully finished.');
    
    return new Status(Status.OK);
}

/**
 * Starts order export process for WEB orders.
 *
 * @returns {dw.system.Status} Job execution status
 */
function exportWebOrders() {
    var exportFilePath = getExportFilePath();
    var searchQuery = getSearchOrderQuery(null);
    var orders = getOrders(searchQuery);
    exportOrders(orders, exportFilePath);
    
    //run second export for orders with CHANNEL_TYPE = STOREFRONT, because of quota limit of 6 parameters per query
    exportFilePath = getExportFilePath();
    searchQuery = getSearchOrderQuery(Order.CHANNEL_TYPE_STOREFRONT);
    orders = getOrders(searchQuery);
    exportOrders(orders, exportFilePath);
    
    return new Status(Status.OK);
}

/**
 * Starts order export process for EA orders.
 *
 * @returns {dw.system.Status} Job execution status
 */
function exportEAOrders() {
    const exportFilePath = getExportFilePath('EA');
    const searchQuery = getSearchOrderQuery(Order.CHANNEL_TYPE_DSS);
    const orders = getOrders(searchQuery);
    return exportOrders(orders, exportFilePath);
}

/* Exported methods */
module.exports = {
    exportWebOrders: exportWebOrders,
    exportEAOrders: exportEAOrders
};