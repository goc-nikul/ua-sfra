var syncAgent = null;

/**
 * @param {import('../types').RawSyncProductsJobParameters} rawParameters
 * @param {dw.job.JobStepExecution} stepExecution
 */
module.exports.beforeStep = function (rawParameters, stepExecution) {
  if (rawParameters.Locale) {
    /**
     * Request is a global object that is available in all job steps.
     * Using this, we can set the locale for the current request.
     *
     * See:
     * - https://salesforcecommercecloud.github.io/b2c-dev-doc/docs/current/scriptapi/html/index.html?target=class_dw_system_Request.html
     */
    request.setLocale(rawParameters.Locale);
  }

  var parseProductParameters = require('*/cartridge/scripts/jobs/sync/products/parseProductParameters');
  var buildProductApiPayload = require('*/cartridge/scripts/jobs/sync/products/buildProductApiPayload');
  var transformProduct = require('*/cartridge/scripts/helpers/products/transformProduct');
  var ProductReader = require('*/cartridge/scripts/jobs/sync/products/productReader');
  var SyncAgent = require('*/cartridge/scripts/jobs/sync/syncAgent');
  var feedTypes = require('*/cartridge/scripts/constants/feedTypes');

  var parameters = parseProductParameters(rawParameters, stepExecution);

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
