var getProductSearchModel = require('*/cartridge/scripts/helpers/products/getProductSearchModel');

/**
 * Queries for all products to be sent in a sync operation.
 *
 * @param {import('../../types').SyncProductsJobParameters} args The arguments passed to the job.
 * @returns {dw.util.Iterator} The product search hits.
 */
module.exports = function queryProducts(args) {
  var productSearchModel = getProductSearchModel(args);

  productSearchModel.search();

  return productSearchModel.getProductSearchHits();
};
