/**
 * @type {dw.io.File}
 */
const File = require('dw/io/File');

/**
 * @type {dw.io.FileWriter}
 */
const FileWriter = require('dw/io/FileWriter');

/**
 * @type {dw.io.CSVStreamWriter}
 */
const CSVStreamWriter = require('dw/io/CSVStreamWriter');

/**
 * @type {dw.system.Logger}
 */
const Logger = require('dw/system/Logger');

/**
 * @type {dw.util.Calendar}
 */
var Calendar = require('dw/util/Calendar');

/**
 * @type {dw.util.StringUtils}
 */
var StringUtils = require('dw/util/StringUtils');

/**
 * @constructor
 * @param {Object} params Job params
 * @param {Function} iteratorCallback Callback to retrieve orders
 * @alias module:models/orderReconciliationDataExport~Export
 */
function Export(params) {
    /**
     * @type {dw.system.Site}
     */
    this.currentSite = require('dw/system/Site').current;

    /**
     * @type {string}
     * @private
     */
    this.directoryPath = [
        File.IMPEX,
        params.targetDirectoryPath,
        this.currentSite.ID
    ].join(File.SEPARATOR);
    // Ensure dirpath exists
    new File(this.directoryPath).mkdirs();

    var currentCalendar = new Calendar();
    currentCalendar.setTimeZone(this.currentSite.getTimezone());

    var formatedDate = StringUtils.formatCalendar(
        currentCalendar,
        "yyyy-MM-dd'T'HH:mm:ss"
    );

    var filePath =
        this.directoryPath +
        File.SEPARATOR +
        params.exportFileName.replace('.csv', '_' + formatedDate + '.csv');

    /**
     * @type {dw.io.File}
     * @private
     */
    this.file = new File(filePath);

    /**
     * @type {dw.io.FileWriter}
     * @private
     */
    this.fileWriter = new FileWriter(this.file);

    /**
     * @type {dw.io.CSVStreamWriter}
     * @private
     */
    this.csvWriter = new CSVStreamWriter(this.fileWriter, params.delimiter);

    this.allRows = {
        orderNumber: function (instance) {
            return instance.order.orderNo;
        },
        orderDate: function (instance) {
            var orderDate = new Calendar(instance.order.getCreationDate());
            orderDate.setTimeZone(instance.currentSite.getTimezone());
            return StringUtils.formatCalendar(orderDate, 'yyyy-MM-dd HH:mm:ss');
        },
        shipmentStatus: function (instance) {
            return instance.order.getShippingStatus().displayValue;
        }
    };

    var rows;
    if (params.rows) {
        rows = JSON.parse(params.rows);
    }
    this.rowStructure = {};
    if (rows) {
        Object.keys(this.allRows).forEach((propName) => {
            if (rows.includes(propName)) {
                this.rowStructure[propName] = this.allRows[propName];
            }
        });
    } else {
        this.rowStructure = this.allRows;
    }
}

/**
 * @alias module:models/orderReconciliationDataExport~Export#prototype
 */
Export.prototype = {
    writeHeader: function writeHeader() {
        this.csvWriter.writeNext(Object.keys(this.rowStructure));
    },

    /**
     * @param {dw.order.Order} order Order Instance
     * @param {dw.order.ProductLineItem} lineItem Product Line Item Instance
     */
    initRow: function initRow(order) {
        this.order = order;
    },

    /**
     * @param {dw.order.Order} order Order object
     * @returns {void}
     */
    buildRow: function buildRow(order) {
        var row = [];
        var propValue;
        var instance = this;
        try {
            Object.keys(this.rowStructure).forEach((propName) => {
                propValue = instance.rowStructure[propName](instance);
                row.push(propValue);
            });
        } catch (e) {
            Logger.error(
                'Error while order #{0} export :: {1}',
                order.orderNo,
                e.message
            );
        }
        this.csvWriter.writeNext(row);
    },

    close: function close() {
        this.csvWriter.close();
        this.fileWriter.close();
    }
};

module.exports = Export;
