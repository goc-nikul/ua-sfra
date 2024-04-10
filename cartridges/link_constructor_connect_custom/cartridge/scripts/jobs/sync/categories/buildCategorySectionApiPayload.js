var ingestionStrategies = require('*/cartridge/scripts/constants/ingestionStrategies');

/**
 * Builds the custom API payload for a category section sync.
 * @param {import('../../../types').SyncJobBaseParameters} parameters
 */
module.exports = function buildCategorySectionApiPayload(_parameters) {
  return {
    strategy: ingestionStrategies.full,
    section: 'Categories'
  };
};
