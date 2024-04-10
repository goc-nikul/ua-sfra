var getIngestionStrategy = require('*/cartridge/scripts/jobs/sync/products/getIngestionStrategy');

/**
 * Builds the custom API payload for a product sync.
 * @param {import('../../../types').SyncProductsJobParameters} parameters
 */
module.exports = function buildProductApiPayload(parameters) {
  return {
    strategy: getIngestionStrategy(parameters),
    hasFilters: parameters.hasFilters || false,
    lastSyncDate: parameters.lastSyncDate,
    section: parameters.section
  };
};
