var moduleName = 'inventory.js';

/**
 * Fetches all inventories from the current instance.
 * Returns an iterator of all inventories.
 *
 * * Read more about iterators:
 * @see https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_util_Iterator.html
 * @see https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FScriptProgramming%2FIteratingoverObjects.html
 *
 * IMPORTANT: You can customize the way inventories are fetched on this file, but keep in mind
 * that you'll need to return an iterator so that the rest of the integration can work.
 *
 * The iterator payload must follow the following structure:
 *
 * ```js
 * {
 *   productId: 'product-id',
 *   parentId: 'parent-id' | null,
 *   allocation: 42,
 * }
 * ```
 *
 * @see https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges/b2c-cartridges-customize
 *
 * @param {import('../types').ProductJobParameters} parameters The arguments passed to the products getter.
 * @returns {dw.util.Iterator | null} An iterator of all inventories. Null if not found.
 */
function getAllInventories(parameters) {
  var ProductInventoryIterator = require('../helpers/productInventoryIterator');
  var productsGetter = require('./products');
  var logger = require('../helpers/logger');

  var productQuery = productsGetter.getProducts(parameters);

  var result = ProductInventoryIterator.create(
    productQuery.numberOfRecords,
    productQuery.productSearchHits
  );

  logger.log(moduleName, 'info', 'Found ' + result.size + ' products to sync.');

  return result;
}

module.exports.getAllInventories = getAllInventories;
