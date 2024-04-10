var getLastSyncDate = require('*/cartridge/scripts/helpers/config/lastSyncDate/getLastSyncDate');
var stringToArrayList = require('*/cartridge/scripts/helpers/utils/stringToArrayList');
var parseBaseParameters = require('*/cartridge/scripts/jobs/sync/parseBaseParameters');
var merge = require('*/cartridge/scripts/helpers/utils/merge');
var logger = require('*/cartridge/scripts/helpers/logger');

/**
 * @param {import('../../../types').RawSyncProductsJobParameters} rawParameters
 * @param {dw.job.JobStepExecution} stepExecution
 * @returns The parsed job parameters.
 */
module.exports = function parseProductParameters(rawParameters, stepExecution) {
  var baseParameters = parseBaseParameters(rawParameters, stepExecution);

  // Initialize the parameters. Note that casing is important here.
  var parameters = {
    // Filters
    ids: stringToArrayList(rawParameters['Filters.Ids']),
    searchPhrase: rawParameters['Filters.SearchPhrase'],
    categoryId: rawParameters['Filters.CategoryId'],
    lastSyncDate: null,
    hasFilters: false,

    // Flags
    includeMasterProductsOutOfStock: rawParameters.IncludeMasterProductsOutOfStock,
    partialByLastSyncDate: rawParameters.PartialByLastSyncDate,
    sendOfflineVariants: rawParameters.SendOfflineVariants,
    ingestionStrategy: rawParameters.IngestionStrategy,
    section: rawParameters.Section
  };

  parameters.hasFilters = (
    !!parameters.searchPhrase
    || !!parameters.categoryId
    || !empty(parameters.ids)
  );

  if (parameters.partialByLastSyncDate) {
    parameters.lastSyncDate = getLastSyncDate(baseParameters.jobID, baseParameters.locale);
  }

  if (parameters.lastSyncDate) {
    logger.log('Starting a new partial sync using last sync date:' + parameters.lastSyncDate);
  } else {
    logger.log('Starting a new full sync.');
  }

  logger.log('Initialized product job parameters: ' + JSON.stringify(parameters));

  return merge(baseParameters, parameters);
};
