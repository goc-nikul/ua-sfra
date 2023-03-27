'use strict';
var importOrderUtils = require('bc_jobs/cartridge/scripts/import/Utils'),
    Logger = require('dw/system/Logger'),
    Status = require('dw/system/Status');

var MAX_COLLECTION_SIZE = 10000;
var counter = 0;
var moveFiles = [];
var orderPattern = '';

function execute(params) {

    try {
        orderPattern = params.orderPattern;
        var sourceFolder = importOrderUtils.getWorkingFolder(params.sourceFolder);
        var targetFolder = importOrderUtils.getWorkingFolder(params.targetFolder);

        var filesParam = {
            Directory: sourceFolder,
            FilePattern: params.filePattern,
            OnlyFiles: true
        };

        var files = importOrderUtils.getFilesFromDirectory(filesParam);

        if (empty(files)) {
            Logger.debug('OrderAcknowledgement.js: Empty file list');
            return new Status(Status.OK, 'NO_FILES', 'No files to move.');
        }

        var isEndFilesCollection = false;
        while (!isEndFilesCollection) {
            isEndFilesCollection = processFiles(files, filesParam, MAX_COLLECTION_SIZE);
            counter++;

            if (files.size() <= MAX_COLLECTION_SIZE) {
                isEndFilesCollection = true;
            }
        }

        importOrderUtils.moveFile(moveFiles, targetFolder);
    } catch (e) {
        Logger.error('MoveOrderFiles.js: failed with ' + JSON.stringify(e));
        return new Status(Status.ERROR, 'MOVE_FILE_ERROR', 'Moving file failed');
    }

    return new Status(Status.OK);
}

function processFiles(files, filesParam, maxCollectionSize) {

    var fileList = importOrderUtils.getProcessedFiles(files, filesParam, maxCollectionSize, counter);
    var iter = fileList.iterator();

    while (iter != null && iter.hasNext()) {

        let fileToMove = iter.next();
        let importResult = importOrderUtils.processImportFile(fileToMove, orderElementFilter, orderElementHandler);

        if (importResult.Status != 'success') {
            throw new Error('Error while moving file ' + fileToMove.getFullPath());
        } else {
            Logger.debug('MoveOrderFiles.js: successfully completed ' + fileToMove.getFullPath());
        }
    }

    return empty(fileList);
}

var orderElementFilter = function(xmlReader) {
    return xmlReader.getLocalName() === 'order';
}

var orderElementHandler = function(element, offlineRefund, file) {

    var orderNo = element.attribute('order-no');
    var regExp = new RegExp(orderPattern);
    if (orderNo.length() === 1) {
        if (regExp.test(orderNo))
            moveFiles.push(file);
    }
}


module.exports.execute = execute;