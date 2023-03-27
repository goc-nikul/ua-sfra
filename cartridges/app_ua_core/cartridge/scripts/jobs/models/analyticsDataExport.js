'use strict';

/**
 * @module models/analyticsDataExport
 */

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
 * @type {module:models/analyticsDataRow~DataRow}
 */
const DataRow = require('./analyticsDataRow');

/**
 * @type {dw.system.Logger}
 */
const Logger = require('dw/system/Logger');

/**
 * @constructor
 * @param {Object} params Job params
 * @param {Function} iteratorCallback Callback to retrieve orders
 * @alias module:models/analyticsDataExport~Export
 */
function Export(params) {
    /**
     * @type {dw.system.Site}
     */
    this.currentSite = require('dw/system/Site').current;

    /**
     * @type {string}
     */
    this.archiveDirectoryPath = [File.IMPEX, params.archiveDirectoryPath, this.currentSite.ID].join(File.SEPARATOR);

    /**
     * @type {string}
     * @private
     */
    this.directoryPath = [File.IMPEX, params.targetDirectoryPath, this.currentSite.ID].join(File.SEPARATOR);
    // Ensure dirpath exists
    (new File(this.directoryPath)).mkdirs();

    var exportDate;
    if (params.date) {
        exportDate = new Date(params.date);
    } else {
        exportDate = new Date();
        exportDate.setTime(exportDate.valueOf() + this.currentSite.timezoneOffset);
    }

    /**
     * @type {Date}
     */
    this.exportDate = exportDate;

    var formatedDate = [
        this.exportDate.getFullYear(),
        this.exportDate.getMonth() + 1,
        this.exportDate.getDate(),
        this.exportDate.getHours().toString() + this.exportDate.getMinutes() + this.exportDate.getSeconds()
    ];

    var filePath;
    if (params.endDate) {
        var exportEndDate = new Date(params.endDate);
        var formatedEndDate = [
            exportEndDate.getFullYear(),
            exportEndDate.getMonth() + 1,
            exportEndDate.getDate()
        ];
        filePath = this.directoryPath + File.SEPARATOR + params.exportFileName.replace('.csv', '_' + formatedDate.join('-') + '_' + formatedEndDate.join('-') + '.csv');
    } else {
        filePath = this.directoryPath + File.SEPARATOR + params.exportFileName.replace('.csv', '_' + formatedDate.join('-') + '.csv');
    }

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

    /**
     * @type {module:models/analyticsDataRow~DataRow}
     * @private
     */
    this.dataRow = new DataRow(this.currentSite);
}

/**
 * @alias module:models/analyticsDataExport~Export#prototype
 */
Export.prototype = {
    writeHeader: function writeHeader() {
        this.csvWriter.writeNext(Object.keys(this.dataRow.rowStructure));
    },

    /**
     * @param {dw.order.Order} order Order object
     * @returns {void}
     */
    buildRows: function buildRows(order) {
        var rows = [];
        try {
            var lineItems = order.allProductLineItems.iterator();
            while (lineItems.hasNext()) {
                var row = [];
                var lineItem = lineItems.next();
                this.dataRow.initRow(order, lineItem);
                row = this.dataRow.buildRow();
                rows.push(row);
            }
        } catch (e) {
            Logger.error('Error while order #{0} export :: {1}', order.orderNo, e.message);
        }
        this.writeRows(rows);
    },

    /**
     * Writes array of data to file
     * @param {dw.util.Collection|Array} lines Array of rows
     */
    writeRows: function writeRows(lines) {
        lines.forEach((line) => {
            this.csvWriter.writeNext(line);
        });
    },

    /**
     * Archives files from the previous day
     * @returns {boolean} False - if there is nothing to archive
     */
    archiveFiles: function archiveFiles() {
        // get files
        var directory = new File(this.directoryPath);
        var filesList = directory.list();

        var yesterdayDateFormated = [this.exportDate.getFullYear(), this.exportDate.getMonth() + 1, this.exportDate.getDate() - 1].join('-');
        var filePattern = '_' + yesterdayDateFormated + '-\\S*.csv';
        var fileListToArchive = filesList.filter(function (filePath) {
            return (filePath.match(filePattern) !== null);
        }).map(function (filePath) {
            return directory.getFullPath() + File.SEPARATOR + filePath;
        });

        if (fileListToArchive.length === 0) {
            return false;
        }

        var archiveName = 'archive_' + yesterdayDateFormated;
        var tempFullPath = this.archiveDirectoryPath + File.SEPARATOR + archiveName;
        var tempArchiveDirectory = new File(tempFullPath);
        tempArchiveDirectory.mkdirs();

        fileListToArchive.forEach(function (filePathToArchive) {
            var fileToMove = new File(filePathToArchive);
            var fileDestination = new File(tempArchiveDirectory.getFullPath() + File.SEPARATOR + fileToMove.getName());
            fileToMove.renameTo(fileDestination);
        });

        // zip archive directory
        var zipFile = new File(tempFullPath + '.zip');
        tempArchiveDirectory.zip(zipFile);

        // remove temp archive directory
        var filesToRemove = tempArchiveDirectory.listFiles();
        if (!empty(filesToRemove)) {
            filesToRemove.toArray().forEach(function (fileToRemove) {
                fileToRemove.remove();
            });
        }
        return tempArchiveDirectory.remove();
    },

    close: function close() {
        this.csvWriter.close();
        this.fileWriter.close();
    }
};

module.exports = Export;
