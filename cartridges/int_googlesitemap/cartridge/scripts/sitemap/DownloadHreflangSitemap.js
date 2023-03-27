'use strict';

var CustomObjectMgr = require("dw/object/CustomObjectMgr"),
    Site = require("dw/system/Site"),
    HTTPClient = require("dw/net/HTTPClient"),
    Logger = require("dw/system/Logger"),
    File = require("dw/io/File"),
    Status = require("dw/system/Status"),
    System = require("dw/system/System"),
    StringUtils = require("dw/util/StringUtils"),
    LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

const ARCHIVE_DIRECTORY = "src/archive/sitemaps",
    SITEMAP_DIRECTORY = "src/sitemaps",
    FILE_PATTERN = /^(hreflang-sitemap-|product-sitemap-).*.xml/g,
    FULL_SITEMAP_DIRECTORY = File.IMPEX + "/src/sitemaps/",
    REPLACE_PATTERN = ["sitemap-www.underarmour", ".xml"],
    HREFLANG_SERVICE_NAME = "sitemap.hreflang.http";

/**
 * Download all hreflang XML files
 */
function downloadSitemaps() {
    var siteID = Site.getCurrent().getID(),
        xmlFiles,
        sitemapJsonObj = getSitemapCustomObject(), //retrieving JSON data from Custom object
        response = false;

    xmlFiles = sitemapJsonObj[siteID];
    response = processXMLfiles(xmlFiles);
    if (response) {
        return new Status(Status.OK);
    } else {
        return new Status(Status.ERROR);
    }
}

/**
 * Archive and delete old hreflang XML files
 */
function cleanUpSitemaps() {
    var archiveDirectory = new File(File.IMPEX + File.SEPARATOR + ARCHIVE_DIRECTORY),
        directoryToArchive = new File(File.IMPEX + File.SEPARATOR + SITEMAP_DIRECTORY),
        currentCalendar = System.getCalendar(),
        currentCalendarString = StringUtils.formatCalendar(currentCalendar, 'yyyyMMdd_HHmmssSSS'),
        separator = File.SEPARATOR;

    if (!archiveDirectory.exists()) {
        archiveDirectory.mkdir();
    }
    if (!directoryToArchive.exists()) {
        //sitemaps directory has not created yet, nothing to zip
        return new Status(Status.OK);
    }
    if (separator == '\\') {
        separator = '\\\\';
    }
    //archive files
    try {
        directoryToArchive.zip(new File(archiveDirectory, directoryToArchive.fullPath.substring(1).replace(new RegExp(separator, 'g'), '_') + '_' + currentCalendarString + '.zip'));
    } catch (e) {
        Logger.error("DownloadHreflangSitemap.js: Error while zipping hreflang sitemaps: " + e);
        return new Status(Status.ERROR);
    }
    //remove hreflang files
    var childFiles = directoryToArchive.listFiles();
    if (childFiles && childFiles.length > 0) {
        for(var file in childFiles) {
            if (new RegExp(FILE_PATTERN).test(childFiles[file].name)) {
                removeFile(childFiles[file]);
            }
        }
    }
}

/**
 * Deletes the given file (even if it is a directory).
 * 
 * @param file : File The file to delete.
 */
function removeFile(file) {
    if (file.isDirectory()) {
        var childFiles = file.listFiles();
        if (childFiles.length > 0) {
            for(var childFile in childFiles) {
                removeFile(childFiles[childFile]);
            }
        }
    }
    file.remove();
}

/**
 * Retrieving JSON data from Custom object SiteData
 */
function getSitemapCustomObject() {
    var co = CustomObjectMgr.getCustomObject("SiteData", "SitemapData");
    //check for empty CO
    if (empty(co)) {
        return null;
    }
    var sitemapJsonObj = JSON.parse(co.custom.data);
    //check for empty sitemap JSON data
    if (empty(sitemapJsonObj)) {
        return null;
    }
    return sitemapJsonObj;
}

/**
 *  Actual HTTPClient for downloading XML file
 */
function downloadSitemapFile(fileName) {
    // creating service with callbacks
    var hreflangService = LocalServiceRegistry.createService(HREFLANG_SERVICE_NAME, {
        createRequest: function (svc, params) {
            // Build full service request URL
            let requestURL = svc.getConfiguration().credential.URL; // Common URL path
            requestURL += params.endpointFilename; // Service endpoint
            svc.setRequestMethod('GET');
            svc.setOutFile(params.fileToSave);
            svc.setURL(requestURL);
        },
        execute: function (svc, client) {
            client.sendAndReceiveToFile(svc.getOutFile());
        },
        parseResponse: function (svc, client) {
            return client.text;
        }
    });
    var sitemapDir = new File(FULL_SITEMAP_DIRECTORY),
        newFilename = fileName;
    if (!sitemapDir.exists()) {
        sitemapDir.mkdir();
    }
    var countries = JSON.parse(Site.getCurrent().getCustomPreferenceValue('countriesJSON'));
    var domainStr = fileName.replace(REPLACE_PATTERN[0], "");
    domainStr = domainStr.replace(REPLACE_PATTERN[1], "");
    for(var countryItr in countries) {
        var country = countries[countryItr];
        if ("hostName" in country && country.hostName.indexOf(domainStr) !== -1) {
            newFilename = "sitemap-" + country.hostName + ".xml";
            break;
        } else if ("hostName" in country && /\.eu-\w{2}_\w{2}/.test(domainStr) && country.hostName.indexOf(domainStr.slice(0, 3)) !== -1) {
            newFilename = "sitemap-" + country.hostName + domainStr.replace(".eu", "") + ".xml";
            break;
        } else if ("locale" in country) {
            var localeFromFileName = domainStr && domainStr.slice(-5);
            if (country.locale.join(',').toLowerCase().indexOf(localeFromFileName) !== -1) {
                newFilename = "sitemap-" + country.hostName + '-' + localeFromFileName + ".xml";
                break;
            }
        }
    }

    var file = new File(FULL_SITEMAP_DIRECTORY + "hreflang-" + newFilename);

    try {
        var hreflangResponse = hreflangService.call({
            endpointFilename: fileName,
            fileToSave: file
        });
    } catch (e) {
        Logger.error("DownloadHreflangSitemap.js: Error while downloading hreflang sitemap XML: " + e);
        return false;
    }
    if (!hreflangResponse.error && hreflangResponse.ok && hreflangResponse.status == "OK") {
        return true;
    } else {
        Logger.error("DownloadHreflangSitemap.js: Error while downloading hreflang sitemap XML: " + hreflangResponse.errorMessage);
        return false;
    }
}

/**
 * Restoring zipped hreflang sitemaps if downloading process failed
 */
function restoreArchivedSitemaps() {
    var archiveDirectory = new File(File.IMPEX + File.SEPARATOR + ARCHIVE_DIRECTORY),
        sitemapDirectory = new File(File.IMPEX + File.SEPARATOR + SITEMAP_DIRECTORY),
        listFiles = archiveDirectory.listFiles();
    if (listFiles && listFiles.length > 0) {
        try {
            listFiles[listFiles.length - 1].unzip(sitemapDirectory);
        } catch (e) {
            Logger.error("DownloadHreflangSitemap.js: Error while unzipping hreflang sitemap XML: " + e);
        }
    } else {
        //nothing to unzip
        return new Status(Status.OK);
    }
    var unzipedDir = new File(File.IMPEX + File.SEPARATOR + SITEMAP_DIRECTORY + "/sitemaps"),
        listFilesUnzipedDir = unzipedDir.listFiles();
    if (listFilesUnzipedDir) {
        for (let i = 0; i < listFilesUnzipedDir.length; i++) {
            if (new RegExp(FILE_PATTERN).test(listFilesUnzipedDir[i].name)) {
                listFilesUnzipedDir[i].copyTo(new File(File.IMPEX + File.SEPARATOR + SITEMAP_DIRECTORY + File.SEPARATOR + listFilesUnzipedDir[i].getName()));
            }
        }
    }
    removeFile(unzipedDir);
}

/**
 * Executes download loop process of hreflang sitmapss
 */
function processXMLfiles(xmlFiles) {
    var result = false;
    for (var i = 0; i < xmlFiles.length; i++) {
        result = downloadSitemapFile(xmlFiles[i]);
        if (!result) {
            restoreArchivedSitemaps();
            Logger.error("DownloadHreflangSitemap.js: Error while downloading hreflang sitemap XML. Archive sitemaps restored");
            return result;
        }
    }
    return result;
}

module.exports = {
    downloadSitemaps: downloadSitemaps,
    cleanUpSitemaps: cleanUpSitemaps,
    restoreArchivedSitemaps: restoreArchivedSitemaps
};
