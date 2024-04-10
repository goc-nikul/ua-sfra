'use strict';

var ProductSearchModel = require('../../../mocks/dw/dw_catalog_ProductSearchModel');
var ProductSearchHit = require('../../../mocks/dw/dw_catalog_ProductSearchHit');
var CatalogMgr = require('../../../mocks/dw/dw_catalog_CatalogMgr');
var ArrayList = require('../../../mocks/dw/dw.util.Collection');

function parseIds(ids) {
  var result = new ArrayList();

  if (ids) {
    ids.split(',').forEach(function handler(id) {
      result.add(id.trim());
    });
  }

  return result;
}

function getHitTypes(hasIdsFilter, includeSlicedProducts) {
  var result = [
    ProductSearchHit.HIT_TYPE_SIMPLE,
    ProductSearchHit.HIT_TYPE_PRODUCT_SET,
    ProductSearchHit.HIT_TYPE_PRODUCT_MASTER // variation master product
  ];

 if (hasIdsFilter) {
    result.push(ProductSearchHit.HIT_TYPE_VARIATION_GROUP);
  }

  // Add slicing_group to support sliced products into search model
  if (includeSlicedProducts) {
    result.push('slicing_group');
  }

  return result;
}

function getProducts(args) {
  var productSearchModel = new ProductSearchModel();
  var productSearchHits = null;

  var idsList = parseIds(args.ids);
  var hasIdsFilter = !empty(idsList);

  // Filter by the category (root by default)
  var categoryId = args.categoryId
    ? args.categoryId
    : CatalogMgr.getSiteCatalog().getRoot().getID();

  productSearchModel.setCategoryID(categoryId);

  // Search recursively in the provided category
  productSearchModel.setRecursiveCategorySearch(true);

  productSearchModel.setOrderableProductsOnly(!args.includeMasterProductsOutOfStock);

  // Filter products by type
  productSearchModel.addHitTypeRefinement(getHitTypes(hasIdsFilter, args.includeSlicedProducts));

  // Filter products by ID
  if (hasIdsFilter) {
    productSearchModel.setProductIDs(idsList);
  }

  // Filter all products with query
  productSearchModel.setSearchPhrase(args.searchPhrase || '');

  // Execute the search
  productSearchModel.search();

  productSearchHits = productSearchModel.getProductSearchHits();

  return {
    productSearchHits: productSearchHits,
    numberOfRecords: productSearchModel.getCount(),
    productSearchModel: productSearchModel
  };
}

module.exports.getProducts = getProducts;
