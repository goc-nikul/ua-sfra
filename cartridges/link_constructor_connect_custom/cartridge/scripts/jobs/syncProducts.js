var syncAgent = null;

/**
 * @param {import('../types').RawSyncProductsJobParameters} rawParameters
 * @param {dw.job.JobStepExecution} stepExecution
 */
module.exports.beforeStep = function (rawParameters, stepExecution) {
  var parseProductParameters = require('*/cartridge/scripts/jobs/sync/products/parseProductParameters');
  var parameters = parseProductParameters(rawParameters, stepExecution);

  var buildProductApiPayload = require('*/cartridge/scripts/jobs/sync/products/buildProductApiPayload');
  var transformProduct = require('*/cartridge/scripts/helpers/products/transformProduct');
  var ProductReader = require('*/cartridge/scripts/jobs/sync/products/productReader');
  var SyncAgent = require('*/cartridge/scripts/jobs/sync/syncAgent');
  var feedTypes = require('*/cartridge/scripts/constants/feedTypes');

  syncAgent = SyncAgent.create({
    reader: ProductReader.create({ parameters: parameters }),
    buildCustomApiPayload: buildProductApiPayload,
    transformer: transformProduct,
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
 * @param {dw.catalog.Product} product
 */
module.exports.process = function process(product) {
  return syncAgent.process(product);
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
