var moduleName = 'writeInventoryFiles.js';

/**
 * Writes all inventory data to a XML file.
 * @param {string} filePath The file path to write to.
 * @param {import('../types').WriteProductXmlParameters} writeParameters The arguments passed to the xml writer.
 * @param {import('../types').ProductJobParameters} parameters The arguments passed to the products getter.
 */
function writeInventoryToXml(filePath, writeParameters, filterParameters) {
  var inventoriesGetter = require('../getters/inventories');
  var xmlConverter = require('../helpers/xmlConverter');
  var logger = require('../helpers/logger');

  var inventoriesIterator = inventoriesGetter.getAllInventories(filterParameters);

  var count = xmlConverter.createInventoryXmlFileFromProductSearchHits(
    filePath,
    inventoriesIterator,
    writeParameters
  );

  logger.log(moduleName, 'info', 'Written ' + count + ' inventories to a new XML file.');
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

  var hasFilters = !!searchPhrase || !!categoryId || !!ids;

  var lastSyncDate = partialByLastSyncDate
    ? config.getLastSyncDate(stepExecution.jobExecution.jobID, null)
    : null;

  var filePath = files.getFilePath(parameters.WriteFolder, 'inventories');
  stepExecution.jobExecution.context.rootPath = parameters.WriteFolder;
  stepExecution.jobExecution.context.lastSyncDate = lastSyncDate;
  stepExecution.jobExecution.context.hasFilters = hasFilters;
  stepExecution.jobExecution.context.startedAt = new Date();
  stepExecution.jobExecution.context.filePath = filePath;

  // Init logs
  logger.log(moduleName, 'info', 'Writing new inventory XML files to: ' + filePath);
  logger.log(moduleName, 'info', 'parameters.includeMasterProductsOutOfStock: ' + includeMasterProductsOutOfStock);
  logger.log(moduleName, 'info', 'parameters.partialByLastSyncDate: ' + partialByLastSyncDate);
  logger.log(moduleName, 'info', 'parameters.sendOfflineVariants: ' + sendOfflineVariants);
  logger.log(moduleName, 'info', 'parameters.searchPhrase: ' + searchPhrase);
  logger.log(moduleName, 'info', 'parameters.categoryId: ' + categoryId);
  logger.log(moduleName, 'info', 'parameters.ids: ' + ids);

  if (lastSyncDate) {
    logger.log(moduleName, 'info', 'Performing partial sync using last sync date: ' + lastSyncDate);
  } else {
    logger.log(moduleName, 'info', 'Performing full sync.');
  }

  // Prep file system folders
  if (!files.ensureConstructorFolderExists(parameters.WriteFolder)) {
    logger.log(moduleName, 'error', 'Unable to create folder to store cartridge data');
    return new Status(Status.ERROR);
  }

  // Write data
  writeInventoryToXml(
    filePath,
    {
      sendOfflineVariants: sendOfflineVariants,
      lastSyncDate: lastSyncDate
    },
    {
      includeMasterProductsOutOfStock: includeMasterProductsOutOfStock,
      searchPhrase: searchPhrase,
      categoryId: categoryId,
      ids: ids
    }
  );

  // Finish sync
  logger.log(moduleName, 'info', 'Finished writing inventory XML files');
  return new Status(Status.OK);
}

module.exports.execute = execute;
