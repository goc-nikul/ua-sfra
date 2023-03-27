"use strict";

var File = require("dw/io/File");
var Logger = require("dw/system/Logger");
var Status = require("dw/system/Status");
var StringUtils = require("dw/util/StringUtils");
var SitemapMgr = require("dw/sitemap/SitemapMgr");
var PreferencesUtil = require("*/cartridge/scripts/utils/PreferencesUtil");

function execute () {
    try {
        var objLocalesMapping = PreferencesUtil.getJsonValue("sitemapsLocalesMapping");

        if (!objLocalesMapping) {
            Logger.error(StringUtils.format("Object locale mapping is empty or missing from job configuration"));
            return Status(Status.ERROR);
        }
        var folder = new File (File.IMPEX + File.SEPARATOR + "src" + File.SEPARATOR + "sitemaps");
        var files = folder.listFiles();
        var uploadErrors = false;

        for each (var file in files) {
            if (file.file) {
                var localeArray = file.name.split("_");
                var locale = localeArray && localeArray.length > 0 && localeArray[3] ? localeArray[3].replace(".xml","") : null;

                if (locale && objLocalesMapping.hasOwnProperty(locale) && objLocalesMapping[locale]) {
                    try {
                        SitemapMgr.addCustomSitemapFile(objLocalesMapping[locale], file);
                        Logger.info(StringUtils.format("File : {0} (locale : {1}) ADDED for host : {2}", file.name, locale, objLocalesMapping[locale]));
                    } catch (uploadError) {
                        Logger.info(StringUtils.format("File : {0} (locale : {1}) NOT ADDED for host : {2} because of next error : {3}", file.name, locale, objLocalesMapping[locale], uploadError.message));
                        uploadErrors = true;
                    }
                }
            }
        }
    } catch (e) {
        Logger.error("Error: {0}", e.message);
        return Status(Status.ERROR);
    }

    return uploadErrors ? Status(Status.ERROR, StringUtils.format("Errors - please check log file")) : Status(Status.OK, StringUtils.format("Job completed without upload errors"));
}

exports.execute = execute;
