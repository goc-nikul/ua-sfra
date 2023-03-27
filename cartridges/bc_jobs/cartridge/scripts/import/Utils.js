'use strict';

let File = require('dw/io/File'),
    ArrayList = require('dw/util/ArrayList'),
    XmlReaderUtils = require('bc_jobs/cartridge/scripts/import/XmlReaderUtils'),
    Logger = require('dw/system/Logger'),
    SortedSet = require('dw/util/SortedSet'),
    HashMap = require('dw/util/HashMap'),
    Calendar = require('dw/util/Calendar'),
    TimezoneHelper = require('app_ua_core/cartridge/scripts/util/TimezoneHelper'),
    Site = require('dw/system/Site'),
    FileReader = require('dw/io/FileReader');
var collections = require('*/cartridge/scripts/util/collections');

/**
 * Gets the working folder for the current
 *
 */
function getWorkingFolder(workingFolder) {
    let resultFolder;
    // prefer pre set working folder configuration
    if (!empty(workingFolder)) {
        let relativeFolder = workingFolder;
        if (relativeFolder.charAt(0) == File.SEPARATOR) {
            relativeFolder = relativeFolder.substring(1);
        }
        resultFolder = new File(File.IMPEX + File.SEPARATOR + relativeFolder);
    }
    
    return resultFolder;
}

/**
 * Gets files from directory
 *
 */
function getFilesFromDirectory (params) {
    return params.Directory.listFiles(function(file) {
        let regExp = new RegExp(params.FilePattern);

        if (params.OnlyFiles && file.isDirectory()) {
            return false;
        }
        
        if (!empty(params.FilePattern)) {
            if (params.NegateFilePattern) {
                return !regExp.test(file.name)
            } else {
                return regExp.test(file.name)
            }
        }
        
        return true;
    });
}

/*
 * Returns all files which match the given pattern.
 *
 */
function getProcessedFiles(files, params, sizePart, counter) {
    let directory          = params.Directory || null,
        sortDirection      = params.SortDirection || null,
        filePattern        = params.FilePattern || null,
        onlyFiles          = params.OnlyFiles || null,
        recursiveSearch    = params.RecursiveSearch || null,
        negateFilePattern  = params.NegateFilePattern || null,
        filterOldFiles     = params.FilterOldFiles || null,
        timeStampPattern   = params.TimeStampPattern || null,
        timeStampFormatter = params.TimeStampFormatter || null;
    
    let logger = Logger.getLogger('utils.GetFilesFromDirectory');
    
    if (empty(directory) || !directory.isDirectory()) {
        logger.error('Utils.js: No directory was given.');
        
        return null;
    }
    
    Logger.debug('Utils.js: Get file list from the following directory: \'' + directory.getFullPath() + '\'.');
    
    let fileList;
    if (sortDirection == 'DESCENDING') {
        fileList = new SortedSet(function(o1, o2) {
            if (o1 < o2) {
                return 1;
            }
            if (o1 > o2) {
                return -1
            }
            return 0;
        });
    } else {
        fileList = new SortedSet();
    }
    
    if (recursiveSearch) {
        getRecursiveFiles(directory, fileList, onlyFiles, filePattern, negateFilePattern);
    } else {
        var filesSize = files.size();

        if (filesSize >= sizePart) {
            var startIndex = sizePart * counter;
            var endIndex = startIndex + sizePart;

            if (startIndex >= filesSize) {
                return null;
            }

            if (endIndex >= filesSize) {
                endIndex = filesSize - 1;
            }

            files = files.subList(startIndex, endIndex);          
        }
        
        fileList.addAll(files);
    }

    if (empty(fileList)) {
        logger.debug('Utils.js: No files found for directory: \'' + directory.getFullPath() + '\'.');
        
        return null;
    }
    
    // Filters Files by creation timestamps in their filename
    // If FilterOldFiles is true, TimeStampPattern and TimeStampFormatter need to be set
    if (!empty(filterOldFiles) && filterOldFiles) {
        let TIMESTAMP_PATTERN = timeStampPattern,
            TIMESTAMP_FORMAT = timeStampFormatter;
        
        // hashmap which has filenames without the timestamp as key
        let fileMap = new HashMap();
        collections.forEach(fileList, function(file) {
            let timeStartIndex = file.name.search(TIMESTAMP_PATTERN),
                timeEndIndex = timeStartIndex + TIMESTAMP_FORMAT.length,
                key = file.name.substring(0, timeStartIndex) + file.name.substring(timeEndIndex, file.name.length),
                formerFile = fileMap.get(key);
            
            // Check if file already in HashMap
            if (empty(formerFile)) {
                fileMap.put(key, file);
            } else {
                let timezoneHelper = new TimezoneHelper();
                
                // files need to have same format: this is secured via dictionary key pattern
                // create calendar object of timestamps in file                 
                let formerTimeString = formerFile.name.substring(timeStartIndex, timeEndIndex),
                    formerCalendar = new Calendar( timezoneHelper.getCurrentSiteTime() );
                formerCalendar.parseByFormat(formerTimeString, TIMESTAMP_FORMAT);
                
                let currentTimeString = file.name.substring(timeStartIndex, timeEndIndex),
                    currentCalendar = new Calendar( timezoneHelper.getCurrentSiteTime() );
                currentCalendar.parseByFormat(currentTimeString, TIMESTAMP_FORMAT);
                
                // if current file has newer timestamp than file in map, replace the file 
                if (currentCalendar.after(formerCalendar)) {
                    fileMap.put(key, file);
                }           
            }
        });
        //fileList.clear();
        // Create new filelist
        let fileListNew = fileList.clone();
        collections.forEach(fileListNew, function(file) {
            if (!fileMap.containsValue(file)) {
                fileList.remove(file);
            }
        });
    }
    logger.debug('Utils.js: ' + fileList.length + ' file(s) found in directory: \'' + directory.getFullPath() + '\'.');
    
    return fileList;
}


/**
 * A recursive function to collect all files below a directory.
 * 
 */
function getRecursiveFiles(rootDirectory, fileList, onlyFiles, filePattern, negateFilePattern) {
    if (empty(rootDirectory)
        || !rootDirectory.isDirectory()) {
        return;
    }
    
    collections.forEach(rootDirectory.listFiles(), function(file) {
        if (file.isDirectory()) {
            getRecursiveFiles(file, fileList, onlyFiles, filePattern, negateFilePattern);
            
            if (!onlyFiles) {
                fileList.add(file);
            }
        } else {
            if (!empty(filePattern)) {
                if(negateFilePattern)
                {
                    if (!(new RegExp(filePattern).test(file.name))) 
                    {
                        fileList.add(file);
                    }
                }
                else
                {
                    if (new RegExp(filePattern).test(file.name)) {
                        fileList.add(file);
                    }
                }
                
            } else {
                fileList.add(file);
            }
        }
    });
}

/**
*   Move the found sub file into a unique location and prepares parameters for the import
*
*/
function prepareImportFile(fileToMove) {
    let uniqueFilename = fileToMove.getFullPath().toString().replace(/\//g, '_'); //FullPath minus '/' to make temp filename unique
    
    // only process xml files
    if (!fileToMove.isDirectory() && 
        (fileToMove.getFullPath().substring(fileToMove.getFullPath().length-3, fileToMove.getFullPath().length) == 'xml' ||
        fileToMove.getFullPath().substring(fileToMove.getFullPath().length-3, fileToMove.getFullPath().length) == 'txt' ||
        fileToMove.getFullPath().substring(fileToMove.getFullPath().length-3, fileToMove.getFullPath().length) == 'csv' ||
        fileToMove.getFullPath().substring(fileToMove.getFullPath().length-6, fileToMove.getFullPath().length) == 'xml.gz')) {
        Logger.debug('Utils.js: Begin processing file: ' + fileToMove.getFullPath());
        // single location for simple follow up actions
        
        let destinationRelative = 'temp' + File.SEPARATOR + uniqueFilename + '.xml';
        if (fileToMove.getFullPath().substring(fileToMove.getFullPath().length-3, fileToMove.getFullPath().length) == 'txt') {
            destinationRelative = 'temp' + File.SEPARATOR + uniqueFilename + '.txt';
        }
        if (fileToMove.getFullPath().substring(fileToMove.getFullPath().length-6, fileToMove.getFullPath().length) == 'xml.gz') {
            destinationRelative += '.gz';
        }
    
        let destinationFolder = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + destinationRelative.slice(0, destinationRelative.lastIndexOf(File.SEPARATOR)));
        if (!destinationFolder.exists()) {
            destinationFolder.mkdirs();
        }
    
        let destinationFile = new File(File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + destinationRelative);
        if (destinationFile.exists()) {
            destinationFile.remove();
        }
        
        fileToMove.renameTo(destinationFile);
        
        return {
            ImportFile: destinationRelative,
            ImportFileObject: destinationFile
        };
    } else {
        Logger.error('Utils.js: Invalid File or folder found: ' + fileToMove.getFullPath());
        return null;
    }
}

/**
*   Move the found sub file into a unique location and prepares parameters for the import
*
*/
function finalizeImport(fileToMove, originalDestination) {
    fileToMove.renameTo(originalDestination);
}

function processImportFile(file, orderElementFilter, orderElementHandler, offlineRefund) {

    if (!file.exists()) {
        Logger.error('OrderAcknowledgement.js: processImportFile: File not found: \'{0}\'', file.getFullPath());
        return {Status: 'importerror'};
    }

    var xmlReaderUtil = XmlReaderUtils.makeXmlReaderUtil(file);
    try {
        // The closure is practical because `readElement` wont inject a second argument of our choosing and it's
        // more simple to inject it here rather than to add support for argument injection to readElement itself. 
        xmlReaderUtil.readElement(orderElementFilter, function (element) { orderElementHandler(element, offlineRefund, file); });
    } catch (error) {
        Logger.error('Utils.js: importOrderStatus: Error during import: {0} ; lineNumber: {1} ; stack: {2}', '' + error, error.lineNumber, error.stack);
        return {Status: 'importerror'};
    } finally{
        xmlReaderUtil.close();
    }
    
    return {Status: 'success'};
}

function moveFile(filesList, location) {
    if (filesList.length > 0 && !location.exists()) {
        location.mkdirs();
    }
    for (let f = 0; f < filesList.length; f++) {
        let newFile = new File([location.fullPath, filesList[f].name].join(File.SEPARATOR));
        filesList[f].renameTo(newFile);
    }
}

module.exports = {
    getWorkingFolder: getWorkingFolder,
    getFilesFromDirectory: getFilesFromDirectory,
    getProcessedFiles: getProcessedFiles,
    prepareImportFile: prepareImportFile,
    finalizeImport: finalizeImport,
    processImportFile: processImportFile,
    moveFile: moveFile
};