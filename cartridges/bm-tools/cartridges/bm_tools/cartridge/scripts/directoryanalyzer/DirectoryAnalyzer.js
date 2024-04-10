/**
* Directory Analyzer
*/

var Money = require('dw/value/Money');
var StringWriter = require('dw/io/StringWriter');
var LinkedHashMap = require('dw/util/LinkedHashMap');

var Class = require('~/cartridge/scripts/util/Class').Class;

var counterTotalSizeFileType = 'counterTotalSizeFileType';
var counter1KB = 'counter1KB';
var counter10KB = 'counter10KB';
var counter100KB = 'counter100KB';
var counter1MB = 'counter1MB';
var counter10MB = 'counter10MB';
var counter100MB = 'counter100MB';
var counter1000MB = 'counter1000MB';
var counterAll = 'counterAll';
var counterPercent = 'counterPercent';

var SIZE_1KB = 1024;
var SIZE_10KB = 1024 * 10;
var SIZE_100KB = 1024 * 100;
var SIZE_1MB = 1024 * 1024;
var SIZE_10MB = 1024 * 1024 * 10;
var SIZE_100MB = 1024 * 1024 * 100;

/**
 * Increments simple statistics
 *
 * @param {*} statsCollector The collectr object
 * @param {*} counter The counter
 * @param {*} value The value
 */
function incStats(statsCollector, counter, value) {
    if (statsCollector.containsKey(counter)) {
        var oldValue = statsCollector.get(counter);
        statsCollector.put(counter, oldValue + value);
    } else {
        statsCollector.put(counter, value);
    }
}

/**
 * Increments file statistics
 *
 * @param {*} statsCollector The collectr object
 * @param {*} fileType The file type
 * @param {*} value The value
 */
function incFileType(statsCollector, fileType, value) {
    incStats(statsCollector, counterTotalSizeFileType + '|' + fileType, value);

    if (value > SIZE_100MB) incStats(statsCollector, fileType + '|' + counter1000MB, 1);
    else if (value > SIZE_10MB) incStats(statsCollector, fileType + '|' + counter100MB, 1);
    else if (value > SIZE_1MB) incStats(statsCollector, fileType + '|' + counter10MB, 1);
    else if (value > SIZE_100KB) incStats(statsCollector, fileType + '|' + counter1MB, 1);
    else if (value > SIZE_10KB) incStats(statsCollector, fileType + '|' + counter100KB, 1);
    else if (value > SIZE_1KB) incStats(statsCollector, fileType + '|' + counter10KB, 1);
    else if (value <= SIZE_1KB) incStats(statsCollector, fileType + '|' + counter1KB, 1);

    incStats(statsCollector, fileType + '|' + counterAll, 1);
}

/**
 * Increments file stats
 * @param {*} statsCollector The collector
 * @param {*} fileType The file type
 * @param {*} value The value
 */
function incFileStats(statsCollector, fileType, value) {
    if (statsCollector.containsKey(fileType)) {
        incFileType(statsCollector, fileType, value);
    } else {
        incStats(statsCollector, counterTotalSizeFileType + '|' + fileType, 0);
        incStats(statsCollector, fileType + '|' + counterPercent, 0);
        incStats(statsCollector, fileType + '|' + counter1KB, 0);
        incStats(statsCollector, fileType + '|' + counter10KB, 0);
        incStats(statsCollector, fileType + '|' + counter100KB, 0);
        incStats(statsCollector, fileType + '|' + counter1MB, 0);
        incStats(statsCollector, fileType + '|' + counter10MB, 0);
        incStats(statsCollector, fileType + '|' + counter100MB, 0);
        incStats(statsCollector, fileType + '|' + counter1000MB, 0);
        incStats(statsCollector, fileType + '|' + counterAll, 0);
        incFileType(statsCollector, fileType, value);
    }
}

/**
 * Recursively loops the directory
 *
 * @param {*} file The file/directory
 * @param {*} statsCollector The collector
 * @param {*} fileWriter The file witer
 */
function loopDir(file, statsCollector, fileWriter) {
    var files = file.listFiles();

    if (files != null) {
        var filesIter = files.iterator();

        while (filesIter.hasNext()) {
            // eslint-disable-next-line no-use-before-define
            checkFile(filesIter.next(), statsCollector, fileWriter);
        }
    }
}

/**
 * Analyses a directory
 *
 * @param {dw.io.File} file The file
 * @param {dw.io.FileWriter} fileWriter The FileWriter
 */
function analyzeAndRenderCSV(file, fileWriter) {
    var statsCollector = new LinkedHashMap();

    loopDir(file, statsCollector, fileWriter);

    var iter = statsCollector.entrySet().iterator();
    var foldername = file.getFullPath();
    var entry;
    var value;
    var key;

    if (iter.hasNext()) fileWriter.write(foldername + ',');

    while (iter.hasNext()) {
        entry = iter.next();
        value = entry.getValue();
        key = entry.getKey();

        if (key.indexOf(counterTotalSizeFileType) !== -1) {
            key = key.split('|').pop();
            fileWriter.write(key + ',');
            fileWriter.write(value + ',');
        } else if (key.indexOf(counterAll) !== -1) {
            fileWriter.write(value + '\n');
            if (iter.hasNext()) fileWriter.write(foldername + ',');
        } else {
            fileWriter.write(value + ',');
        }
    }
}


/**
 * Checks a file
 *
 * @param {*} file The file
 * @param {*} statsCollector The collector
 * @param {*} fileWriter The file writer
 */
function checkFile(file, statsCollector, fileWriter) {
    if (file.isDirectory()) {
        analyzeAndRenderCSV(file, fileWriter);
    } else {
        var length = file.length();
        var type = file.getName().split('.').pop().toString();

        incFileStats(statsCollector, type, length);
    }
}

/**
 * Base infrastructrure class for service framwork. If a service implementation needs to override
 * a method, the overridden method can always be called using this._super();
 *
 * @class
 * @augments Class
 * Base class of all web services.
 */
var DirectoryAnalyzer = Class.extend({
    /** @lends DirectoryAnalyzer.prototype */

    /**
     * Initialises the Base service and important properties for the HTTP Service
     * @constructs AbstractHTTPService
     * @param {*} type The type
     * @param {*} directory The directory
     */
    init: function (type, directory) {
        this.type = type;
        this.directory = directory;
    },

    /**
     * Generates the report
     *
     * @returns {Object} The report
     */
    generateReport: function () {
        var analyzerResult;
        var overallSize;
        var overallMoney;
        switch (this.type) {
            case 'SubDirectorySize':
                analyzerResult = {
                    type: 'SubDirectorySize',
                    headers: ['Directory', 'SIZE MB', 'Percentage'],
                    reportLines: [],
                    total: 0
                };
                this.getSubDirectorySize(this.directory, analyzerResult, false);
                analyzerResult.reportLines.sort(this.sortByDirectorySize);
                // calculate overall size
                overallSize = 0;
                analyzerResult.reportLines.forEach(function (recordLine) {
                    overallSize += recordLine[1];
                });
                overallMoney = new Money(overallSize, 'USD');
                // add percentages
                analyzerResult.reportLines.forEach(function (recordLine) {
                    recordLine.push(new Money(recordLine[1], 'USD').percentOf(overallMoney));
                    // eslint-disable-next-line no-param-reassign
                    recordLine[1] = new Money(recordLine[1] / (1024 * 1024), 'USD').value;
                });
                return analyzerResult;
            case 'OverallFileTypes':
                analyzerResult = {
                    type: 'OverallFileTypes',
                    headers: ['Extension', 'SIZE MB', 'Percentage'],
                    reportLines: [],
                    total: 0
                };
                this.getOverallFileTypes(this.directory, analyzerResult, null, true);
                analyzerResult.reportLines.sort(this.sortByDirectorySize);

                // calculate overall size
                overallSize = 0;
                analyzerResult.reportLines.forEach(function (recordLine) {
                    overallSize += recordLine[1];
                });
                overallMoney = new Money(overallSize, 'USD');
                // add percentages
                analyzerResult.reportLines.forEach(function (recordLine) {
                    recordLine.push(new Money(recordLine[1], 'USD').percentOf(overallMoney));
                    // eslint-disable-next-line no-param-reassign
                    recordLine[1] = new Money(recordLine[1] / (1024 * 1024), 'USD').value;
                });

                return analyzerResult;
            case 'FileTypesPerDirectory': var stringWriter = new StringWriter();
                analyzeAndRenderCSV(this.directory, stringWriter);
                stringWriter.close();
                var reportLines = stringWriter.toString();
                analyzerResult = {
                    type: 'FileTypesPerDirectory',
                    headers: ['Directory', 'Extension', 'SIZE MB', 'Percent', '<1KB', '1KB-10KB', '10KB-100KB', '100KB-1MB', '1MB-10MB', '10MB-100MB', '>100MB', 'File#'],
                    reportLines: []
                };
                overallSize = 0;
                reportLines.split('\n').forEach(function (reportLine) {
                    var splitRecordLine = reportLine.split(',');
                    if (splitRecordLine[2]) {
                        overallSize += parseFloat(splitRecordLine[2]);
                    }
                    analyzerResult.reportLines.push(splitRecordLine);
                });

                overallMoney = new Money(overallSize, 'USD');
                // removing last line --> should be empty
                analyzerResult.reportLines.pop();
                analyzerResult.reportLines.sort(this.sortAnalyzedDirectories);
                analyzerResult.reportLines.forEach(function (recordLine) {
                    // eslint-disable-next-line no-param-reassign
                    recordLine[3] = new Money(recordLine[2], 'USD').percentOf(overallMoney);
                    // eslint-disable-next-line no-param-reassign
                    recordLine[2] = new Money(recordLine[2] / (1024 * 1024), 'USD').value;
                });
                return analyzerResult;
            default: break;
        }
        return null;
    },

    /**
     * Gets the subdirectory size
     * @param {*} directory The directors
     * @param {*} analyzerResult The result
     * @param {*} subdirectory The subdirectory
     * @returns {number} The size
     */
    getSubDirectorySize: function (directory, analyzerResult, subdirectory) {
        if (directory && directory.directory) {
            var directorySize = 0;
            var self = this;
            directory.listFiles(function (file) {
                // avoid endless loops
                if (['..', '.'].indexOf(file.name) === -1) {
                    if (file.directory) {
                        var subdirectorySize = self.getSubDirectorySize(file, null, true);
                        if (subdirectory) {
                            directorySize += subdirectorySize;
                        } else {
                            var resultLineArray = [file.name, subdirectorySize];
                            analyzerResult.reportLines.push(resultLineArray);
                        }
                    } else {
                        directorySize += file.length();
                    }
                }
                return false;
            });
            if (!subdirectory) {
                var resultLineArray = ['.', directorySize];
                analyzerResult.reportLines.push(resultLineArray);
            }
            return directorySize;
        }
        return 0;
    },

    /**
     * Gets the file  type overview
     * @param {*} directory The directory
     * @param {*} analyzerResult The result
     * @param {*} inboundExtensionRegistry The registry
     * @param {*} rootFolder The root folder
     */
    getOverallFileTypes: function (directory, analyzerResult, inboundExtensionRegistry, rootFolder) {
        if (directory && directory.directory) {
            var extensionRegistry = inboundExtensionRegistry;
            if (!extensionRegistry) {
                extensionRegistry = {};
            }
            var self = this;
            directory.listFiles(function (file) {
                // avoid endless loops
                if (['..', '.'].indexOf(file.name) === -1) {
                    if (file.directory) {
                        self.getOverallFileTypes(file, null, extensionRegistry, false);
                    } else {
                        var fileExtension = file.name.split('.').pop().toString();
                        var extensionOverall = extensionRegistry[fileExtension] || 0;
                        extensionOverall += file.length();
                        extensionRegistry[fileExtension] = extensionOverall;
                    }
                }
                return false;
            });
            if (rootFolder) {
                Object.keys(extensionRegistry).forEach(function (extension) {
                    var resultLineArray = [extension, extensionRegistry[extension]];
                    analyzerResult.reportLines.push(resultLineArray);
                });
            }
        }
    },


    sortByDirectory: function (e1, e2) {
        if (e1[0] === e2[0]) {
            if (e1[1] > e2[1]) {
                return 1;
            }
            return -1;
        } else if (e1[0] > e2[0]) {
            return 1;
        } else if (e1[0] < e2[0]) {
            return -1;
        }
        return 0;
    },

    sortByDirectorySize: function (e1, e2) {
        if (e1[1] === e2[1]) {
            if (e1[0] > e2[0]) {
                return -1;
            }
            return 1;
        } else if (e1[1] > e2[1]) {
            return -1;
        } else if (e1[1] < e2[1]) {
            return 1;
        }
        return 0;
    }
});

// Exports the function that can be extended by other service implementations
module.exports = DirectoryAnalyzer;
