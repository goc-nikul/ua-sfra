var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var ProductSearchHit = require('dw/catalog/ProductSearchHit');
var CatalogMgr = require('dw/catalog/CatalogMgr');

/**
 * Parses the product IDs passed from parameters.
 * Ensures the input is treated as a string before splitting.
 * @param {string|dw.util.ArrayList} ids The product IDs to fetch, expected as a comma-separated string.
 * @returns {string[]} An array of product IDs.
 */
function parseIds(ids) {
  var result = [];

  if (ids instanceof dw.util.ArrayList) {
    ids = ids.toArray().join(',');
  }

  if (ids) {
    ids.split(',').forEach(function (id) {
      result.push(id.trim());
    });
  }

  return result;
}

/**
 * Returns the product types to fetch.
 * @param {boolean} hasIdsFilter Indicates if the product IDs filter is set.
 * @param {boolean} includeSlicedProducts Whether add sliced products into search model or not.
 * @returns {string[]} An array of product types to fetch.
 */
function getHitTypes(hasIdsFilter, includeSlicedProducts) {
  var result = [
    // Ignore:
    // ProductSearchHit.HIT_TYPE_PRODUCT_BUNDLE
    // ProductSearchHit.HIT_TYPE_VARIATION_GROUP

    // Only allow for these product types to be returned
    ProductSearchHit.HIT_TYPE_SIMPLE,
    ProductSearchHit.HIT_TYPE_PRODUCT_SET,
    ProductSearchHit.HIT_TYPE_PRODUCT_MASTER // variation master product
  ];

  /**
   * If the product IDs filter is set, we need to fetch the variation groups
   * so that we can also include all variations from a given variation
   * group in the results.
   */
  if (hasIdsFilter) {
    result.push(ProductSearchHit.HIT_TYPE_VARIATION_GROUP);
  }

  // Add slicing_group to support sliced products into search model
  if (includeSlicedProducts) {
    result.push('slicing_group');
  }

  return result;
}

/**
 * Fetches products from the current instance.
 * Returns an iterator of products.
 *
 * IMPORTANT: You can customize the way products are fetched on this file. Since we're using the
 * `ProductSearchModel` class, you can simply customize the query that fetches the products.
 *
 * You can also completely override the way products are fetched, as long as you return
 * an iterator of `ProductSearchHit` objects.
 *
 * Read more about iterators:
 * @see https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_util_Iterator.html
 * @see https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp?topic=%2Fcom.demandware.dochelp%2FScriptProgramming%2FIteratingoverObjects.html
 *
 * Read more about the ProductSearchModel class:
 * @see https://documentation.b2c.commercecloud.salesforce.com/DOC2/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_catalog_ProductSearchModel.html
 *
 * Read more about the ProductSearchHit class:
 * @see https://documentation.b2c.commercecloud.salesforce.com/DOC3/index.jsp?topic=%2Fcom.demandware.dochelp%2FDWAPI%2Fscriptapi%2Fhtml%2Fapi%2Fclass_dw_catalog_ProductSearchHit.html
 *
 * @see https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges/b2c-cartridges-customize
 *
 * @param {import('../../types').SyncProductsJobParameters} args The arguments passed to the job.
 *
 * @returns {dw.catalog.ProductSearchModel} The product search model, without starting the search.
 */
module.exports = function getProductSearchModel(args) {
  var productSearchModel = new ProductSearchModel();

  var idsList = parseIds(args.ids);
  var hasIdsFilter = !empty(idsList);

  // Filter by the category (or root by default)
  productSearchModel.setCategoryID(
    args.categoryId
      ? args.categoryId
      : CatalogMgr.getSiteCatalog().getRoot().getID()
  );

  // Search recursively in the provided category
  productSearchModel.setRecursiveCategorySearch(true);

  /**
   * Filter only orderable products.
   *
   * Defaults to `true`, so that the cartridge only sends master products that have
   * at least one variant in stock. This is good for performance, since it avoids
   * sending products that are not orderable.
   *
   * If set to `false`, master products with all variants out of stock will be returned.
   * Note that this will heavily impact performance.
   */
  productSearchModel.setOrderableProductsOnly(!args.includeMasterProductsOutOfStock);

  // Filter products by type
  productSearchModel.addHitTypeRefinement(getHitTypes(hasIdsFilter, args.includeSlicedProducts));

  // Filter products by ID
  if (hasIdsFilter) {
    productSearchModel.setProductIDs(args.ids);
  }

  // Filter all products with query
  productSearchModel.setSearchPhrase(args.searchPhrase || '');

  return productSearchModel;
};
