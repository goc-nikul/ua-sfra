'use strict';

var Status = require('dw/system/Status');
var Logger =  require('dw/system/Logger').getLogger('bm_socialfeeds', 'OCI:export');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var config = require('*/cartridge/scripts/oci/oci.config');
var cache = require('dw/system/CacheMgr').getCache(config.customCacheID);
var ServiceMgr = require('*/cartridge/scripts/oci/services/ServiceMgr');

/**
 * Initiates OCI Inventory Export
 * @param {Array} args job arguments
 * @param {String} args.LocationIds Represents the comma separated Location Ids
 * @param {Number} args.LocationGroupIds Represents the comma separated Location Group Ids
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.trigger = function (args) {
    var token,
        locIds,
        locGroupIds,
        fullExportService,
        payload,
        result,
        cache;

    if (!(args.LocationIds || args.LocationGroupIds)) {
        Logger.error("Both LocationIds and LocationGraphIds can't be empty");
        return new Status(Status.ERROR, 'ERROR', 'Input Error');
    }
    try {
        token = require('*/cartridge/scripts/oci/util/helpers').getAccessToken();
    } catch(e) {
        Logger.error("Error retriving the access token:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }
    
    locIds = args.LocationIds && args.LocationIds.split(",");
    locGroupIds = args.LocationGroupIds && args.LocationGroupIds.split(",");
    fullExportService = ServiceMgr.getFullExportService();
    cache = require('dw/system/CacheMgr').getCache(config.customCacheID);

    //clear the cache from existing value.
    cache.invalidate(config.cacheKeys.locations);
    cache.invalidate(config.cacheKeys.groups);

    try {
        if (locIds && locIds.length > 0) {
            payload = {
                "objects": {
                    "locations": locIds
                }
            }
            result = fullExportService.call({
                token: token,
                body: payload
            });
            if (result.status === 'OK' && !empty(result.object)) {
                // save the response in custom cache
                cache.put(config.cacheKeys.locations, result.object);
            }
            
        }
        if (locGroupIds && locGroupIds.length > 0) {
            payload = {
                "objects": {
                    "groups": locGroupIds
                }
            }
            result = fullExportService.call({
                token: token,
                body: payload
            });
            if (result.status === 'OK' && !empty(result.object)) {
                // save the response in custom cache
                cache.put(config.cacheKeys.groups, result.object);
            }
        }
    } catch(e) {
        Logger.error("Error triggerring the export:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Exception in Export Trigger');
    }
    var groupCache = cache.get(config.cacheKeys.groups);
    Logger.error(groupCache);
    return new Status(Status.OK, 'OK', 'Export Triggered');
};

/**
 * Downloads OCI Inventory Export after it has been triggered
 * @param {Array} args job arguments
 * @param {String} args.FolderPath folder path
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.download = function (args) {
    var token,
        result,
        locationCache,
        groupCache,
        file;
    try {
        token = require('*/cartridge/scripts/oci/util/helpers').getAccessToken();
        
        // get the export status links from the cache
        
        locationCache = cache.get(config.cacheKeys.locations);
        groupCache = cache.get(config.cacheKeys.groups);

        if(!(locationCache || groupCache)) { //if there is no running export job, error out
            Logger.error("No OCI export is running. Please initiate an export first.");
            return new Status(Status.ERROR, 'ERROR', 'No Inventory Available to Download');
        }

        if(locationCache && locationCache.exportStatusLink) {
            file = createFile(args.FolderPath, config.filenames.locations);
            result = downloadInventory(token, locationCache.exportStatusLink, file);
            if(result) {
                retriveAndSaveDeltaToken(file, config.cacheKeys.deltaTokenLocations);
            }
        }

        if(groupCache && groupCache.exportStatusLink) {
            file = createFile(args.FolderPath, config.filenames.groups);
            result = downloadInventory(token, groupCache.exportStatusLink, file);
            if(result) {
                retriveAndSaveDeltaToken(file, config.cacheKeys.deltaTokenGroups);
            }
        }
    } catch(e) {
        Logger.error("Error downloading the inventory file:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Inventory Download Error');
    }

    if(!result) {
        return new Status(Status.ERROR, 'ERROR', 'Exception in Inventory Download');
    }

    return new Status(Status.OK, 'OK', 'File(s) downloaded and saved');
}

/**
 * Downloads OCI delta Inventory Export using the token stored in the CacheMgr
 * @param {Array} args job arguments
 * @param {String} args.FolderPath folder path
 * @returns {dw.system.Status} Exit status for a job run
 */
exports.delta = function (args) {
    var deltaTokenLocations,
        deltaTokenGroups,
        token,
        result;
    deltaTokenLocations = cache.get(config.cacheKeys.deltaTokenLocations);
    deltaTokenGroups = cache.get(config.cacheKeys.deltaTokenGroups);
    if(!deltaTokenLocations && !deltaTokenGroups) {
        Logger.error("Delta Tokens not available in the cache");
        return new Status(Status.ERROR, 'ERROR', 'Inventory Download Error');
    }

    try {
        token = require('*/cartridge/scripts/oci/util/helpers').getAccessToken();
    } catch(e) {
        Logger.error("Error retriving the access token:" + e);
        return new Status(Status.ERROR, 'ERROR', 'Access Token Error');
    }

    if(deltaTokenLocations) {
        result = saveDeltaFeed(args.FolderPath, config.filenames.deltaLocations, token, deltaTokenLocations, config.cacheKeys.deltaTokenLocations);
    }

    if(deltaTokenGroups) {
        result = saveDeltaFeed(args.FolderPath, config.filenames.deltaGroups, token, deltaTokenGroups, config.cacheKeys.deltaTokenGroups);
    }
    
    if(!result) {
        return new Status(Status.ERROR, 'ERROR', 'Exception in Inventory Download');
    }

    return new Status(Status.OK, 'OK', 'File(s) downloaded and saved');
}

/**
 * Calls OCI API to save the full export feed as file
 * @param {String} token Access token
 * @param {String} exportStatusLink Export link to the running export job
 * @param {dw.io.File} file file to save the inventory
 * @returns {Boolean} returns true or false based on download operation was successful or not
 */
function downloadInventory(token, exportStatusLink, file) {
    var downloadService,
        result,
        fileLink,
        response;

    downloadService = ServiceMgr.getDownloadService();
    result = downloadService.call({
        token: token,
        path: exportStatusLink
    });
    if (result.status === 'OK' && !empty(result.object)) {
        if(result.object.status !== 'COMPLETED') {
            Logger.info("Error downloading the inventory file. Export is still running");
            return false;
            //return new Status(Status.ERROR, 'WARN', 'Inventory Export has not finished. Rerun the download job in few minutes');
        } else {
            fileLink = result.object.download.downloadLink;
            response = downloadService.call({
                token: token,
                path: fileLink,
                file: file
            });
            if(response.status === 'OK') {
                return true;
            }
        }

    }
    Logger.error("Error downloading the inventory file. Export is still running");
    return false;
}


/**
 * Creates a file to store inventory
 * @param {String} folderPath Folder where the file should be created
 * @param {String} filename filename
 * @returns {dw.io.File} returns undefined or the created empty file
 */
function createFile(folderPath, filename) {
    var file,
        dir,
        folder;

    if(folderPath.charAt( 0 ) === File.SEPARATOR) {
        dir = folderPath.slice(1);
    } else {
        dir = folderPath;
    }
    dir = File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + dir;
    folder = new File(dir);
    if(!folder.exists() && !folder.mkdirs()){
        Logger.error('Could not create folder: '+ folderPath);
    }

    if(filename.indexOf("_timestamp_") > -1) {
        filename = filename.replace(/_timestamp_/, Date.now());
    }
    file = new File(folder, filename);
    return file;
}

/**
 * Retrieve and Save Delta Token into Custom Cache
 * @param {dw.io.File} file file to retrieve the deltaToken
 * @param {String} cacheKey cacheKey to store the deltaToken
 * @returns {Boolean} return true or false if operation is successful or not
 */
function retriveAndSaveDeltaToken(file, cacheKey) {
    var FileReader,
        reader,
        lastLine,
        nextLine,
        deltaToken;

    FileReader = require('dw/io/FileReader');
    reader = new FileReader(file);
    while (!empty(nextLine = reader.readLine())) {
        lastLine = nextLine;
    }
    reader.close();
    
    deltaToken = lastLine && JSON.parse(lastLine).deltaToken;
    
    if(deltaToken) {
        cache.put(cacheKey, deltaToken);
        Logger.info("deltaToken saved into key - " + cacheKey + " - " + deltaToken);
    } else {
        return false;
    }

    return true;
}

/**
 * Retrieve and Save Delta Feed into Impex and Token into Custom Cache
 * @param {String} folderPath folderpath for the delta file
 * @param {String} filename filename
 * @param {String} authToken Auth token for the delta service call
 * @param {String} deltaToken delta token which tracks the delta stream
 * @param {String} cacheKey cachekey to save the delta Token
 * @returns {Boolean} return true or false if operation is successful or not
 */
function saveDeltaFeed(folderPath, filename, authToken, deltaToken, cacheKey) {
    var queryAgain,
        file,
        result,
        deltaService,
        writer;

        queryAgain = false;

        try {
            file = createFile(folderPath, filename);
            deltaService = ServiceMgr.getDeltaService();
            do {
                result = deltaService.call({
                    token: authToken,
                    body: {
                        "deltaToken": deltaToken
                    }
                });
                if (result.status === 'OK' && !empty(result.object)) {
                    if (result.object.shouldQueryAgain) {
                        queryAgain = result.object.shouldQueryAgain;
                        deltaToken = result.object.nextDeltaToken;
                    } else {
                        cache.put(cacheKey, result.object.nextDeltaToken);
                        Logger.info("deltaToken saved into key - " + cacheKey + " - " + deltaToken);
                    }
    
                    if (result.object.records && result.object.records.length > 0) {
                        writer = new FileWriter(file, true);
                        for(var record of result.object.records) {
                            writer.writeLine(JSON.stringify(record));
                        }
                    }
                }
            
            } while(queryAgain);
        } catch(e) {
            Logger.error("Error downloading the delta inventory file:" + e);
            return false;

        } finally {
            if(writer) {
                writer.close();
            }
        }

    return true;
}