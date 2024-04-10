var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var ArrayList = require('dw/util/ArrayList');
var logger = require('*/cartridge/scripts/helpers/logger');

/**
 * Builds the search refinements for the passed product or category.
 * Creates a query to match the correct refinements.
 *
 * @param {Object} filter The product or category to filter by.
 * @param {'product' | 'category'} searchType The type of search.
 * @param {boolean | null} orderableOnly The product or category to filter by.
 * @returns {*} The product search refinements.
 */
module.exports = function getSearchRefinements(filter, searchType, orderableOnly) {
  // create the product search model and set options
  var productSearchModel = new ProductSearchModel();

  if (!empty(orderableOnly)) {
    // we're overriding the default behavior in the else block below
    productSearchModel.setOrderableProductsOnly(orderableOnly);
  } else {
    /**
     * Here, we're setting orderable products only since we want to include products
     * that are unavailable (e.g. out of stock) in the query to make sure that their
     * search refinement values are returned.
     *
     * If we set this to `true`, the search refinement values will not be found for
     * those products.
     */
    productSearchModel.setOrderableProductsOnly(false);
  }

  if (searchType === 'product') {
    var ids = new ArrayList();

    // Filter by the product ID to match the correct refinements
    ids.add(filter.ID);
    productSearchModel.setProductIDs(ids);

    // set category as the site catalogs root category
    productSearchModel.setCategoryID(CatalogMgr.getSiteCatalog().getRoot().getID());
    productSearchModel.setRecursiveCategorySearch(true);
  } else {
    productSearchModel.setCategoryID(filter.ID);
    productSearchModel.setRecursiveCategorySearch(false);
  }

  // Execute the search
  productSearchModel.search();

  try {
    return productSearchModel.getRefinements();
  } catch (e) {
    logger.log('categoryHelper', 'error', 'productSearchModel.getRefinements() failed on ' + searchType + ' ' + filter.ID);

    return null;
  }
};
