var syncAgent = null;

/**
 * @param {import('../types').SyncJobBaseParameters} rawParameters
 * @param {dw.job.JobStepExecution} stepExecution
 */
module.exports.beforeStep = function (rawParameters, stepExecution) {
  var buildCategorySectionApiPayload = require('*/cartridge/scripts/jobs/sync/categories/buildCategorySectionApiPayload');
  var transformCategorySection = require('*/cartridge/scripts/helpers/categories/transformCategorySection');
  var CategoryReader = require('*/cartridge/scripts/jobs/sync/categories/categoryReader');
  var parseBaseParameters = require('*/cartridge/scripts/jobs/sync/parseBaseParameters');
  var SyncAgent = require('*/cartridge/scripts/jobs/sync/syncAgent');
  var feedTypes = require('*/cartridge/scripts/constants/feedTypes');

  var parameters = parseBaseParameters(rawParameters, stepExecution);

  syncAgent = SyncAgent.create({
    buildCustomApiPayload: buildCategorySectionApiPayload,
    reader: CategoryReader.create(),
    transformer: transformCategorySection,
    type: feedTypes.product,
    parameters: parameters
  });
};

module.exports.getTotalCount = function () {
  return syncAgent.getTotalCount();
};

module.exports.read = function () {
  return syncAgent.read();
};

/**
 * @param {dw.catalog.Category} category
 */
module.exports.process = function process(category) {
  return syncAgent.process(category);
};

/**
 * @param {dw.util.Collection} buffer The buffer to send.
 */
module.exports.write = function (buffer) {
  return syncAgent.write(buffer);
};

module.exports.afterStep = function () {
  return syncAgent.afterStep();
};
