'use strict';

let Transaction = require('dw/system/Transaction'),
    Logger = require('dw/system/Logger'),
    Status = require('dw/system/Status'),
    File = require('dw/io/File'),
    FileWriter = require('dw/io/FileWriter'),
    Site = require('dw/system/Site'),
    HashMap = require('dw/util/HashMap'),
    ArrayList = require('dw/util/ArrayList'),
    CustomObjectMgr = require('dw/object/CustomObjectMgr');

/* Script Modules */
let CountryHelper = require('~/cartridge/scripts/util/CountryHelper'),
    CatalogExportMgr = require('int_customfeeds/cartridge/scripts/export/CatalogExportMgr'),
    CSVExportHandler = require('int_customfeeds/cartridge/scripts/export/handlers/CSVExportHandler'),
    TemplateExportHandler = require('int_customfeeds/cartridge/scripts/export/handlers/TemplateExportHandler');

function execute(params) {
    let errorString = '',
    	feedConfigString = params.feedConfigString,
    	availableConfigData;

    availableConfigData = getAvailableConfig(feedConfigString);

    if (empty(availableConfigData)) {
        Logger.error('EXPORTFEED ' + feedConfigString + ' failed. Error: Wrong configuration', 'ERROR');
        return new Status(Status.ERROR, 'ERROR', 'EXPORTFEED '+ feedConfigString + ' failed. Error: Wrong configuration');
    }

    for each (let dataID in availableConfigData.keySet()) {
        let isLocaleChanged = request.setLocale(availableConfigData.get(dataID).setlocale),
            fileName = '',
        	filePrefix = availableConfigData.get(dataID).setlocale == 'default' ? Site.getCurrent().getID() + '_' : '';
        
        if (!isLocaleChanged) {
            errorString += 'Some system error occurred; ';
            continue;
        }
        //Adding timestamp to generate feed files based on time stamp
        fileName = filePrefix + availableConfigData.get(dataID).setlocale + '_FEEDEXPORT.xml';

        try {
            Transaction.begin();
            let catalogExportMgr = createCatalogExportMgr(availableConfigData.get(dataID), fileName);

            if (!empty(catalogExportMgr)) {
                catalogExportMgr.runExport();
            }
            Transaction.commit();
        } catch (e) {
            Transaction.rollback();
            Logger.info('catalogExportMgr failed with creation or export');
        }
    }

    if (empty(errorString)) {
        Logger.info('FEED ' + feedConfigString + ' successfully finished.');
        return new Status(Status.OK);
    } else {
        Logger.error('FEED ' + feedConfigString + ' failed. Error: ' + errorString, 'ERROR');
        return new Status(Status.ERROR, 'ERROR', 'FEED ' + feedConfigString + ' failed. Error: ' + errorString);
    }
}

function getAvailableConfig(feedConfigString) {
    let currentSiteLocales =  Site.getCurrent().getAllowedLocales(),
        currentSiteCurrency = new ArrayList(),
        feedConfig = null,
        availableConfigData = new HashMap();

    //JSON feed config fallback
    if (empty(feedConfigString)) {
        feedConfigString = Site.getCurrent().getCustomPreferenceValue('feedManagerConfig');
    }

    try {
        feedConfig = feedConfigString && JSON.parse(feedConfigString);
    } catch(e) {
        Logger.error("Customfeeds.js: Can't parse JSON config from job param: " + e.message);
    }

    for (let locData in feedConfig) {
        let locales = [],
            currency = '',
            countries = [],
            shipping = '',
            variationsOnly = false,
            feed = '',
            priceBookPrefix = '';

        if ('locales' in feedConfig[locData]) {
            for (let i = 0; i < feedConfig[locData]['locales'].length; i++) {
                let localeID = feedConfig[locData]['locales'][i];
                if (currentSiteLocales.indexOf(localeID) != -1) {
                    let countryObject = new CountryHelper('locale', localeID);
                    if (!empty(countryObject)) {
                        locales.push(feedConfig[locData]['locales'][i]);
                        countries.push(countryObject.countryCode);
                    }
                }
            }
        }

        if ('feed' in feedConfig[locData]) {
            feed = feedConfig[locData]['feed'];
        }

        if ('currency' in feedConfig[locData]) {
            currency = feedConfig[locData]['currency'];
        }

        if ('shipMethodID' in feedConfig[locData]) {
            shipping = feedConfig[locData]['shipMethodID'];
        }

        if ('variationsOnly' in feedConfig[locData]) {
            variationsOnly = feedConfig[locData]['variationsOnly'];
        }

        if (locales.length > 0 && currency.length > 0) {
            for (let l = 0; l < locales.length; l++) {
                availableConfigData.put(locales[l], {
                    'setlocale' : locales[l],
                    'locales' : locales,
                    'currency' : currency,
                    'feed' : feed,
                    'countries' : countries,
                    'shipMethodID' : shipping,
                    'variationsOnly' : variationsOnly
                });
            }
        }
    }

    return availableConfigData.getLength() > 0 ? availableConfigData : null;
}

/**
 * Creates and registers export handlers from their custom object definitions
 */
function createCatalogExportMgr(feedConfig, fileName) {
    let catalogExportMgr = CatalogExportMgr.getCatalogExportMgr(),
        exportMgr = new catalogExportMgr();

    registerConfigurableHandlers(exportMgr, fileName, feedConfig);

    return exportMgr;
}

/**
 * Helper function which handles the custom objects
 */
function registerConfigurableHandlers(exportMgr, fileName, feedConfig) {
    for each (let co in CustomObjectMgr.getAllCustomObjects('CustomFeedConfig')) {
        if (co.custom.id == feedConfig.feed) {
            let folder = new File(co.custom.folderName);
            if (!folder.exists() && !folder.mkdirs()) {
                Logger.error('Could not create folder ' + co.custom.folderName);
            }

            let file = new File(folder, fileName),
                encoding = co.custom.fileEncoding || 'UTF-8';

            if (!file.exists() && !file.createNewFile()) {
                Logger.error('Could not create export file');
            }
            Logger.info('Registering Configurable Feed ' + co.custom.id, 'INFO');

            if (co.custom.type == "XML") {
                let templateExportHandler = TemplateExportHandler.getTemplateExportHandler();
                exportMgr.registerExportHandler(new templateExportHandler(new FileWriter(file, encoding), co.custom.configuration, feedConfig));
            } else if (co.custom.type == "CSV") {
                let lines = new Reader(co.custom.configuration),
                    config = {separator : ','},
                    line;
                while ((line = lines.readLine()) != null) {
                    if (line.indexOf('separator ') == 0) {
                        config.separator = line.substring(10);
                    } else if (!config.fields) {
                        // use first line as fields
                        config.fields = line.split(config.separator);
                    } else if(!config.header) {
                        // if there are more lines, we previously read the header
                        config.header = config.fields;
                        config.fields = line.split(config.separator);
                    }
                }
                let cSVExportHandler = CSVExportHandler.getCSVExportHandler();
                exportMgr.registerExportHandler(new cSVExportHandler(new FileWriter(file, encoding), config.separator, config.fields, config.header));
            }
        }
    }
}

module.exports.execute = execute;