/**
 * Generates custom feeds based on current settings.
 */
//standard API
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var File 			= require('dw/io/File');
var FileWriter 		= require('dw/io/FileWriter');
var Locale 			= require('dw/util/Locale');
var Reader 			= require('dw/io/Reader');
var Site 			= require('dw/system/Site');
var Status 			= require('dw/system/Status');
var StringUtils 	= require('dw/util/StringUtils');

//initialize logger
var cvLogger = require('dw/system/Logger').getLogger('CustomFeeds');

var CatalogExportMgr 		= require('int_socialfeeds/cartridge/scripts/export/CatalogExportMgr');
var CSVExportHandler 		= require('int_socialfeeds/cartridge/scripts/export/handlers/CSVExportHandler');
var TemplateExportHandler 	= require('int_socialfeeds/cartridge/scripts/export/handlers/TemplateExportHandler');
var ProductFieldMapper      = require('int_socialfeeds/cartridge/scripts/export/ProductFieldMapper');

/**
 * Triggers the custom feed generation
 *
 * @param {dw.util.HashMap} args
 * @returns {dw.system.Status}
 */
function generate(args) {
    var currentSite = dw.system.Site.getCurrent();
    var allowedLocales  = currentSite.getAllowedLocales();
    var paramLocales;
    var locales = [];

    if (args.Locales) {
        paramLocales = args.Locales.split(',').map(function (current) {
            return current.trim();
        });
    }

    for (var i = 0; i < paramLocales.length; i++) {
        var currentParamLocale = paramLocales[i];
        if (allowedLocales.indexOf(currentParamLocale) >= 0) {
            locales.push(currentParamLocale);
        }
    }

    if (!locales.length) {
        locales = [
            currentSite.defaultLocale
        ];
    }

    for (var l = 0; l < locales.length; l++) {
        var currentLocale = locales[l];

        //initialize a fake logger component
        var loggingComponent = {
            addMessage: function(msg) {
                if (msg) {
                   cvLogger.info(msg);
                }
            }
        };

        var exportMgr = new CatalogExportMgr(loggingComponent);

        ProductFieldMapper.setCurrentLocale(currentLocale);
        registerConfigurableHandlers(exportMgr, loggingComponent, 'Catalog', currentLocale);
        exportMgr.runExport();
    }

    return new Status(Status.OK, 'OK');
}

/**
 * Helper function which handles the custom objects
 */
function registerConfigurableHandlers(exportMgr, cmp, feedContext, locale)
{
    var customFeedObjectIdList = [];
    if (!empty(executionContexts.CustomObjectIds) && executionContexts.CustomObjectIds) {
        customFeedObjectIdList = executionContexts.CustomObjectIds.split(',');
    }

	for each(var co in CustomObjectMgr.getAllCustomObjects("SalesChannelFeedConfig"))
	{
        if (customFeedObjectIdList.length > 0
            && customFeedObjectIdList.indexOf(co.custom.id) === -1) {
            continue;
        }

		var folder = new File(co.custom.folderName);
		if (!folder.exists() && !folder.mkdirs())
		{
			throw new Error("Could not create folder " + co.custom.folderName);
		}
		var fileName = co.custom.fileName.replace(/\{\{[^}]*\}\}/g,
			function(a: String)
			{ return ProductFieldMapper.parseAdditionData(a); });



		var file = new File(folder, 'TEMP_'+ fileName);
		var encoding = co.custom.fileEncoding || 'UTF-8';
		if (!file.exists() && !file.createNewFile())
		{
			throw new Error("Could not create export file");
		}

		if (cmp) cmp.addMessage('Registering Configurable Feed ' + co.custom
			.id, 'INFO');
		if (co.custom.type == "XML")
		{
			var fileWriter = new FileWriter(file, encoding);
            var ss = TemplateExportHandler;
			var templateExportHandler = new TemplateExportHandler(fileWriter, co.custom
				.configuration, feedContext, 'true', 'true', 'true', 'true', co.custom.socialCategory, co.custom.googleShoppingCategories, '', file, locale);
			exportMgr.registerExportHandler(templateExportHandler);
		}
		else if (co.custom.type == "CSV")
		{
			var lines = new Reader(co.custom.configuration);
			var config = {
				separator: ','
			};
			var line;
			while ((line = lines.readLine()) != null)
			{
				if (line.indexOf('separator ') == 0)
				{
					config.separator = line.substring(10);
				}
				else if (!config.fields)
				{
					// use first line as fields
					config.fields = appendMultiLocalesFields(line.split(config.separator));
				}
				else if (!config.header)
				{
					// if there are more lines, we previously read the header
					config.header = config.fields;
					config.fields = appendMultiLocalesFields(line.split(config.separator));
				}
			}
			exportMgr.registerExportHandler(new CSVExportHandler(new FileWriter(file, encoding), config.separator, config.fields, config.header,
             feedContext, 'true', 'true', 'true', 'true', co.custom.socialCategory, co.custom.googleShoppingCategories));

		}
	}
}

/**
 * Helper function which handles the multilocales header and values rows
 */
function appendMultiLocalesFields(fields) {

    var countries = require('*/cartridge/models/countries').locales;
    var localeIds = [];

    countries.forEach(function (country) {
        if (country.priceBooks) {
            localeIds.push(country.id)
        }
    });

    var multiLocaleFields = [];
    for each(var field : String in fields) {

        if (field.toLowerCase().indexOf('_alllocales') !== -1) {

            localeIds.forEach(function (localeId) {
                multiLocaleFields.push(field.replace('_alllocales','_'+localeId));
            });

        } else {
            multiLocaleFields.push(field);
        }
    }

    return multiLocaleFields;

}


/*
 * Job exposed methods
 */
/** Triggers the generation of custom feeds.
 * @see module:export/jobsteps/CustomFeeds~generate */
exports.generate = generate;
