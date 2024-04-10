var moduleName = 'writeCategorySectionFiles.js';

/**
 * Writes all categories to a XML file.
 * @param {string} filePath The file path to write to.
 */
function writeCategoriesToXml(filePath) {
    var categorySectionTransformer = require('../transformers/categorySectionTransformer');
    var categoriesGetter = require('link_constructor_connect_legacy/cartridge/scripts/getters/categories');
    var xmlConverter = require('link_constructor_connect_legacy/cartridge/scripts/helpers/xmlConverter');
    var logger = require('../helpers/logger');

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

    logger.log(moduleName, 'info', 'Written ' + count + ' categories to a new XML file.');
}

/**
 * Sends product category deltas to Constructor.
 * @param {*} parameters The job parameters.
 * @param {*} stepExecution The job step execution.
 * @returns {*} The job status.
 */
function execute(parameters, stepExecution) {
    // Salesforce objects
    var Status = require('dw/system/Status');

    // Helper objects
    var logger = require('../helpers/logger');
    var files = require('link_constructor_connect_legacy/cartridge/scripts/helpers/files');

    var filePath = files.getFilePath(parameters.WriteFolder, 'category_sections');
    stepExecution.jobExecution.context.rootPath = parameters.WriteFolder; // eslint-disable-line no-param-reassign
    stepExecution.jobExecution.context.filePath = filePath; // eslint-disable-line no-param-reassign

    // Init logs
    logger.log(moduleName, 'info', 'Writing new category XML files to: ' + filePath);
    logger.log(moduleName, 'info', 'parameters.Locale: ' + parameters.Locale);

    // Set locale
    if (parameters.Locale) {
        /**
         * Request is a global object that is available in all job steps.
         * Using this, we can set the locale for the current request.
         *
         * See:
         * - https://salesforcecommercecloud.github.io/b2c-dev-doc/docs/current/scriptapi/html/index.html?target=class_dw_system_Request.html
         */
        request.setLocale(parameters.Locale);
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

module.exports.execute = execute;
