'use strict';

/* API Includes */
var returnLabelLocalDirName = 'returnLabels';
var returnLabelRemoteDirName = '';
var transferClient;
/**
 * Return Amazon S3 site preferences
 * @return {Object} Amazon S3 site preferences JSON object
 */
function getS3Preferences() {
    var s3preferences = {};
    var orgPreferences = require('dw/system/System').getPreferences();
    if (!empty(orgPreferences) && !empty(orgPreferences.getCustom())) {
        var orgCustomPreferences = orgPreferences.getCustom();
        s3preferences = {
            bucketName: orgCustomPreferences.s3bucketName,
            accessKey: orgCustomPreferences.s3accessKey,
            secretAccessKey: orgCustomPreferences.s3secretAccessKey,
            region: orgCustomPreferences.s3region,
            returnLabelUrlExpiry: orgCustomPreferences.s3preSignedUrlExpiry
        };
    }
    return s3preferences;
}

/**
 * Log error details
 * @param {Object} e - SFCC error object
 */
function logError(e) {
    var logger = require('./lib/logger').getLogger();
    var customErrorMessage = 'Error while processing return label email requests';
    logger.error('{0}:{1}: {2} ({3}:{4}) \n{5}', customErrorMessage, e.name, e.message, e.fileName, e.lineNumber, e.stack);
}
/**
 * Call SFMC service to send return label email
 * @param {Object} sfmcData - Required data to trigger send email service
 * @param {string} returnLabelUrl - return label URL
 * @return {boolean} returns true email triggered successfully, else false
 */
function triggerEmail(sfmcData, returnLabelUrl) {
    var triggerEmailStatus = false;
    try {
        if (!empty(sfmcData) && !empty(returnLabelUrl)) {
            var returnHelper = require('int_OIS/cartridge/scripts/order/returnHelpers');
            var emailData = JSON.parse(sfmcData);
            emailData.LabelAttachmentUrl = returnLabelUrl;
            returnHelper.sendReturnLabel(emailData);
            triggerEmailStatus = true;
        }
    } catch (e) {
        logError(e);
    }
    return triggerEmailStatus;
}

/**
 * Upload return label to Amazon S3
 * @param {string} base64EncodedData - base64 encoded return label file data
 * @param {string} fileName - return label file name
 * @return {boolean} returns true if data uploaded successfully, else false
 */
function uploadFileToS3(base64EncodedData, fileName) {
    var uploadFileStatus = false;
    try {
        // First create file to IMPEX location
        var StringUtils = require('dw/util/StringUtils');
        var File = require('dw/io/File');
        var FileWriter = require('dw/io/FileWriter');
        var returnLabelDirPath = File.IMPEX + File.SEPARATOR + returnLabelLocalDirName;
        var returnLabelDirFile = new File(returnLabelDirPath);
        // Create directory if does not exist
        if (!returnLabelDirFile.exists()) {
            returnLabelDirFile.mkdir();
        }
        var filePath = returnLabelDirPath + File.SEPARATOR + fileName;
        var file = new File(filePath);
        // Create file if does not exist
        if (!file.exists()) {
            var decodedFileData = StringUtils.decodeBase64(base64EncodedData, 'ISO-8859-1');
            var fileWriter = new FileWriter(file, 'ISO-8859-1');
            fileWriter.write(decodedFileData);
            fileWriter.close();
        }
        // Uploaded created file to S3
        var remoteFilePath = !empty(returnLabelRemoteDirName) ? returnLabelRemoteDirName + '/' + fileName : fileName;
        if (transferClient.putBinary(remoteFilePath, file)) {
            file.remove(); // delete file if uploaded successfully
            uploadFileStatus = true;
        }
    } catch (e) {
        logError(e);
    }
    return uploadFileStatus;
}
/**
 * Process email return label requests
 * @param {Object} jobParameters - Job parameters
 * @return {dw.system.Status} returns OK status if all the data processed successfully, else ERROR
 */
module.exports.process = function (jobParameters) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var logger = require('./lib/logger').getLogger();
    var returnLabelEmailRequests = CustomObjectMgr.getAllCustomObjects('returnLabelEmailRequests');
    var returnLabelEmailRequestObj;
    var returnLabelEmailRequest;
    var returnLabelUrl;
    var isEmailSent;
    var isFileUploaded;
    var fileName;
    var awstimeoutinms = 1000;
    var s3preferences = getS3Preferences();
    if (!empty(jobParameters.returnLabelLocalDirName)) {
        returnLabelLocalDirName = jobParameters.returnLabelDir;
    }
    if (!empty(jobParameters.returnLabelRemoteDirName)) {
        returnLabelRemoteDirName = jobParameters.returnLabelRemoteDirName;
    }
    if (!empty(jobParameters.awstimeoutinms)) {
        awstimeoutinms = jobParameters.awstimeoutinms;
    }
    var S3TransferClient = require('int_s3/cartridge/scripts/lib/S3TransferClient.js');
    transferClient = new S3TransferClient(
        s3preferences.bucketName,
        s3preferences.accessKey,
        s3preferences.secretAccessKey,
        s3preferences.region,
        '', // contentType is optional
        awstimeoutinms,
        returnLabelRemoteDirName
    );
    var failedRequests = [];
    try {
        if (returnLabelEmailRequests && returnLabelEmailRequests.getCount() > 0) {
            while (returnLabelEmailRequests.hasNext()) {
                Transaction.wrap(function () { // eslint-disable-line no-loop-func
                    returnLabelEmailRequestObj = returnLabelEmailRequests.next();
                    returnLabelEmailRequest = returnLabelEmailRequestObj.getCustom();
                    // Check if returnLabelUrl is empty(Not already generated) before processing it further
                    // This is an edge case, if the data was not deleted due to any issues/exception in SFCC service call during last run
                    // No need to upload the file again if "returnLabelUrl" is not null. Directly call SFMC to send return label email.
                    if (empty(returnLabelEmailRequest.returnLabelUrl) && !empty(returnLabelEmailRequest.rmaId) && !empty(returnLabelEmailRequest.sfmcData) && !empty(returnLabelEmailRequest.base64encodedFileData) && !empty(returnLabelEmailRequest.fileType)) {
                        fileName = 'label' + returnLabelEmailRequest.rmaId + '.' + returnLabelEmailRequest.fileType; // labelSMZU5X58E43ZKLJQLHP3.png or labelSMZU5X58E43ZKLJQLHP3.pdf
                        isFileUploaded = uploadFileToS3(returnLabelEmailRequest.base64encodedFileData, fileName);
                        if (isFileUploaded) {
                            logger.debug('File {0} uploaded to S3 successfully.', fileName);
                            if (returnLabelEmailRequest.customerNo) {
                                returnLabelUrl = URLUtils.abs('Order-PrintEmailLabel', 'rmaId', returnLabelEmailRequest.rmaId, 'customerNo', returnLabelEmailRequest.customerNo, 'fileType', returnLabelEmailRequest.fileType);
                            } else {
                                returnLabelUrl = transferClient.getPreSignedUrl(fileName, s3preferences.returnLabelUrlExpiry.toString());
                            }
                            // Save return label Url if there is any error in SFMC service call
                            returnLabelEmailRequest.returnLabelUrl = returnLabelUrl;
                        } else {
                            // if there is any error while uploading file to S3
                            failedRequests.push(returnLabelEmailRequest.rmaId);
                        }
                    }
                    // Call SFMC to trigger return label email
                    if (!empty(returnLabelEmailRequest.returnLabelUrl)) {
                        isEmailSent = triggerEmail(returnLabelEmailRequest.sfmcData, returnLabelEmailRequest.returnLabelUrl);
                        if (isEmailSent) {
                            logger.debug('Return label email triggered for rmaId : {0}', returnLabelEmailRequest.rmaId);
                            // delete processed custom object
                            CustomObjectMgr.remove(returnLabelEmailRequestObj);
                        }
                    }
                });
            }
        }
        if (failedRequests.length > 0) {
            logger.error('Error while uploading return label to s3. Please check the custom objects :: {0}', JSON.stringify(failedRequests));
            return new Status(Status.ERROR);
        }
    } catch (e) {
        logError(e);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
};
