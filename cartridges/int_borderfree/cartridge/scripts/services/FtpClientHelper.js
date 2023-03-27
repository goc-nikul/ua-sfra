'use strict';

/**
 * (S)FTP service methods (to download and upload files)
 *
 * @module scripts/services/FtpClientHelper
 */

var File = require('dw/io/File');
var Logger = require('dw/system/Logger');

var FileHelper = require('~/cartridge/scripts/file/FileHelper');

var DownloadLogger = Logger.getLogger('cs.job.FtpDownload');
var UploadLogger = Logger.getLogger('cs.job.FtpUpload');

/**
 * Holds the constructor of the FtpClientHelper
 *
 * @constructor
 *
 * @param {dw.svc.Service} service The service instance to use.
 */
function FtpClientHelper(service) {
    this.service = service;
}

/**
 * Removes a file from the SFTP server.
 *
 * @param {string} remoteFilePath The full remote file path of the file to delete.
 *
 * @throws {Error} If file could not be deleted.
 */
FtpClientHelper.prototype.removeRemoteFile = function (remoteFilePath) {
    DownloadLogger.info('Removing {0}...', remoteFilePath);

    var serviceResult = this.service.call('del', remoteFilePath);
    var isRemoveSuccessful = serviceResult.getObject();
    if (!serviceResult.isOk() || !isRemoveSuccessful) {
        throw new Error('SFTP Service: couldn\'t remove file: ' + remoteFilePath + ' error: ' + serviceResult.getErrorMessage());
    }

    DownloadLogger.info('File {0} successfully removed.', remoteFilePath);
};

/**
 * Downloads a file from the SFTP server to the provided file.
 *
 * @param {string} remoteFilePath The full remote file path of the file to download.
 * @param {dw.io.File} file The file to download to.
 *
 * @throws {Error} If file could not be downloaded.
 */
FtpClientHelper.prototype.downloadFile = function (remoteFilePath, file) {
    DownloadLogger.info('Downloading {0} to {1}...', remoteFilePath, file.getFullPath());

    var serviceResult = this.service.call('getBinary', remoteFilePath, file);
    var isDownloadSuccessful = serviceResult.getObject();
    if (!serviceResult.isOk() || !isDownloadSuccessful) {
        throw new Error('SFTP Service: couldn\'t download file: ' + remoteFilePath + ' error: ' + serviceResult.getErrorMessage());
    }

    DownloadLogger.info('File {0} successfully downloaded.', remoteFilePath);
};

/**
 * Change the CWD on the FTP Server. Creates directory if missing (but not parent folders)
 *
 * @param {string} targetFolder The target folder
 */
FtpClientHelper.prototype.enterDirectory = function (targetFolder) {
    var targetFolderStr = targetFolder.charAt(0) === File.SEPARATOR ? targetFolder.substring(1) : targetFolder;

    var dirExists = this.service.call('cd', targetFolderStr);
    if (!dirExists) {
        UploadLogger.info('Directory "{0}" does not exist. Creating...', targetFolderStr);
        this.service.call('mkdir', targetFolderStr);
        var cdSuccess = this.service.call('cd', targetFolderStr);

        if (!cdSuccess) {
            throw new Error('Could not change to target folder. Please check if folder or parent folders exist on the remote server.');
        }
    }
};

/**
 * Copy (and archive locally) a file to the remote FTP-Target-Folder
 *
 * @param {string} targetFolder The full remote file path where to upload the file.
 * @param {dw.io.File} file The file to copy
 * @param {boolean} archiveFolder The archive folder where to move file after a successful upload
 *
 * @throws {Error} If file could not be uploaded.
 */
FtpClientHelper.prototype.uploadFile = function (targetFolder, file, archiveFolder) {
    var remoteFilePath = targetFolder + file.getName();
    UploadLogger.info('Uploading {0} to {1}...', file, remoteFilePath);
    var serv = this.service;
    var serviceResult = this.service.call('putBinary', remoteFilePath, file);
    var isUploadSuccessful = serviceResult.getObject();
    if (!serviceResult.isOk() || !isUploadSuccessful) {
        throw new Error('SFTP Service: couldn\'t upload file: ' + file.getFullPath() + ' error: ' + serviceResult.getErrorMessage());
    }
    UploadLogger.info('File {0} successfully uploaded.', remoteFilePath);

    if (!empty(archiveFolder)) {
        var theArchiveFile = new File(archiveFolder + File.SEPARATOR + file.getName());
        file.renameTo(theArchiveFile);
    }
};

/**
 * Returns an array of file paths on the SFTP, filtered by file pattern and sorted by modified time.
 *
 * @param {string} remoteDirectoryPath The directory path on the remote server.
 * @param {string} filePattern File pattern to match against.
 *
 * @throws {Error} If cannot list remote files.
 *
 * @returns {Array} Array with full paths of the remote files or null if an error occurred.
 */
FtpClientHelper.prototype.listRemoteFiles = function (remoteDirectoryPath, filePattern) {
    var sftpFileInfoList;

    // get file information from remote folder
    var serviceResult = this.service.call('list', remoteDirectoryPath);
    if (serviceResult.isOk()) {
        sftpFileInfoList = serviceResult.getObject();
    } else {
        throw new Error('SFTP Service: couldn\'t list files: ' + serviceResult.getErrorMessage());
    }

    // filter out files which match the file pattern
    sftpFileInfoList = sftpFileInfoList.filter(function (file) {
        return empty(filePattern) || (!empty(filePattern) && file.getName().match(filePattern) !== null);
    });

    // map to full file paths
    var filePaths = sftpFileInfoList.map(function (file) {
        return (remoteDirectoryPath.charAt(remoteDirectoryPath.length - 1).equals(File.SEPARATOR) ? remoteDirectoryPath : remoteDirectoryPath + File.SEPARATOR) + file.getName();
    });

    return filePaths;
};

/**
 * Downloads files from the remote SFTP server to the specified directory.
 * Optionally removes downloaded files from the remote SFTP server.
 *
 * @param {Array} remoteFilePaths Array with full file paths on the remote SFTP server.
 * @param {string} localDirectoryPath Directory path on our server e.g. '/IMPEX/src/' to put the files in.
 * @param {boolean} deleteRemoteFiles Indicates if downloaded files should be removed from the SFTP server.
 */
FtpClientHelper.prototype.downloadFiles = function (remoteFilePaths, localDirectoryPath, deleteRemoteFiles) {
    var self = this;
    var impexPath = File.IMPEX + (localDirectoryPath.charAt(0).equals(File.SEPARATOR) ? localDirectoryPath : File.SEPARATOR + localDirectoryPath);
    var finalPath = (impexPath.charAt(impexPath.length - 1).equals(File.SEPARATOR) ? impexPath : impexPath + File.SEPARATOR);
    FileHelper.createDirectory(finalPath);

    remoteFilePaths.forEach(function (remoteFilePath) {
        var fileName = FileHelper.getFileName(remoteFilePath);
        var filePath = finalPath + fileName;
        var file = new File(filePath);

        self.downloadFile(remoteFilePath, file);

        if (!empty(deleteRemoteFiles) && deleteRemoteFiles === true) {
            self.removeRemoteFile(remoteFilePath);
        }
    });
};

/**
 * Copy (and archive locally) files to the remote FTP-Target-Folder
 *
 * @param {Array} fileList The list of files to upload.
 * @param {string} targetFolder The full remote file path where to upload the file.
 * @param {boolean} archiveFolder The archive folder where to move file after a successful upload
 *
 * @returns {boolean} returns True of files were found at the specified location.
 */
FtpClientHelper.prototype.uploadFiles = function (fileList, targetFolder, archiveFolder) {
    var self = this;
    var archiveFolderPath;

    if (!empty(archiveFolder)) {
        archiveFolderPath = File.IMPEX + (archiveFolder.charAt(0).equals(File.SEPARATOR) ? archiveFolder : File.SEPARATOR + archiveFolder);
        FileHelper.createDirectory(archiveFolderPath);
    }

    var targetFolderPath = targetFolder.charAt(targetFolder.length - 1).equals(File.SEPARATOR) ? targetFolder : targetFolder + File.SEPARATOR;

    // Try to enter in the directory
    // If this task fails, this means that we cannot create the target folder if it does not exists.
    // It will throw an error and abort the step.
    this.enterDirectory(targetFolderPath);

    fileList.forEach(function (file) {
        self.uploadFile(targetFolderPath, new File(file), archiveFolderPath);
    });

    return true;
};

module.exports = FtpClientHelper;
