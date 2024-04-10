'use strict';

/**
 * Controller that provides functions to perform operations on remote and local file systems.
 * @module controllers/TFD_JSON
 */
var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var FTPClient = require('dw/net/FTPClient');
var SFTPClient = require('dw/net/SFTPClient');
var WebDAVClient = require('dw/net/WebDAVClient');

/* Script Modules */
var guard = require('~/cartridge/scripts/guard');

var FILE_TRANSFER_ACTIONS = ['REMOTE2LOCAL', 'LOCAL2REMOTE'];

/**
 * Compresses a file. (Local file system)
 *
 * @param {dw.io.File} file The file
 * @returns {dw.system.Status} The status of the operation
 */
function zipFile(file) {
    if (file.name.toLowerCase().match(/.zip/)) {
        return new Status(Status.ERROR, 'An already compressed file will not be compressed again!');
    }
    var zipFileName = file.fullPath + '.zip';
    var targetFile = new File(zipFileName);
    try {
        file.zip(targetFile);
    } catch (e) {
        return new Status(Status.ERROR, 'Operation failed: ' + e);
    }

    return new Status(Status.OK, 'Operation successfully performed.');
}

/**
 * Uncompresses a file. (Local file system)
 *
 * @param {dw.io.File} file The file
 * @returns {dw.system.Status} The status of the operation
 */
function unzipFile(file) {
    if (!file.name.toLowerCase().match(/.zip/)) {
        return new Status(Status.ERROR, 'Only zip files can be decompressed!');
    }
    var filePath = file.fullPath;
    var rootDirectoryPath = filePath.substr(0, filePath.lastIndexOf('/'));
    var rootDirectory = new File(rootDirectoryPath);
    if (!rootDirectory.exists()) {
        return new Status(Status.ERROR, 'Root directory doesn\'t exist!');
    }
    try {
        file.unzip(rootDirectory);
    } catch (e) {
        return new Status(Status.ERROR, 'Operation failed: ' + e);
    }

    return new Status(Status.OK, 'Operation successfully performed.');
}

/**
 * Creates a new directory. (Local file system)
 * @param {dw.io.File} file The inobund directory
 * @param {string} directoryName The new directory name
 * @returns {dw.system.Status} The status of the operation
 */
function newDirectory(file, directoryName) {
    if (!file.directory) {
        return new Status(Status.ERROR, 'The base directory is not a directory');
    }
    var filePath = file.fullPath;
    var rootDirectoryPath = /\/\.*$|\/$/.test(filePath) ? filePath.substr(0, filePath.lastIndexOf('/')) : filePath;
    var newDirectoryPath = [rootDirectoryPath, directoryName].join(File.SEPARATOR);
    var targetDirectory = new File(newDirectoryPath);
    if (!targetDirectory.mkdirs()) {
        return new Status(Status.ERROR, 'Directory \'' + newDirectoryPath + '\' couldn\'t be created!');
    }

    return new Status(Status.OK, 'Operation successfully performed.');
}


/**
 * Deletes a file. (Local file system)
 * @param {dw.io.File} file The file
 * @returns {dw.system.Status} The status
 */
function deleteFile(file) {
    var systemFiles = ['/IMPEX/log'];
    if (systemFiles.indexOf(file.fullPath) !== -1) {
        return new Status(Status.ERROR, 'The file/directory you try to delete is required by the system and must not be deleted!');
    }
    try {
        var fileList = file.list();
        if (file.directory && fileList.length > 0) {
            for (var i = 0; i < fileList.length; i++) {
                var subFilePath = [file.fullPath, fileList[i]].join(File.SEPARATOR);
                var status = deleteFile(new File(subFilePath));
                if (status.error) {
                    return status;
                }
            }
            return deleteFile(file);
        } else if (!file.remove()) {
            return new Status(Status.ERROR, 'The file/directory \'' + file.fullPath + '\' couldn\'t be deleted!');
        }
    } catch (e) {
        return new Status(Status.ERROR, 'Operation failed: ' + e);
    }

    return new Status(Status.OK, 'Operation successfully performed.');
}

/**
 * Writes response object to the response.
 * @param {Object} pdict The pipeline dictionary
 */
function writeJSONResponse(pdict) {
    response.setContentType('application/json encoding=utf-8');
    var responseObject = { result: 'ok' };
    if (pdict && pdict.Status && pdict.Status.error) {
        responseObject.result = 'error';
        responseObject.message = pdict.Status.message ? pdict.Status.message : 'Operation failed!';
    }
    response.writer.write(JSON.stringify(responseObject));
}


/**
 * This function performs a file operation for a given file.
 * If the file doesn't exist or the operation failed, it takes the error exit.
 *
 * param {string} request.httpParameterMap.filePath 		- The relative path of the file in its context
 * param {string} request.httpParameterMap.context 		- The context of the file - IMPEX, LOGS, TEMP, etc.
 * param {string} request.httpParameterMap.siteID			- The Site ID which is required for library access
 * param {string} request.httpParameterMap.catalogID		- The Site ID which is required for library access
 * param {string} request.httpParameterMap.operation		- The operation that should be performed on the file - DELETE, ZIP, UNZIP
 * param {string} request.httpParameterMap.newDirectoryName - The name of the new directory
 */
function performLocalFileOperations() {
    var cvActions = ['DELETE', 'ZIP', 'UNZIP', 'NEWDIRECTORY'];
    var action = request.httpParameterMap.operation.value;
    var catalogID = request.httpParameterMap.catalogID.value;
    var context = request.httpParameterMap.context.value;
    var filePath = request.httpParameterMap.filePath.value;
    var newDirectoryName = request.httpParameterMap.newDirectoryName.value;
    var siteID = request.httpParameterMap.siteID.value;
    var libraryID = request.httpParameterMap.libraryID.value;

    var pdict = {};

    if (!filePath) {
        pdict.Status = new Status(Status.ERROR, 'No file path provided!');
    }
    if (!context) {
        pdict.Status = new Status(Status.ERROR, 'No file context provided!');
    }
    if (!action) {
        pdict.Status = new Status(Status.ERROR, 'No action provided! Please use \'DELETE\', \'ZIP\' or \'UNZIP\'.');
    }
    action = action.toUpperCase();
    if (cvActions.indexOf(action) === -1) {
        pdict.Status = new Status(Status.ERROR, 'Invalid action provided! Please use \'DELETE\', \'ZIP\' or \'UNZIP\'.');
    }

    if (!pdict.Status) {
        var fileFullPathArray = [context];
        if (context === 'LIBRARIES') {
            if (libraryID) {
                libraryID = libraryID.replace(/\//g, '');
                fileFullPathArray.push('/' + libraryID);
            }
        } else if (context === 'DYNAMIC') {
            if (siteID) {
                siteID = siteID.replace(/\//g, '');
                fileFullPathArray.push('/' + siteID);
            }
        } else if (context === 'CATALOGS') {
            if (catalogID) {
                catalogID = catalogID.replace(/\//g, '');
                fileFullPathArray.push('/' + catalogID);
            }
        }
        fileFullPathArray.push(filePath);

        var fileFullPath = fileFullPathArray.join('');
        var file = new File(fileFullPath);
        if (!file.exists()) {
            pdict.Status = new Status(Status.ERROR, 'The file \'' + fileFullPath + '\' does not exist!');
        } else {
            // start with the actual file handling
            switch (action) {
                case 'ZIP':
                    pdict.Status = zipFile(file);
                    break;
                case 'UNZIP':
                    pdict.Status = unzipFile(file);
                    break;
                case 'DELETE':
                    pdict.Status = deleteFile(file);
                    break;
                case 'NEWDIRECTORY':
                    pdict.Status = newDirectory(file, newDirectoryName);
                    break;
                default: break;
            }
        }
    }

    writeJSONResponse(pdict);
}

/**
 * Performes an operation against an SFTP server
 *
 * @param {string} action The action
 * @param {string} url The URL
 * @param {string} remotePath The remote path
 * @param {string} user The user
 * @param {string} password The password
 * @param {string} newDirectoryName The new directory name
 *
 * @returns {dw.system.Status} The status of the operation
 */
function performSFTPOperation(action, url, remotePath, user, password, newDirectoryName) {
    var supportedActions = ['DELETE', 'NEWDIRECTORY'];
    var currentAction = action;

    if (!currentAction) {
        return new Status(Status.ERROR, 'No action provided! Please use ' + supportedActions.join(', ') + '!');
    }

    currentAction = currentAction.toUpperCase();
    if (supportedActions.indexOf(currentAction) === -1) {
        return new Status(Status.ERROR, 'Invalid action provided! Please use ' + supportedActions.join(', ') + '!');
    }

    // for SFTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Parameter user empty (required for SFTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Parameter password empty (required for SFTP)');
    }

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    var params = /^sftp:\/\/([^/:]+)(?::(\d+))?(\/(?:.*\/)?)$/.exec(url);

    if (params == null || params.length < 3) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Parameter RemoteFolderURL not recognized, RemoteFolderURL: ' + url);
    }

    var host = params[1];
    var port = null;
    // params[2] is undefined if there was no port provided
    if (params[2] !== undefined) {
        port = Number.parseInt(params[2], 10);
    }
    var path = remotePath || '.';

    // connect
    var sftpClient = new SFTPClient();
    var connected;

    try {
        if (port != null) {
            connected = sftpClient.connect(host, port, user, password);
        } else {
            // use default port
            connected = sftpClient.connect(host, user, password);
        }
    } catch (ex) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + sftpClient.errorMessage);
    }
    try {
        switch (currentAction) {
            case 'DELETE':
                var fileInfo = sftpClient.getFileInfo(path);
                if (!fileInfo) {
                    return new Status(Status.ERROR, 'Directory/File cannot be accessed!');
                } else if (!fileInfo.directory) {
                    if (!sftpClient.del(path)) {
                        return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be deleted! Server Message:' + sftpClient.errorMessage);
                    }
                } else {
                    var fileInfos = sftpClient.list(path);
                    if (fileInfos) {
                        var currentPath = null;
                        for (var fileInfoIndex = 0; fileInfoIndex < fileInfos.length; fileInfoIndex++) {
                            fileInfo = fileInfos[fileInfoIndex];
                            if (fileInfo.name === '.' || fileInfo.name === '..') {
                                // do nothing
                            } else {
                                currentPath = [path, fileInfo.name].join('/');
                                if (fileInfo.directory) {
                                    var status = performSFTPOperation(action, url, currentPath, user, password);
                                    if (status.error) {
                                        return status;
                                    }
                                } else if (!sftpClient.del(currentPath)) {
                                    return new Status(Status.ERROR, 'The file/directory \'' + currentPath + '\' couldn\'t be deleted!');
                                }
                            }
                        }
                        if (!sftpClient.removeDirectory(path)) {
                            return new Status(Status.ERROR, 'The file/directory \'' + currentPath + '\' couldn\'t be deleted!');
                        }
                    }
                }
                return new Status(Status.OK, 'OK');
            case 'NEWDIRECTORY':
                if (!newDirectoryName) {
                    return new Status(Status.ERROR, 'Directory \'' + newDirectoryName + '\' couldn\'t be created!');
                }
                var targetFolderStr = remotePath + newDirectoryName;
                var targetFolderArray = targetFolderStr.split('/');

                for (var i = 0; i < targetFolderArray.length; i++) {
                    var dirExists = sftpClient.cd(targetFolderArray[i]);

                    if (!dirExists) {
                        sftpClient.mkdir(targetFolderArray[i]);
                        sftpClient.cd(targetFolderArray[i]);
                    }
                }
                return new Status(Status.OK, 'Operation successfully performed.');
            default: break;
        }
    } catch (e) {
        Logger.error('Perform Remote File Operation (SFTP): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        if (sftpClient.connected) {
            sftpClient.disconnect();
        }
    }
    return new Status(Status.OK, 'All set');
}

/**
 * Performes an operation against an FTP server
 *
 * @param {string} action The action
 * @param {string} url The URL
 * @param {string} remotePath The remote path
 * @param {string} user The user
 * @param {string} password The password
 * @param {string} newDirectoryName The new directory name
 *
 * @returns {dw.system.Status} The status of the operation
 */
function performFTPOperation(action, url, remotePath, user, password, newDirectoryName) {
    var supportedActions = ['DELETE', 'NEWDIRECTORY'];
    var currentAction = action;

    if (!currentAction) {
        return new Status(Status.ERROR, 'No action provided! Please use ' + supportedActions.join(', ') + '!');
    }

    currentAction = currentAction.toUpperCase();
    if (supportedActions.indexOf(currentAction) === -1) {
        return new Status(Status.ERROR, 'Invalid action provided! Please use ' + supportedActions.join(', ') + '!');
    }

    // for SFTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter user empty (required for SFTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter password empty (required for SFTP)');
    }

    // for FTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter user empty (required for FTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter password empty (required for FTP)');
    }

    // parse URL, e.g. "ftp://ftp.myserver.com:22/folder/"
    var params = /^ftp:\/\/([^/:]+)(?::(\d+))?(\/(?:.*\/)?)$/.exec(url);

    if (params == null || params.length < 3) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): File URL not recognized: ' + url);
    }

    var host = params[1];
    var port = null;
    // params[2] is undefined if there was no port provided
    if (params[2] !== undefined) {
        port = Number.parseInt(params[2], 10);
    }
    var path = remotePath || '.';

    // connect
    var ftpClient = new FTPClient();
    var connected;

    try {
        if (port != null) {
            connected = ftpClient.connect(host, port, user, password);
        } else {
            // use default port
            connected = ftpClient.connect(host, user, password);
        }
    } catch (ex) {
        Logger.error('Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        Logger.error('Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ftpClient.replyMessage);
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + (ftpClient.replyMessage ? ftpClient.replyMessage : ' timeout(??).'));
    }

    try {
        switch (currentAction) {
            case 'DELETE':
                var fileInfos = ftpClient.list(path);
                if (fileInfos.length > 0) {
                    var removeDirectory = false;
                    for (var fileInfoIndex = 0; fileInfoIndex < fileInfos.length; fileInfoIndex++) {
                        var fileInfo = fileInfos[fileInfoIndex];
                        var currentPath = [path, fileInfo.name].join('/');
                        if (fileInfo.directory) {
                            var status = performFTPOperation(action, url, currentPath, user, password);
                            if (status.error) {
                                return status;
                            }
                        } else {
                            removeDirectory = path !== fileInfo.name;
                            if (!ftpClient.del(path !== fileInfo.name ? currentPath : path)) {
                                return new Status(Status.ERROR, 'The file/directory \'' + fileInfo.name + '\' couldn\'t be deleted!');
                            }
                        }
                    }
                    if (removeDirectory && !ftpClient.removeDirectory(path)) {
                        return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be deleted!');
                    }
                } else
                    // assuming that this is an empty directory
                    if (!ftpClient.removeDirectory(path)) {
                        return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be deleted!');
                    }
                break;
            case 'NEWDIRECTORY':
                if (!newDirectoryName) {
                    return new Status(Status.ERROR, 'Directory \'' + newDirectoryName + '\' couldn\'t be created!');
                }
                var targetFolderStr = remotePath + newDirectoryName;
                var targetFolderArray = targetFolderStr.split('/');

                for (var i = 0; i < targetFolderArray.length; i++) {
                    var dirExists = ftpClient.cd(targetFolderArray[i]);

                    if (!dirExists) {
                        ftpClient.mkdir(targetFolderArray[i]);
                        ftpClient.cd(targetFolderArray[i]);
                    }
                }
                return new Status(Status.OK, 'Operation successfully performed.');
            default: break;
        }
        return new Status(Status.OK, 'OK');
    } catch (e) {
        Logger.error('Perform Remote File Operation (FTP): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        if (ftpClient.connected) {
            ftpClient.disconnect();
        }
    }
}

/**
 * Performes an operation against an WebDAV server
 *
 * @param {string} action The action
 * @param {string} url The URL
 * @param {string} path The remote path
 * @param {string} user The user
 * @param {string} password The password
 *
 * @returns {dw.system.Status} The status of the operation
 */
function performWebDAVOperation(action, url, path, user, password) {
    var supportedActions = ['DELETE'];
    var currentAction = action;

    if (!currentAction) {
        return new Status(Status.ERROR, 'No action provided! Please use ' + supportedActions.join(', ') + '!');
    }

    currentAction = currentAction.toUpperCase();
    if (supportedActions.indexOf(currentAction) === -1) {
        return new Status(Status.ERROR, 'Invalid action provided! Please use ' + supportedActions.join(', ') + '!');
    }

    var webDAVClient;
    var remoteFolderURL = (url + (path || '/')).replace(/\s/g, '%20');

    if (user && password) {
        // use authentication
        webDAVClient = new WebDAVClient(remoteFolderURL, user, password);
    } else {
        // no authentication
        webDAVClient = new WebDAVClient(remoteFolderURL);
    }

    try {
        // remoteFolderURL already contains full reference to folder, no path to append, we pass ""
        // The default depth of 1 makes propfind return the current folder AND files in that folder.
        webDAVClient.propfind('');
    } catch (ex) {
        Logger.error('DownloadFeed: Error while listing ' + remoteFolderURL + ': ' + ex);
        return new Status(Status.ERROR, 'DownloadFeed: Error while listing ' + remoteFolderURL + ': ' + ex);
    }

    if (!webDAVClient.succeeded()) {
        Logger.error('DownloadFeed: Error while listing ' + remoteFolderURL + ': ' +
            webDAVClient.statusCode + ' ' + webDAVClient.statusText);
        return new Status(Status.ERROR, 'DownloadFeed: Error while listing ' + remoteFolderURL + ': ' +
            webDAVClient.statusCode + ' ' + webDAVClient.statusText);
    }

    // actual action
    try {
        switch (currentAction) {
            case 'DELETE':
                if (!webDAVClient.del('')) {
                    return new Status(Status.ERROR, 'The file/directory \'' + remoteFolderURL + '\' couldn\'t be deleted!');
                }
                break;
            default: break;
        }
    } catch (e) {
        Logger.error('Perform Remote File Operation (WebDAV): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        webDAVClient.close();
    }
    return new Status(Status.OK, 'All set');
}


/**
 * This script performs a file operation for a given file.
 * If the file doesn't exist or the operation failed, it takes the error exit.
 *
 * param {string} request.httpParameterMap.url			- URL of remote location
 * param {string} request.httpParameterMap.path		- PATH of remote location
 * param {string} request.httpParameterMap.user		- Name of the user
 * param {string} request.httpParameterMap.password	- Password
 * param {string} request.httpParameterMap.action		- The operation that should be performed on the file - DELETE, ZIP, UNZIP
 * param {string} request.httpParameterMap.newDirectoryName 	- The name of the new directory
 */
function remoteFileOperations() {
    var url = request.httpParameterMap.url.value;
    var user = request.httpParameterMap.user.value;
    var password = request.httpParameterMap.password.value;
    var path = request.httpParameterMap.path.value;
    var action = request.httpParameterMap.operation.value;
    var newDirectoryName = request.httpParameterMap.newDirectoryName.value;

    var pdict = {};

    if (url.lastIndexOf('/') !== url.length - 1) {
        url += '/';
    }

    var status = null;

    if (!url) {
        status = new Status(Status.ERROR, 'URL not specified');
    } else if (url.indexOf('sftp://') === 0) {
        status = performSFTPOperation(action, url, path, user, password, newDirectoryName);
    } else if (url.indexOf('ftp://') === 0) {
        status = performFTPOperation(action, url, path, user, password, newDirectoryName);
    } else {
        status = performWebDAVOperation(action, url, path, user, password);
    }
    pdict.Status = status;

    writeJSONResponse(pdict);
}

/**
 * Performs an operation against an SFTP server
 *
 * @param {string} action The action
 * @param {string} url The URL
 * @param {string} remotePath The remote path
 * @param {string} user The user
 * @param {string} password The password
 * @param {string} directory The directory
 * @returns {dw.system.Status} The status of the operation
 */
function getSFTP(action, url, remotePath, user, password, directory) {
    if (!directory.directory) {
        return new Status(Status.ERROR, 'CopyData: Provided directory is not a directory.');
    }

    // for SFTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'CopyData: Parameter user empty (required for SFTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'CopyData: Parameter password empty (required for SFTP)');
    }

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    var params = /^sftp:\/\/([^/:]+)(?::(\d+))?(\/(?:.*\/)?)$/.exec(url);

    if (params == null || params.length < 3) {
        return new Status(Status.ERROR, 'CopyData: Parameter RemoteFolderURL not recognized, RemoteFolderURL: ' + url);
    }

    var host = params[1];
    var port = null;
    // params[2] is undefined if there was no port provided
    if (params[2] !== undefined) {
        port = Number.parseInt(params[2], 10);
    }
    var path = remotePath || '.';

    // connect
    var sftpClient = new SFTPClient();
    sftpClient.setTimeout(30000);
    var connected;

    try {
        if (port != null) {
            connected = sftpClient.connect(host, port, user, password);
        } else {
            // use default port
            connected = sftpClient.connect(host, user, password);
        }
    } catch (ex) {
        return new Status(Status.ERROR, 'CopyData: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        return new Status(Status.ERROR, 'CopyData: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + sftpClient.errorMessage);
    }
    try {
        var fileInfo = sftpClient.getFileInfo(path);
        if (!fileInfo) {
            return new Status(Status.ERROR, 'Directory/File cannot be accessed!');
        } else if (!fileInfo.directory) {
            var fileName = fileInfo.name;
            if (fileName.lastIndexOf('/') !== -1) {
                fileName = fileName.substr(fileName.lastIndexOf('/'));
            }
            fileName = [directory.fullPath, fileName].join(File.SEPARATOR);
            if (!sftpClient.getBinary(path, new File(fileName))) {
                return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be copied! Server Message:' + sftpClient.errorMessage);
            }
        }
        return new Status(Status.OK, 'OK');
    } catch (e) {
        Logger.error('Perform Remote File Operation (SFTP): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        if (sftpClient.connected) {
            sftpClient.disconnect();
        }
    }
}

/**
 * Uploads a file to the remote target directory
 *
 * @param {string} action The action
 * @param {string} url The url
 * @param {string} remotePath The remote path
 * @param {string} user The user
 * @param {string} password The password
 * @param {dw.io.File} file The file
 * @returns {dw.system.Status} The status of the operation
 */
function putSFTP(action, url, remotePath, user, password, file) {
    if (file.directory) {
        return new Status(Status.ERROR, 'CopyData: Provided file is a directory.');
    }

    // for SFTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'CopyData: Parameter user empty (required for SFTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'CopyData: Parameter password empty (required for SFTP)');
    }

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    var params = /^sftp:\/\/([^/:]+)(?::(\d+))?(\/(?:.*\/)?)$/.exec(url);

    if (params == null || params.length < 3) {
        return new Status(Status.ERROR, 'CopyData: Parameter RemoteFolderURL not recognized, RemoteFolderURL: ' + url);
    }

    var host = params[1];
    var port = null;
    // params[2] is undefined if there was no port provided
    if (params[2] !== undefined) {
        port = Number.parseInt(params[2], 10);
    }
    var path = remotePath || '.';

    // connect
    var sftpClient = new SFTPClient();
    var connected;

    try {
        if (port != null) {
            connected = sftpClient.connect(host, port, user, password);
        } else {
            // use default port
            connected = sftpClient.connect(host, user, password);
        }
    } catch (ex) {
        return new Status(Status.ERROR, 'CopyData: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        return new Status(Status.ERROR, 'CopyData: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + sftpClient.errorMessage);
    }
    try {
        var fileInfo = sftpClient.getFileInfo(path);
        if (!fileInfo) {
            return new Status(Status.ERROR, 'Directory cannot be accessed!');
        } else if (fileInfo.directory) {
            var fileName = file.name;
            var filePath = [path, fileName].join(File.SEPARATOR);
            if (!sftpClient.putBinary(filePath, file)) {
                return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be copied! Server Message:' + sftpClient.errorMessage);
            }
        } else {
            return new Status(Status.ERROR, 'Remote location is not a directory!');
        }
        return new Status(Status.OK, 'OK');
    } catch (e) {
        Logger.error('Perform Remote File Operation (SFTP): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        if (sftpClient.connected) {
            sftpClient.disconnect();
        }
    }
}

/**
* Downloads a file from the remote path
*
* @param {*} action The action
* @param {*} url The url
* @param {*} remotePath The remote path
* @param {*} user The user
* @param {*} password The password
* @param {*} directory The directory
* @returns {dw.system.Status} The status of the operation
*/
function getFTP(action, url, remotePath, user, password, directory) {
    if (!directory.directory) {
        return new Status(Status.ERROR, 'CopyData: Provided directory is not a directory.');
    }

    // for SFTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter user empty (required for SFTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter password empty (required for SFTP)');
    }

    // for FTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter user empty (required for FTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter password empty (required for FTP)');
    }

    // parse URL, e.g. "ftp://ftp.myserver.com:22/folder/"
    var params = /^ftp:\/\/([^/:]+)(?::(\d+))?(\/(?:.*\/)?)$/.exec(url);

    if (params == null || params.length < 3) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): File URL not recognized: ' + url);
    }

    var host = params[1];
    var port = null;
    // params[2] is undefined if there was no port provided
    if (params[2] !== undefined) {
        port = Number.parseInt(params[2], 10);
    }
    var path = remotePath || '.';

    // connect
    var ftpClient = new FTPClient();
    ftpClient.setTimeout(30000);
    var connected;

    try {
        if (port != null) {
            connected = ftpClient.connect(host, port, user, password);
        } else {
            // use default port
            connected = ftpClient.connect(host, user, password);
        }
    } catch (ex) {
        Logger.error('Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        Logger.error('Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ftpClient.replyMessage);
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + (ftpClient.replyMessage ? ftpClient.replyMessage : ' timeout(??).'));
    }

    try {
        var fileInfos = ftpClient.list(path);
        var fileName;
        if (fileInfos.length === 0) {
            fileName = path;
            fileName = fileName.substr(fileName.lastIndexOf('/'));
            fileName = [directory.fullPath, fileName].join(File.SEPARATOR);
            if (!ftpClient.getBinary(path, new File(fileName))) {
                return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be copied! Server Message:' + ftpClient.replyMessage);
            }
        } else if (fileInfos.length === 1) {
            fileName = fileInfos[0].name;
            if (fileName.lastIndexOf('/') !== -1) {
                fileName = fileName.substr(fileName.lastIndexOf('/'));
            }
            fileName = [directory.fullPath, fileName].join(File.SEPARATOR);
            if (!ftpClient.getBinary(path, new File(fileName))) {
                return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be copied! Server Message:' + ftpClient.replyMessage);
            }
        }
        return new Status(Status.OK, 'OK');
    } catch (e) {
        Logger.error('Perform Remote File Operation (FTP): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        if (ftpClient.connected) {
            ftpClient.disconnect();
        }
    }
}

/**
 * Puts a file onto the WebDAV server
 * @param {string} action The action
 * @param {string} url The url
 * @param {string} remotePath The remote path
 * @param {string} user The user
 * @param {string} password The password
 * @param {dw.io.File} file The file
 * @returns {dw.system.Status} The status
 */
function putFTP(action, url, remotePath, user, password, file) {
    if (file.directory) {
        return new Status(Status.ERROR, 'CopyData: Provided file is a directory.');
    }

    // for SFTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter user empty (required for SFTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter password empty (required for SFTP)');
    }

    // for FTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter user empty (required for FTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Parameter password empty (required for FTP)');
    }

    // parse URL, e.g. "ftp://ftp.myserver.com:22/folder/"
    var params = /^ftp:\/\/([^/:]+)(?::(\d+))?(\/(?:.*\/)?)$/.exec(url);

    if (params == null || params.length < 3) {
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): File URL not recognized: ' + url);
    }

    var host = params[1];
    var port = null;
    // params[2] is undefined if there was no port provided
    if (params[2] !== undefined) {
        port = Number.parseInt(params[2], 10);
    }
    var path = remotePath || '.';

    // connect
    var ftpClient = new FTPClient();
    var connected;

    try {
        if (port != null) {
            connected = ftpClient.connect(host, port, user, password);
        } else {
            // use default port
            connected = ftpClient.connect(host, user, password);
        }
    } catch (ex) {
        Logger.error('Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        Logger.error('Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ftpClient.replyMessage);
        return new Status(Status.ERROR, 'Perform Remote File Operation (FTP): Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + (ftpClient.replyMessage ? ftpClient.replyMessage : ' timeout(??).'));
    }

    try {
        var fileName = file.name;
        var filePath = [path, fileName].join(File.SEPARATOR);
        if (!ftpClient.putBinary(filePath, file)) {
            return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be copied! Server Message:' + ftpClient.replyMessage);
        }
        return new Status(Status.OK, 'OK');
    } catch (e) {
        Logger.error('Perform Remote File Operation (FTP): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        if (ftpClient.connected) {
            ftpClient.disconnect();
        }
    }
}

/**
 * Performas an operation against WebDAV
 * @param {string} action The action
 * @param {string} url The url
 * @param {string} path The path
 * @param {string} user The user
 * @param {string} password The password
 * @param {string} directory The directory
 * @returns {dw.system.Status} The status
 */
function getWebDAV(action, url, path, user, password, directory) {
    if (!directory.directory) {
        return new Status(Status.ERROR, 'CopyData: Provided directory is not a directory.');
    }

    var webDAVClient;
    var remoteFolderURL = (url + (path || '/')).replace(/\s/g, '%20');

    if (user && password) {
        // use authentication
        webDAVClient = new WebDAVClient(remoteFolderURL, user, password);
    } else {
        // no authentication
        webDAVClient = new WebDAVClient(remoteFolderURL);
    }

    try {
        // remoteFolderURL already contains full reference to folder, no path to append, we pass ""
        // The default depth of 1 makes propfind return the current folder AND files in that folder.
        webDAVClient.propfind('');
    } catch (ex) {
        Logger.error('DownloadFeed: Error while listing ' + remoteFolderURL + ': ' + ex);
        return new Status(Status.ERROR, 'DownloadFeed: Error while listing ' + remoteFolderURL + ': ' + ex);
    }

    if (!webDAVClient.succeeded()) {
        Logger.error('DownloadFeed: Error while listing ' + remoteFolderURL + ': ' +
            webDAVClient.statusCode + ' ' + webDAVClient.statusText);
        return new Status(Status.ERROR, 'DownloadFeed: Error while listing ' + remoteFolderURL + ': ' +
            webDAVClient.statusCode + ' ' + webDAVClient.statusText);
    }

    // actual action
    try {
        var fileName = path.split(File.SEPARATOR);
        fileName = fileName[fileName.length - 1];// .replace(/\s/g, '%20');
        fileName = [directory.fullPath, fileName].join(File.SEPARATOR);
        if (!webDAVClient.getBinary(path, new File(fileName))) {
            return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be copied! Server Message:' + webDAVClient.statusCode + ' - ' + webDAVClient.statusText);
        }
    } catch (e) {
        Logger.error('Perform Remote File Operation (WebDAV): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        webDAVClient.close();
    }
    return new Status(Status.OK, 'All set');
}

/**
 * Puts a file on a remote server
 *
 * @param {string} action The action
 * @param {string} url The url
 * @param {string} path The path
 * @param {string} user The user
 * @param {string} password The password
 * @param {dw.io.File} file The file
 * @returns {dw.system.Status} The status
 */
function putWebDAV(action, url, path, user, password, file) {
    if (file.directory) {
        return new Status(Status.ERROR, 'CopyData: Provided file is a directory.');
    }

    var webDAVClient;
    var remoteFolderURL = (url + (path || '/')).replace(/\s/g, '%20');

    if (user && password) {
        // use authentication
        webDAVClient = new WebDAVClient(remoteFolderURL, user, password);
    } else {
        // no authentication
        webDAVClient = new WebDAVClient(remoteFolderURL);
    }

    try {
        // remoteFolderURL already contains full reference to folder, no path to append, we pass ""
        // The default depth of 1 makes propfind return the current folder AND files in that folder.
        webDAVClient.propfind('');
    } catch (ex) {
        Logger.error('DownloadFeed: Error while listing ' + remoteFolderURL + ': ' + ex);
        return new Status(Status.ERROR, 'DownloadFeed: Error while listing ' + remoteFolderURL + ': ' + ex);
    }

    if (!webDAVClient.succeeded()) {
        Logger.error('DownloadFeed: Error while listing ' + remoteFolderURL + ': ' +
            webDAVClient.statusCode + ' ' + webDAVClient.statusText);
        return new Status(Status.ERROR, 'DownloadFeed: Error while listing ' + remoteFolderURL + ': ' +
            webDAVClient.statusCode + ' ' + webDAVClient.statusText);
    }

    // actual action
    try {
        var fileName = file.name.replace(/\s/g, '%20');
        if (!webDAVClient.put(fileName, file)) {
            return new Status(Status.ERROR, 'The file/directory \'' + path + '\' couldn\'t be copied! Server Message:' + webDAVClient.statusCode + ' - ' + webDAVClient.statusText);
        }
    } catch (e) {
        Logger.error('Perform Remote File Operation (WebDAV): ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        webDAVClient.close();
    }
    return new Status(Status.OK, 'All set');
}

/**
 * This function copies data from local file system to a remote location of remote files to the local file system.
 *
 * param {string} request.httpParameterMap.catalogID	- The Site ID which is required for library access
 * param {string} request.httpParameterMap.context		- The context of the file - IMPEX, LOGS, TEMP, etc.
 * param {string} request.httpParameterMap.filePath	- The relative path of the file in its context
 * param {string} request.httpParameterMap.operation	- The operation that should be performed on the file - DELETE, ZIP, UNZIP
 * param {string} request.httpParameterMap.password 	- Password
 * param {string} request.httpParameterMap.path 		- PATH of remote location
 * param {string} request.httpParameterMap.siteID		- The Site ID which is required for library access
 * param {string} request.httpParameterMap.url 		- URL of remote location
 * param {string} request.httpParameterMap.user		- Name of the user
 */
function copyLocal2Remote() {
    var action = request.httpParameterMap.operation.value;
    var catalogID = request.httpParameterMap.catalogID.value;
    var context = request.httpParameterMap.context.value;
    var filePath = request.httpParameterMap.filePath.value;
    var password = request.httpParameterMap.password.value;
    var path = request.httpParameterMap.path.value;
    var siteID = request.httpParameterMap.siteID.value;
    var libraryID = request.httpParameterMap.libraryID.value;
    var url = request.httpParameterMap.url.value;
    var user = request.httpParameterMap.user.value;

    var pdict = {};

    if (!filePath) {
        pdict.Status = new Status(Status.ERROR, 'No file path provided!');
    } else if (!context) {
        pdict.Status = new Status(Status.ERROR, 'No file context provided!');
    } else if (!action) {
        pdict.Status = new Status(Status.ERROR, 'No action provided! Please use \'DELETE\', \'ZIP\' or \'UNZIP\'.');
    }

    action = action.toUpperCase();
    if (FILE_TRANSFER_ACTIONS.indexOf(action) === -1) {
        pdict.Status = new Status(Status.ERROR, 'Invalid action provided! Please use \'DELETE\', \'ZIP\' or \'UNZIP\'.');
    } else {
        var fileFullPathArray = [context];
        if (context === 'LIBRARIES') {
            if (libraryID) {
                libraryID = libraryID.replace(/\//g, '');
                fileFullPathArray.push('/' + libraryID);
            }
        } else if (context === 'DYNAMIC') {
            if (siteID) {
                siteID = siteID.replace(/\//g, '');
                fileFullPathArray.push('/' + siteID);
            }
        } else if (context === 'CATALOGS') {
            if (catalogID) {
                catalogID = catalogID.replace(/\//g, '');
                fileFullPathArray.push('/' + catalogID);
            }
        }
        fileFullPathArray.push(filePath);

        var fileFullPath = fileFullPathArray.join('');
        var file = new File(fileFullPath);
        if (!file.exists()) {
            pdict.Status = new Status(Status.ERROR, 'The file \'' + fileFullPath + '\' does not exist!');
        } else {
            if (url.lastIndexOf('/') !== url.length - 1) {
                url += '/';
            }

            if (!url) {
                pdict.Status = new Status(Status.ERROR, 'URL not specified');
            } else {
                switch (action) {
                    case 'REMOTE2LOCAL':
                        if (url.indexOf('sftp://') === 0) {
                            pdict.Status = getSFTP(action, url, path, user, password, file);
                        } else if (url.indexOf('ftp://') === 0) {
                            pdict.Status = getFTP(action, url, path, user, password, file);
                        } else {
                            pdict.Status = getWebDAV(action, url, path, user, password, file);
                        }
                        break;
                    case 'LOCAL2REMOTE':
                        if (url.indexOf('sftp://') === 0) {
                            pdict.Status = putSFTP(action, url, path, user, password, file);
                        } else if (url.indexOf('ftp://') === 0) {
                            pdict.Status = putFTP(action, url, path, user, password, file);
                        } else {
                            pdict.Status = putWebDAV(action, url, path, user, password, file);
                        }
                        break;
                    default: break;
                }
            }
        }
    }
    writeJSONResponse(pdict);
}


/** ###### HELPER FUNCTIONS ######## **/

/*
* Web exposed methods
*/
/** Performs local server file system operations
 * @see {@link module:controllers/TFD_JSON~localFileOperations} */
exports.LocalFileOperations = guard.ensure(['https'], performLocalFileOperations);

/** Performs remote server file system operations
 * @see {@link module:controllers/TFD_JSON~remoteFileOperations} */
exports.RemoteFileOperations = guard.ensure(['https'], remoteFileOperations);

/** Copies files from local to remote server and vice versa
 * @see {@link module:controllers/TFD_JSON~copyLocal2Remote} */
exports.Copy = guard.ensure(['https'], copyLocal2Remote);
