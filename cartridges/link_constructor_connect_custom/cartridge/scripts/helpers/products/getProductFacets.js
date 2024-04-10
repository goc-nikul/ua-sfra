var productFacetHelper = require('*/cartridge/scripts/helpers/products/productFacetHelper');

/**
 * Allows injecting custom facets into a product.
 *
 * In Constructor, you:
 * - Use facets to allow users to filter your products.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns {Object} An object containing the facets for the product.
 */
module.exports = function getFacetsAndMetadata(product, data) {
  var facets = [
    {
      key: 'categoryID',
      value: productFacetHelper.getCategoryID(product)
    },
    {
      key: 'listPriceLow',
      value: data.minListPrice
    },
    {
      key: 'listPriceHigh',
      value: data.maxListPrice
    },
    {
      key: 'salePriceLow',
      value: product.ID === 'GC-0001-ALL' || product.ID === 'GC00001' ? [10, 30, 70, 80, 110, 210] : data.minSalePrice
    },
    {
      key: 'salePriceHigh',
      value: data.maxSalePrice
    },
    {
      key: 'icons',
      value: productFacetHelper.getIcons(product)
    }
  ];

  // add simple product attribute values to facets
  facets.push.apply(facets, Array.from(data.itemFacets));

  // add search refinement values to facets
  facets.push.apply(facets, Array.from(data.searchRefinements));

  return facets;
};
