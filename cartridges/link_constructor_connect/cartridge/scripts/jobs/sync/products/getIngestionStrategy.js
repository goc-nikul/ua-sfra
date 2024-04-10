var ingestionStrategies = require('*/cartridge/scripts/constants/ingestionStrategies');
var logger = require('*/cartridge/scripts/helpers/logger');

/**
 * Builds the ingestion strategy to send in the payload.
 * @param {import('../../../types').SyncProductsJobParameters} params The function parameters.
 * @returns {string} The ingestion strategy.
 */
module.exports = function getIngestionStrategy(params) {
  /**
   * If we're sending a full ingestion and there are filters, we need to send a DELTA instead.
   * Otherwise, we can end up overriding the catalog with a partial catalog.
   */
  if (params.hasFilters && params.ingestionStrategy === ingestionStrategies.full) {
    logger.log('Forcing a DELTA ingestion strategy because there are filters.');
    return ingestionStrategies.delta;
  }

  /**
   * If we're sending a full ingestion while filtering only the items updated since the last sync date (without filters),
   * we need to send a DELTA instead. Otherwise, we can end up overriding the catalog with a partial catalog.
   */
  if (params.lastSyncDate && params.ingestionStrategy === ingestionStrategies.full) {
    logger.log('Forcing a DELTA ingestion strategy because we are doing a partial sync by last sync date');
    return ingestionStrategies.delta;
  }

  return params.ingestionStrategy;
};
