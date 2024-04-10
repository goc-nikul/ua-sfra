var moduleName = 'writeProductFiles.js';

/**
 * Writes all products to a XML file.
 * @param {string} filePath The file path to write to.
 * @param {import('../types').WriteProductXmlParameters} writeParameters The arguments passed to the xml writer.
 * @param {import('../types').ProductJobParameters} filterParameters The arguments passed to the products getter.
 */
function writeProductsToXml(filePath, writeParameters, filterParameters) {
  var xmlConverter = require('../helpers/xmlConverter');
  var productsGetter = require('../getters/products');
  var logger = require('../helpers/logger');

  var productGetterModel = productsGetter.getProducts(filterParameters);
  var productSearchHits = productGetterModel.productSearchHits;

  var count = xmlConverter.createXmlFileFromProductSearchHits(
    filePath,
    productSearchHits,
    writeParameters,
    productGetterModel
  );

  logger.log(moduleName, 'info', 'Written ' + count + ' products to a new XML file.');
}

function execute(parameters, stepExecution) {
  // Salesforce objects
  var Status = require('dw/system/Status');

  // Helper objects
  var config = require('../helpers/config');
  var logger = require('../helpers/logger');
  var files = require('../helpers/files');

  // Parameters: Note that the casing is important here (e.g. `PascalCase`).
  var includeMasterProductsOutOfStock = parameters.IncludeMasterProductsOutOfStock;
  var partialByLastSyncDate = parameters.PartialByLastSyncDate;
  var sendOfflineVariants = parameters.SendOfflineVariants;
  var searchPhrase = parameters.SearchPhrase;
  var categoryId = parameters.CategoryId;
  var ids = parameters.Ids;
  var includeSlicedProducts = parameters.IncludeSlicedProducts;

  var hasFilters = !!searchPhrase || !!categoryId || !!ids;

  var lastSyncDate = partialByLastSyncDate
    ? config.getLastSyncDate(stepExecution.jobExecution.jobID, parameters.Locale)
    : null;

  var filePath = files.getFilePath(parameters.WriteFolder, 'products');
  stepExecution.jobExecution.context.rootPath = parameters.WriteFolder;
  stepExecution.jobExecution.context.lastSyncDate = lastSyncDate;
  stepExecution.jobExecution.context.locale = parameters.Locale;
  stepExecution.jobExecution.context.hasFilters = hasFilters;
  stepExecution.jobExecution.context.startedAt = new Date();
  stepExecution.jobExecution.context.filePath = filePath;

  // Init logs
  logger.log(moduleName, 'info', 'Writing new product XML files to: ' + filePath);
  logger.log(moduleName, 'info', 'parameters.includeMasterProductsOutOfStock: ' + includeMasterProductsOutOfStock);
  logger.log(moduleName, 'info', 'parameters.partialByLastSyncDate: ' + partialByLastSyncDate);
  logger.log(moduleName, 'info', 'parameters.sendOfflineVariants: ' + sendOfflineVariants);
  logger.log(moduleName, 'info', 'parameters.searchPhrase: ' + searchPhrase);
  logger.log(moduleName, 'info', 'parameters.locale: ' + parameters.Locale);
  logger.log(moduleName, 'info', 'parameters.categoryId: ' + categoryId);
  logger.log(moduleName, 'info', 'parameters.ids: ' + ids);
  logger.log(moduleName, 'info', 'parameters.includeSlicedProducts: ' + includeSlicedProducts);

  if (lastSyncDate) {
    logger.log(moduleName, 'info', 'Performing partial sync using last sync date: ' + lastSyncDate);
  } else {
    logger.log(moduleName, 'info', 'Performing full sync.');
  }

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
    stepExecution.jobExecution.context.locale = parameters.Locale;
  }

  // Prep file system folders
  if (!files.ensureConstructorFolderExists(parameters.WriteFolder)) {
    logger.log(moduleName, 'error', 'Unable to create folder to store cartridge data');
    return new Status(Status.ERROR);
  }

  // Write data
  writeProductsToXml(
    filePath,
    {
      sendOfflineVariants: sendOfflineVariants,
      lastSyncDate: lastSyncDate
    },
    {
      includeMasterProductsOutOfStock: includeMasterProductsOutOfStock,
      searchPhrase: searchPhrase,
      categoryId: categoryId,
      ids: ids,
      includeSlicedProducts: includeSlicedProducts
    }
  );

  // Finish sync
  logger.log(moduleName, 'info', 'Finished writing product XML files');
  return new Status(Status.OK);
}

module.exports.execute = execute;
