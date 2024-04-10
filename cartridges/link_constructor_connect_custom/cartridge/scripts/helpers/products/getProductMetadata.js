var productMetadataHelper = require('*/cartridge/scripts/helpers/products/productMetadataHelper');
var getReleaseDate = require('*/cartridge/scripts/helpers/products/getReleaseDate');

/**
 * Allows injecting custom metadata into a product.
 *
 * In Constructor, you:
 * - Use metadata to store information about your products.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns {Object} An object containing the metadata for the product.
 */
module.exports = function getFacetsAndMetadata(product, data) {
  var variantData = productMetadataHelper.getVariantData(product, data);
  var primaryCategory = product.getPrimaryCategory();

  var meta = [
    {
      key: 'onModelImageURL',
      value: productMetadataHelper.getOnModelImage(product)
    },
    {
      key: 'categoryPath',
      value: productMetadataHelper.getCategoryPath(product, primaryCategory)
    },
    {
      key: 'fitCare',
      value: productMetadataHelper.getFitCare(product)
    },
    {
      key: 'longDescription',
      value: product.getLongDescription()
    },
    {
      key: 'lastModified',
      value: product.getLastModified()
    },
    {
      key: 'masterColors',
      value: !empty(variantData) && 'colors' in variantData ? variantData.colors : ''
    },
    {
      key: 'masterSizes',
      value: !empty(variantData) && 'sizes' in variantData ? variantData.sizes : ''
    },
    {
      key: 'masterStockSizes',
      value: !empty(variantData) && 'qtys' in variantData ? variantData.qtys : ''
    },
    {
      key: 'variantSkuList',
      value: !empty(variantData) && 'skus' in variantData ? variantData.skus : ''
    },
    {
      key: 'variantUpcList',
      value: !empty(variantData) && 'upcs' in variantData ? variantData.upcs : ''
    },
    {
      key: 'videoMaterials',
      value: productMetadataHelper.getVideoMaterials(product)
    },
    {
      key: 'priceCurrency',
      value: productMetadataHelper.getPriceCurrency(product.priceModel)
    },
    {
      key: 'colorCount',
      value: productMetadataHelper.getSwatchCount(product.ID)
    },
    {
      key: 'json:defaultColorwayId',
      value: data.defaultColorwayId
    },
    {
      key: 'categoryUrl',
      value: !empty(primaryCategory) ? primaryCategory.getPageURL() : ''
    },
    {
      key: 'preorderMessage',
      value: data.preorderMessages
    },
    {
      key: 'json:promotions',
      value: productMetadataHelper.getPromotions(product)
    },
    {
      key: 'upperLeftFlameIcon',
      value: productMetadataHelper.getTileUpperLeftFlameIconBadge(product)
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
      key: 'sortOptions',
      value: data.sortOptions
    },
    {
      key: 'json:groupPricing',
      value: data.promoPricingEnabled && !empty(variantData) && 'customerGroupPricing' in variantData ? variantData.customerGroupPricing : ''
    },
    {
      key: 'isColorSlicedProduct',
      value: data.isSlicedProduct
    },
    {
      key: '__cnstrc_release_time',
      value: getReleaseDate(product)
    }
  ];

  // add simple product attribute values to meta
  meta.push.apply(meta, Array.from(data.itemMeta));

  return meta;
};
