'use strict'

var PRODUCT_PREFIX_TO_USE = 2; //increase this number if first two chars are not unique for product ids in your catalog
var SortedSet = require('dw/util/SortedSet');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var FileReader = require('dw/io/FileReader');
var Logger = require('dw/system/Logger').getLogger('GlobalFeedExport', 'GlobalFeedExport');
var StringUtils = require('dw/util/StringUtils');
var Site = require('dw/system/Site');
var HashMap = require('dw/util/HashMap');
var SortedSet = require('dw/util/SortedSet');

/**
 * adds product ID to tracker
 * 
 * Date structure: Using tracker as a HashMap and then values as SortedSet with product id prefix as key.
 * Main intent is to allow adding a lot of products into the tracker and avoid quota errors on collections.
 * 
 * @param {Object} tracker tracker HashMap object 
 * @param {Object} product product
 * @returns {boolean} product added to tracker or not 
 * 
*/
function trackProduct(tracker, product) {
    var key = (product.ID).substring(0,PRODUCT_PREFIX_TO_USE);
    if(!tracker.containsKey(key)) {
        tracker.put(key, new SortedSet());
    }
    return tracker.get(key).add1(product.ID);
}

/**
 * save tracker data as file 
 * format: csv
 * sample: index,[comma separated list of SKU IDs]
 * @param {Object} tracker tracker HashMap object 
 * @param {String} baseDirPath base directory where the tracker file will be stored
 * @param {String} locale locale that is being processed currently
 * @returns {boolean} file successfully saved or not 
 * 
*/
function storeTrackerDataToFile(tracker, baseDirPath, locale) {
    if (!tracker || !baseDirPath) {
        return false;
    }

    var dirPath = baseDirPath + File.SEPARATOR + 'tracking';
    var folder = new File(dirPath);
    var filename;
    var file;
    var writer;
    var value;
    var strValue;
    var entry;

    if(locale) {
        filename = 'feedtracker' + '-' + StringUtils.formatCalendar(Site.getCalendar(), 'yyyyMMddHHmmss') + '-' + locale + '.txt';
    } else {
        filename = 'feedtracker' + '-' + StringUtils.formatCalendar(Site.getCalendar(), 'yyyyMMddHHmmss') + '.txt';
    }

    try {
        if(!folder.exists() && !folder.mkdirs()){
            Logger.error('Could not create folder: '+dirPath);
        }

        file = new File(folder, filename);

        if(!file.exists() && !file.createNewFile()){
            Logger.error('Could not create tracking file:');
        }

        writer = new FileWriter(file);

        var iter = tracker.entrySet().iterator();

        while (iter.hasNext()) {
            entry = iter.next();
            value = entry.value;
            if (value && value.size() > 0) {
                strValue = value.toArray().toString();
                writer.writeLine(entry.key + ',' + strValue);
            }
        }

    } catch(e) {
        Logger.error('Error saving tracker information into file' + e);
    } finally {
        writer.close();
    }
    return true;
}

/**
 * generate delete file based on comparison between old tracker stored data vs new
 * 
 * 
 * @param {Object} tracker tracker HashMap object 
 * @param {String} baseDirPath base directory path
 * @param {String} locale locale that is being processed currently
 * @returns {boolean} file successfully saved or not 
 * 
*/
function generateDeleteFile(tracker, baseDirPath, locale) {
    if (!tracker || !baseDirPath) {
        return false;
    }

    var dir = new File(baseDirPath + File.SEPARATOR + 'tracking');
    if (!dir.exists()) {
        Logger.error('generateDeleteFile: tracking directory does not exist');
    }
    var filesList = dir.list();
    
    if (locale) {
        filesList = filesList.filter(function(filename) {
            return filename.indexOf(locale) > -1;
        });
    }
    if (filesList.length >= 2) { //minimum we have two trackers to compare
        filesList = filesList.sort().reverse();
        var previousTrackerFilename = filesList[1]; //second last file is used for previous tracker
        var previousTrackerFile = new File(dir, previousTrackerFilename);
        var previousTracker = restoreTrackerFromFile(previousTrackerFile);
        var result = findTrackerDiff(previousTracker, tracker);
    
        if(result && result.length > 0) {
            //save to delete file
            createDeleteFile(result, baseDirPath, locale);
        }
    }

    return true;
}

/**
 * returns a tracker object by parsing a file
 * 
 * @param {File} file tracker file 
 * @returns {HashMap} tracker with parsed data
 * 
*/
function restoreTrackerFromFile(file) {
    if (!file && !file.isFile()) {
        Logger.error('Error in restoring tracker from file - source file is incorrect')
        return;
    }

    var tracker = new HashMap();
    var fileReader = new FileReader(file);
    var nextLine;
    var productIds;
    var key;
    var sortedSet;

    try {
        while (!empty(nextLine = fileReader.readLine())) {
            if (nextLine) {
                productIds = nextLine.split(',');
                //first product id represents the HashMap key
                key = productIds.shift();
                sortedSet = new SortedSet();
                sortedSet.add(productIds);
                tracker.put(key, sortedSet);
            }
        }
        return tracker;
    } catch(e) {
        Logger.error('Error while parsing the tracker file: ' + e);
    }
    return;
}

/**
 * returns an array object with product ids which are present in first and not contained in second.
 * 
 * @param {HashMap} first first tracker object
 * @param {HashMap} second second tracker object
 * @returns {Array} returns array containing the diff product ids
 * 
*/
function findTrackerDiff(first, second) {
    var result = [];
    var firstKeySetIter;
    var key;
    var valueMatch;
    if(!first || !second) {
        Logger.error('findTrackerDiff: problem with input trackers');
        return;
    }

    if ((first && first.isEmpty()) || (second && second.isEmpty())) {
        //if either are empty, most likely there is integration issue. Don't generate delete file
        Logger.error('findTrackerDiff: either of tracker is empty. Error is being returned');
        return;
    }

    firstKeySetIter = first.keySet().iterator();

    while(firstKeySetIter.hasNext()) {
        key = firstKeySetIter.next();
        if (!second.containsKey(key)) {
            result = result.concat(first.get(key).toArray());
        } else {
            valueMatch = JSON.stringify(second.get(key)).indexOf(JSON.stringify(first.get(key))) > -1;
            if (!valueMatch) {
                first
                    .get(key)
                    .toArray()
                    .map(function(productId){
                        if (!second.get(key).contains(productId)) {
                            result.push(productId);
                        }
                    });
            }
        }
    }
    return result;
}

/**
 * create delete file
 * 
 * @param {Array} productArray product id array
 * @param {String} baseDirPath base directory path
 * @param {String} locale locale that is being processed currently
 * @returns {boolean} file successfully saved or not 
 * 
*/
function createDeleteFile(productArray, baseDirPath, locale) {

    if (!productArray || !baseDirPath) {
        Logger.error('createDeleteFile: error in inputs');
        return false;
    }
    var filename = 'delete-feed-' + StringUtils.formatCalendar(Site.getCalendar(), 'yyyyMMddHHmmss');
    if (locale) {
        filename = filename + '-' + locale;
    }
    try {
        var dir = new File(baseDirPath);
        if (!dir.exists()) {
            Logger.error('createDeleteFile: base directory does not exist');
            return false;
        }
        var file = new File(dir, filename + '.txt');

        if(!file.exists() && !file.createNewFile()){
            Logger.error('Could not create tracking file:');
            return false;
        }
    
        var writer = new FileWriter(file);
    
        productArray.map(function(productId){
            writer.writeLine(productId);
        });
    } catch (e) {
        Logger.error('createDeleteFile: error while creating delete file'+ e);
    }finally {
        writer.close();
    }

    return true;
}

module.exports = {
    trackProduct: trackProduct,
    storeTrackerDataToFile: storeTrackerDataToFile,
    generateDeleteFile: generateDeleteFile
};
