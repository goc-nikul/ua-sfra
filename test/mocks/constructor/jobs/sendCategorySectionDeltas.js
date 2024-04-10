'use strict';

var moduleName = 'sendCategorySectionDeltas.js';

function sendCategorySectionDeltas(parameters, stepExecution) {
    // Salesforce objects
    var Status = require('../../../mocks/dw/dw_system_Status');

    // Helper objects
    var XmlFileIterator = require('../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/xmlFileIterator');
    var logger = require('../../../mocks/constructor/helpers/logger');
    var config = require('../../../mocks/constructor/helpers/config');
    var files = require('../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/files');
    var api = require('../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/api');

    // Variables
    var filePath = stepExecution.jobExecution.context.filePath;
    var rootPath = stepExecution.jobExecution.context.rootPath;
    var xmlFileIterator = null;
    var credentials = null;
    var status = null;

    // Init logs
    logger.log(moduleName, 'info', 'Sending category deltas to Constructor.io...');
    logger.log(moduleName, 'info', 'Reading from file path: ' + filePath);

    // Set locale
    if (stepExecution.jobExecution.context.locale) {
        //request.setLocale(stepExecution.jobExecution.context.locale);
    }

    // Get credentials
    credentials = config.getCredentialsOrNull(parameters.ApiKeyOverride);
    if (!credentials) {
        files.handleFileActionAfterSendingDeltas(
            parameters,
            rootPath,
            filePath,
            false
        );
        logger.log(moduleName, 'error', 'Credentials not set');
        return new Status(Status.ERROR);
    }

    // Send deltas
    xmlFileIterator = XmlFileIterator.create(filePath, 'category');

    status = api.sendDeltasFromXmlFile(
        // NOTE: The feed type here must be `product`, so that the category data will be ingested
        // correctly into the `Categories` section.
        api.feedTypes.product,
        credentials,
        xmlFileIterator,
        // NOTE: Here, we're hardcoding the `Categories` index section since we want to ingest there.
        'Categories',
        false
    );

    files.handleFileActionAfterSendingDeltas(
        parameters,
        rootPath,
        filePath,
        status.code.toLowerCase() === 'ok'
    );

    logger.log(moduleName, 'info', 'Finished sending category deltas to Constructor.io');
    return status;
}

module.exports.execute = sendCategorySectionDeltas;