var ingestionStrategies = require('*/cartridge/scripts/constants/ingestionStrategies');

/**
 * Builds the custom API payload for a category sync.
 * @param {import('../../../types').SyncJobBaseParameters} parameters
 */
module.exports = function buildCategoryApiPayload(_parameters) {
  return {
    strategy: ingestionStrategies.full
  };
};
