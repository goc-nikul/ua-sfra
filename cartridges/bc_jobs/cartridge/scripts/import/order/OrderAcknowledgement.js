'use strict';
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');

var MAX_COLLECTION_SIZE = 10000;
var counter = 0;

function execute(jobParameters) {
    if (empty(jobParameters.workingFolder)) {
        Logger.error('OrderAcknowledgement.js: Paramenter \'workingFolder\' is empty');
        return new Status(Status.ERROR, 'MISSING_CONFIG', 'Paramenter \'workingFolder\' is empty.');
    }
    var importOrderUtils = require('bc_jobs/cartridge/scripts/import/Utils');
    var workingFolder = importOrderUtils.getWorkingFolder(jobParameters.workingFolder);
    var filesParam = {
        Directory: workingFolder,
        SortDirection: jobParameters.sortDirection,
        FilePattern: jobParameters.filePattern,
        OnlyFiles: true,
        RecursiveSearch: false
    };
    var files = importOrderUtils.getFilesFromDirectory(filesParam);
    var isEndFilesCollection = false;

    if (empty(files)) {
        Logger.debug('OrderAcknowledgement.js: Empty file list');
        return new Status(Status.OK, 'NO_FILES', 'No files for import.');
    }

    while (!isEndFilesCollection) {
        isEndFilesCollection = processFiles(files, filesParam, MAX_COLLECTION_SIZE);
        counter++;
        if (files.size() <= MAX_COLLECTION_SIZE) isEndFilesCollection = true;
    }

    if (jobParameters.zipFiles) {
        require('bc_jobs/cartridge/scripts/import/ZipFiles.js').execute({
            filePattern: jobParameters.filePattern,
            sourceFolder: jobParameters.workingFolder,
            targetFolder: jobParameters.targetFolder,
            deleteFile: jobParameters.deleteFile,
            singleFile: jobParameters.singleFile
        });
    }

    return new Status(Status.OK);
}

function processFiles(files, filesParam, maxCollectionSize) {
    var importOrderUtils = require('bc_jobs/cartridge/scripts/import/Utils');
    var fileList = importOrderUtils.getProcessedFiles(files, filesParam, maxCollectionSize, counter);
    var fileListItr = fileList.iterator();
    while (fileListItr.hasNext()) {
        var fileForImport = fileListItr.next();
        let importStatus = null;
        Transaction.begin();
        let importResult = importOrderUtils.processImportFile(fileForImport, orderElementFilter, orderElementHandler);
        if (importResult.Status != 'success') {
            Logger.error("OrderAcknowledgement.js: Import of {0} failed", fileForImport.getFullPath());
            Transaction.rollback();
            return new Status(Status.ERROR, "IMPORT_ERROR", "Import failed");
        } else {
            Transaction.commit();
            importStatus = 'success';
        }
        if (importStatus != 'success') {
            Logger.debug("OrderAcknowledgement.js: Import of {0} failed", fileForImport.getFullPath());
        } else {
            Logger.debug("OrderAcknowledgement.js: Import of {0} successfully completed", fileForImport.getFullPath());
        }
    }
    return empty(fileList);
}


var orderElementFilter = function (xmlReader) {
    return xmlReader.getLocalName() === 'order';
}

var orderElementHandler = function (element, offlineRefund, file) {
    var orderNo = element.attribute('order-no');
    var handlerTypeElement = element.elements('acknowledgment');
    if (orderNo.length() === 1) {
        var order = OrderMgr.getOrder(orderNo.toString());
        if (order) {
            // Acknowledgment
            if (handlerTypeElement.length() === 1) {
                var sapID = handlerTypeElement.elements('sap-customer-id');
                var invoiceID = handlerTypeElement.elements('sap-invoice-id');
                if (sapID.length() === 1 && sapID.toString() != '') acknowledgeOrder(order, sapID.toString(), file);
                if (invoiceID.length() === 1 && invoiceID.toString() != '') invoiceOrder(order, invoiceID.toString());
            }
        } else {
            Logger.warn('OrderAcknowledgement.js: Order not found: {0}', orderNo.toString());
        }
    }
}

function acknowledgeOrder(order, sapID, file) {
    // Set HTML order detail.
    order.custom.customerSAP_ID = sapID;
    // Update order to shipped status.
    order.setExternalOrderStatus('acknowledged');
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    var date = new Date();
    var currentDate = 'Date:' + (date.getDate() + 1) + ' Month:' + (date.getMonth() + 1) + ' Year:' + date.getFullYear();
    order.addNote('Order Confirmation File ', 'File Name ' + file.name + ' Received On : ' + currentDate);
    // Update customer SAP ID
    var customer = order.getCustomer();
    if (customer != null && customer.isRegistered()) {
        var profile = customer.getProfile();
        if (profile != null) {
            if (empty(profile.custom.sapID)) {
                profile.custom.sapID = sapID;
                Logger.debug('OrderAcknowledgement.js: Customer SAP ID set: ' + order.orderNo + ' ' + profile.credentials.login + ' ' + sapID);
            }
        }
    }
    else {
        Logger.debug('OrderAcknowledgement.js: Anonymous customer, SAP ID not set: ' + order.orderNo + ' ' + sapID);
    }

}

function invoiceOrder(order, invoiceID) {
    // Set HTML order detail.
    order.custom.invoiceSAP_ID = invoiceID;
}

module.exports.execute = execute;
