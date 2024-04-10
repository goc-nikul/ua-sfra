var productFacetHelper = require('*/cartridge/scripts/helpers/products/productFacetHelper');

/**
 * Allows injecting custom facets into a product.
 *
 * @param {dw.catalog.Product} variant The variant.
 * @param {Object} data The product variation data.
 * @returns {Object} An object containing the facets for the variation.
 */
module.exports = function getFacetsForVariation(variant, data) {
  var facets = [
    {
      key: 'price',
      value: productFacetHelper.getPriceRefinement(data.listPrice, variant)
    },
    {
      key: 'listPrice',
      value: data.listPrice
    },
    {
      key: 'salePrice',
      value: data.salePrice
    },
    {
      key: 'currentHealth',
      value: data.inventory
    },
    {
      key: 'orderable',
      value: data.orderable
    },
    {
      key: 'hideColorWay',
      value: data.hideColorWay
    },
    {
      key: 'colorwayPrimary',
      value: productFacetHelper.getColorwayPrimary(variant.custom.colorway)
    },
    {
      key: 'giftsByPrice',
      value: data.inGiftsCategory ? data.minSalePrice : ''
    }
  ];

  // add customer group pricing for promos to facets
  if (data.promoPricingEnabled) {
    var customerGroupPricing = productFacetHelper.getCustomerGroupPricing(variant, data.promos, true);
    facets.push.apply(facets, Array.from(customerGroupPricing));
  }

  // add simple product attribute values to facets
  facets.push.apply(facets, Array.from(data.variationFacets));

  // add search refinement values to facets
  facets.push.apply(facets, Array.from(data.searchRefinements));

  return facets;
};
