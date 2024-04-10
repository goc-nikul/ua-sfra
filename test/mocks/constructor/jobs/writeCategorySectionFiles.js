'use strict';

var moduleName = 'writeCategorySectionFiles.js';

function writeCategoriesToXml(filePath) {
    var categorySectionTransformer = require('../../../mocks/constructor/transformers/categorySectionTransformer');
    var categoriesGetter = require('../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/getters/categories');
    var xmlConverter = require('../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/xmlConverter');
    var logger = require('../../../mocks/constructor/helpers/logger');

    var categories = [];
    var count = 0;

    categories = categoriesGetter.getAllCategories();

    count = xmlConverter.createXmlFileFromArray(
        filePath,
        'categories',
        'category',
        categories,
        categorySectionTransformer.transformCategorySection
    );

    return logger.log(moduleName, 'info', 'Written ' + count + ' categories to a new XML file.');
}

function execute(parameters, stepExecution) {
    // Salesforce objects
    var Status = require('../../../mocks/dw/dw_system_Status');

    // Helper objects
    var logger = require('../../../mocks/constructor/helpers/logger');
    var files = require('../../../../cartridges/link_constructor_connect_legacy/cartridge/scripts/helpers/files');

    var filePath = files.getFilePath(parameters.WriteFolder, 'category_sections');
    stepExecution.jobExecution.context.rootPath = parameters.WriteFolder; // eslint-disable-line no-param-reassign
    stepExecution.jobExecution.context.filePath = filePath; // eslint-disable-line no-param-reassign

    // Init logs
    logger.log(moduleName, 'info', 'Writing new category XML files to: ' + filePath);
    logger.log(moduleName, 'info', 'parameters.Locale: ' + parameters.Locale);

    // Set locale
    if (parameters.Locale) {
        //request.setLocale(parameters.Locale);
        stepExecution.jobExecution.context.locale = parameters.Locale; // eslint-disable-line no-param-reassign
    }

    // Prep file system folders
    if (!files.ensureConstructorFolderExists(parameters.WriteFolder)) {
        logger.log(moduleName, 'error', 'Unable to create folder to store cartridge data');
        return new Status(Status.ERROR);
    }

    // Write data
    writeCategoriesToXml(filePath);

    // Finish sync
    logger.log(moduleName, 'info', 'Finished writing category XML files');
    return new Status(Status.OK);
}

module.exports = {
    execute: execute,
    writeCategoriesToXml: writeCategoriesToXml
};
