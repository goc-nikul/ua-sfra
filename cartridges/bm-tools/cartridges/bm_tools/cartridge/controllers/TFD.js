'use strict';

/**
 * Controller that provides functions for browsing remote and local file systems.
 * It can also be used to add, copy and delete files.
 * @module controllers/TFD
 */
var KeyRef = require('dw/crypto/KeyRef');
var File = require('dw/io/File');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var Status = require('dw/system/Status');
var FTPClient = require('dw/net/FTPClient');
var SFTPClient = require('dw/net/SFTPClient');
var WebDAVClient = require('dw/net/WebDAVClient');
var URLUtils = require('dw/web/URLUtils');

var DirectoryAnalyzer = require('~/cartridge/scripts/directoryanalyzer/DirectoryAnalyzer');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Sorts files by name
 * @param {*} fileInfo1 The first file
 * @param {*} fileInfo2 The second file
 * @returns {number} The comparison result
 */
function sortFilesByName(fileInfo1, fileInfo2) {
    if (fileInfo1.name && fileInfo2.name) {
        if (fileInfo1.name > fileInfo2.name) {
            return 1;
        } else if (fileInfo1.name < fileInfo2.name) {
            return -1;
        }
        return 0;
    }
    return 0;
}

/**
 * Lists remote SFTP elements
 * @param {*} url The url
 * @param {*} remotePath The path
 * @param {*} user The user
 * @param {*} password The password
 * @param {string} keyAlias The key alias
 * @param {*} result The result object
 * @returns {dw.system.Status} The sttaus
 */
function listRemoteElementsSFTP(url, remotePath, user, password, keyAlias, result) {
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
    if (keyAlias != null) {
        sftpClient.setIdentity(KeyRef(keyAlias));
    }
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
        return new Status(Status.ERROR, 'ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + sftpClient.errorMessage);
    }
    try {
        var directoryInfo = sftpClient.getFileInfo(path);
        if (!directoryInfo) {
            return new Status(Status.ERROR, 'Directory ' + path + ' cannot be accessed!');
        } else if (!directoryInfo.directory) {
            return new Status(Status.ERROR, path + ' is not a directory!');
        }
        var fileInfos = sftpClient.list(path);
        if (fileInfos) {
            for (var fileInfoIndex = 0; fileInfoIndex < fileInfos.length; fileInfoIndex++) {
                var fileInfo = fileInfos[fileInfoIndex];
                if (fileInfo.name !== '.') {
                    var fileInfoSO = {};
                    fileInfoSO.name = fileInfo.name;
                    fileInfoSO.size = fileInfo.size;
                    fileInfoSO.lastModified = StringUtils.formatCalendar(new Calendar(fileInfo.modificationTime), 'dd.MM.yyyy HH:mm:ss');
                    fileInfoSO.path = directoryInfo.name;
                    if (fileInfo.directory) {
                        result.directories.push(fileInfoSO);
                    } else {
                        result.files.push(fileInfoSO);
                    }
                }
            }
        }
        return new Status(Status.OK, 'OK');
    } catch (e) {
        return new Status(Status.ERROR, e.message);
    } finally {
        if (sftpClient.connected) {
            sftpClient.disconnect();
        }
    }
}

/**
 * Lists remote FTP elements
 *
 * @param {*} url The url
 * @param {*} remotePath The remote path
 * @param {*} user The user
 * @param {*} password The password
 * @param {*} result The result
 * @returns {dw.system.Status} The status
 */
function listRemoteElementsFTP(url, remotePath, user, password, result) {
    // for FTP remoteLogin and remotePassword are required
    if (!user) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Parameter user empty (required for FTP)');
    }

    if (!password) {
        return new Status(Status.ERROR, 'ListRemoteFolder: Parameter password empty (required for FTP)');
    }

    // parse URL, e.g. "ftp://ftp.myserver.com:22/folder/"
    var params = /^ftp:\/\/([^/:]+)(?::(\d+))?(\/(?:.*\/)?)$/.exec(url);

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
        Logger.error('ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
        return new Status(Status.ERROR, 'ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ex);
    }

    if (!connected) {
        Logger.error('ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + ftpClient.replyMessage);
        return new Status(Status.ERROR, 'ListRemoteFolder: Error while connecting to ' + host + ((port != null) ? (':' + port) : '') + ': ' + (ftpClient.replyMessage ? ftpClient.replyMessage : ' timeout(??).'));
    }

    try {
        // return new Status( Status.ERROR, 'Please align FTP with SFTP functionality --> allow for relative paths!!');
        var fileInfos = ftpClient.list(path);
        if (ftpClient.replyCode !== 200 && ftpClient.replyCode !== 226) {
            return new Status(Status.ERROR, ftpClient.replyMessage);
        }
        var fileInfoSO = {};
        fileInfoSO.name = '..';
        fileInfoSO.size = '0';
        fileInfoSO.path = path;
        fileInfoSO.lastModified = StringUtils.formatCalendar(require('dw/system/Site').calendar, 'yyyy.MM.dd G HH:mm:ss z');
        result.directories.push(fileInfoSO);
        if (fileInfos) {
            for (var fileInfoIndex = 0; fileInfoIndex < fileInfos.length; fileInfoIndex++) {
                var fileInfo = fileInfos[fileInfoIndex];
                if (fileInfo.name !== '.') {
                    fileInfoSO = {};
                    fileInfoSO.name = fileInfo.name;
                    fileInfoSO.size = fileInfo.size;
                    fileInfoSO.path = path;
                    fileInfoSO.lastModified = StringUtils.formatCalendar(new Calendar(fileInfo.timestamp), 'yyyy.MM.dd G HH:mm:ss z');
                    if (fileInfo.directory) {
                        result.directories.push(fileInfoSO);
                    } else {
                        result.files.push(fileInfoSO);
                    }
                }
            }
        }
        return new Status(Status.OK, 'OK');
    } catch (e) {
        Logger.error('ListRemoteFolder: ' + e.message);
        return new Status(Status.ERROR, e.message);
    } finally {
        if (ftpClient.connected) {
            ftpClient.disconnect();
        }
    }
}

/**
 * Lists remote WebDAV elements
 * @param {*} url The url
 * @param {*} path The path
 * @param {*} user The user
 * @param {*} password The password
 * @param {*} result The result
 * @returns {dw.system.Status} The status
 */
function listRemoteElementsWebDAV(url, path, user, password, result) {
    var webDAVClient;
    var remoteFolderURL = (url + (path || '/')).replace(/\s/g, '%20');

    if (user && password) {
        // use authentication
        webDAVClient = new WebDAVClient(remoteFolderURL, user, password);
    } else {
        // no authentication
        webDAVClient = new WebDAVClient(remoteFolderURL);
    }

    var fileInfos;

    try {
        // remoteFolderURL already contains full reference to folder, no path to append, we pass ""
        // The default depth of 1 makes propfind return the current folder AND files in that folder.
        fileInfos = webDAVClient.propfind('');
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

    webDAVClient.close();
    var smallPath = path ? path.replace(/\//g, '') : '/';
    for (var fileInfoIndex = 0; fileInfoIndex < fileInfos.length; fileInfoIndex++) {
        var fileInfo = fileInfos[fileInfoIndex];
        if (!fileInfo.name && fileInfo.name !== '.') {
            var fileInfoSO = {};
            var smallInfoPath = fileInfo.path.replace(/\//g, '');
            if (smallInfoPath === smallPath) {
                fileInfoSO.name = '..';
            } else {
                fileInfoSO.name = fileInfo.name;
            }
            fileInfoSO.size = fileInfo.size;
            fileInfoSO.path = fileInfo.path;
            fileInfoSO.lastModified = StringUtils.formatCalendar(new Calendar(fileInfo.lastModified()), 'yyyy.MM.dd G HH:mm:ss z');
            if (fileInfo.directory) {
                result.directories.push(fileInfoSO);
            } else {
                result.files.push(fileInfoSO);
            }
        }
    }
    return new Status(Status.OK, 'OK');
}

/**
 * Renders the general TFD page.
 */
function start() {
    app.getView({
        mainmenuname: request.httpParameterMap.mainmenuname.value,
        CurrentMenuItemId: request.httpParameterMap.CurrentMenuItemId.value
    }).render('tfd/totalfiledemanderui');
}

/**
 * Renders the Local File System portion of the TFD page.
 */
function localFS() {
    var basePath = app.getForm('browselocal.basePath').value();
    var relativePath = app.getForm('browselocal.relativePath').value();
    var libraryID = app.getForm('browselocal.libraryID').value();
    var siteID = app.getForm('browselocal.siteID').value();
    var catalogID = app.getForm('browselocal.catalogID').value();
    var analyzeDirectory = app.getForm('browselocal.analyzeFolderSize').value();

    var pdict = {};

    if (!basePath) {
        Logger.error('BasePath not available');
        basePath = File.TEMP;
    }

    var absolutePath = basePath;

    if (basePath === 'LIBRARIES') {
        if (libraryID) {
            libraryID = libraryID.replace(/\//g, '');
            absolutePath += '/' + libraryID;
        }
    } else if (basePath === 'DYNAMIC') {
        if (siteID) {
            siteID = siteID.replace(/\//g, '');
            absolutePath += '/' + siteID;
        }
    } else if (basePath === 'CATALOGS') {
        if (catalogID) {
            catalogID = catalogID.replace(/\//g, '');
            absolutePath += '/' + catalogID;
        }
    }

    var status = null;
    if (relativePath) {
        absolutePath += relativePath;
    }

    var result = { directories: [], numberOfDirectories: 0, files: [], numberOfFiles: 0 };

    var directory = new File(absolutePath);

    if (!directory.exists()) {
        status = new Status(Status.ERROR, 'Directory \'' + absolutePath + '\' does not exist!');
    } else {
        var fileInfos = directory.listFiles();
        if (relativePath && relativePath.length > 1) {
            result.directories.push({ name: '..', size: 0, lastModified: StringUtils.formatDate(new Date(directory.lastModified()), 'dd.MM.yyyy HH:mm:ss') });
        }
        if (fileInfos) {
            for (var fileInfoIndex = 0; fileInfoIndex < fileInfos.length; fileInfoIndex++) {
                var fileInfo = fileInfos[fileInfoIndex];
                var fileInfoSO = {};
                fileInfoSO.name = fileInfo.name;
                fileInfoSO.size = fileInfo.length();
                fileInfoSO.lastModified = StringUtils.formatDate(new Date(fileInfo.lastModified()), 'dd.MM.yyyy HH:mm:ss');
                if (fileInfo.directory) {
                    // work around quota limitation
                    if (result.directories.length < 2000) {
                        result.directories.push(fileInfoSO);
                    }
                    result.numberOfDirectories++;
                } else {
                    // work around quota limitation
                    if (result.files.length < 2000) {
                        fileInfoSO.path = fileInfo.fullPath;
                        result.files.push(fileInfoSO);
                    }
                    result.numberOfFiles++;
                }
            }
        }
        result.directories.sort(sortFilesByName);
        result.files.sort(sortFilesByName);

        if (analyzeDirectory) {
            var directoryAnalyzer = new DirectoryAnalyzer(analyzeDirectory, directory);
            pdict.AnalyzerResult = directoryAnalyzer.generateReport();
        }
    }

    pdict.LocalObjectList = result;
    pdict.Status = status;

    app.getView(pdict).render('tfd/localfscontent');
}

/**
 * Clears the profile form and renders the addressdetails template.
 */
function remoteFS() {
    var password = app.getForm('browseremote.filesystem.password').value();
    var path = app.getForm('browseremote.filesystem.path').value();
    var url = app.getForm('browseremote.filesystem.url').value();
    var user = app.getForm('browseremote.filesystem.user').value();
    var key = app.getForm('browseremote.filesystem.key').value();

    var pdict = {};

    if (url.lastIndexOf('/') !== url.length - 1) {
        url += '/';
    }

    var status = null;

    if (!url) {
        status = new Status(Status.ERROR, 'URL not specified');
    } else {
        var result = { directories: [], files: [] };

        if (url.indexOf('sftp://') === 0) {
            status = listRemoteElementsSFTP(url, path, user, password, key, result);
        } else if (url.indexOf('ftp://') === 0) {
            status = listRemoteElementsFTP(url, path, user, password, result);
        } else {
            status = listRemoteElementsWebDAV(url, path, user, password, result);
        }
        result.directories.sort(sortFilesByName);
        result.files.sort(sortFilesByName);
        pdict.ObjectList = result;
    }
    pdict.Status = status;
    app.getView(pdict).render('tfd/remotefscontent');
}


/**
 * Uploads a file to the local file system.
 * @returns {*} The result
 */
function uploadFileToLocaleFS() {
    var currentHttpParameterMap = request.httpParameterMap;
    var fileMap = currentHttpParameterMap.processMultipart(function (field, contentType, fileName) {
        if (fileName == null || fileName === '') {
            return null;
        }
        return new File([File.TEMP, '/', fileName].join(''));
    });

    // nothing to do
    if (fileMap.size() < 1) {
        return 1; // PIPELET_NEXT = 1, PIPELET_ERROR = 2
    }

    var fileUploadTargetDirectory = currentHttpParameterMap.fileUploadTargetDirectory.value;
    var deleteFiles = false;
    if (!fileUploadTargetDirectory) {
        deleteFiles = true;
    }
    var targetDirectory = null;
    if (!deleteFiles) {
        targetDirectory = new File(fileUploadTargetDirectory);
        if (!targetDirectory.exists() || !targetDirectory.directory) {
            deleteFiles = true;
        }
    }
    var fileMapValueIterator = fileMap.values().iterator();
    if (!deleteFiles) {
        // rename files
        while (fileMapValueIterator.hasNext()) {
            var file = fileMapValueIterator.next();
            var newFilePath = fileUploadTargetDirectory + file.name;
            var newFile = new File(newFilePath);
            file.renameTo(newFile);
        }
    } else {
        while (fileMapValueIterator.hasNext()) {
            var file1 = fileMapValueIterator.next();
            file1.remove();
        }
    }

    var pdict = {};
    pdict.Location = URLUtils.https('TFD-Start');
    pdict.Location1 = URLUtils.https('TFD-Start', 'SelectedMenuItem', 'customadminmenuextension_tools', 'CurrentMenuItemId', 'customadminmenuextension_tools', 'menuname', 'Total File Demander', 'mainmenuname', 'Tool Box');
    app.getView(pdict).render('tfd/redirectAfterPost');
    return null;
}

/*
* Web exposed methods
*/
/** Renders the general TFD page
 * @see {@link module:controllers/TFD~start} */
exports.Start = guard.ensure(['get', 'https'], start);
/** Renders the Local File System portion of the TFD page.
 * @see {@link module:controllers/TFD~localFS} */
exports.LocalFS = guard.ensure(['https'], localFS);
/** Renders the Remote File System portion of the TFD page.
 * @see {@link module:controllers/TFD~remoteFS} */
exports.RemoteFS = guard.ensure(['https'], remoteFS);
/** Uploads a file.
 * @see {@link module:controllers/TFD~uploadFileToLocaleFS} */
exports.UploadFileToLocaleFS = guard.ensure(['post', 'https'], uploadFileToLocaleFS);

