var productMetadataHelper = require('*/cartridge/scripts/helpers/products/productMetadataHelper');
var getReleaseDate = require('*/cartridge/scripts/helpers/products/getReleaseDate');

/**
 * Allows injecting custom metadata into a product.
 *
 *
 * @param {dw.catalog.Product} variant The variant.
 * @param {Object} data The product variation data.
 * @returns {Object} An object containing the metadata for the variation.
 */
module.exports = function getFacetsAndMetadataForVariation(variant, data) {
  var colorAttribute = variant.variationModel.getProductVariationAttribute('color');

  var meta = [
    {
      key: 'json:hexColor',
      value: productMetadataHelper.getHexColor(variant)
    },
    {
      key: 'upc',
      value: variant.getUPC()
    },
    {
      key: 'json:colorWayId',
      value: productMetadataHelper.getColorWayId(variant)
    },
    {
      key: 'colorValue',
      value: productMetadataHelper.getColorValue(variant, colorAttribute)
    },
    {
      key: 'defaultColor',
      value: productMetadataHelper.getDefaultColor(variant, colorAttribute)
    },
    {
      key: 'currentHealth',
      value: data.inventory
    },
    {
      key: 'gridTileHoverImageURL',
      value: productMetadataHelper.getGridTileHoverImage(variant, data.sizeModelImages)
    },
    {
      key: 'imageName',
      value: !empty(data.imageData) && 'title' in data.imageData ? data.imageData.title : ''
    },
    {
      key: 'imageFileName',
      value: !empty(data.imageData) && 'fileName' in data.imageData ? data.imageData.fileName : ''
    },
    {
      key: 'imageRecipe',
      value: !empty(data.imageData) && 'recipe' in data.imageData ? data.imageData.recipe : ''
    },
    {
      key: 'imageViewType',
      value: !empty(data.imageData) && 'viewType' in data.imageData ? data.imageData.viewType : ''
    },
    {
      key: 'json:secondaryHexColor',
      value: productMetadataHelper.getSecondaryHexColor(variant)
    },
    {
      key: 'json:defaultColorwayId',
      value: data.defaultColorwayId
    },
    {
      key: 'hideColorWay',
      value: data.hideColorWay
    },
    {
      key: 'exclusiveType',
      value: productMetadataHelper.getExclusiveType(variant)
    },
    {
      key: 'orderable',
      value: data.orderable
    },
    {
      key: 'preorderable',
      value: variant.availabilityModel.getAvailabilityLevels(1).getPreorder().getValue() > 0
    },
    {
      key: 'preorderMessage',
      value: data.preorderMessages
    },
    {
      key: 'json:sizeModelImages',
      value: productMetadataHelper.getSizeModelImageURLs(data)
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
      key: 'sortOptions',
      value: data.sortOptions
    },
    {
      key: 'is_default',
      value: productMetadataHelper.isDefaultColorwayId(variant)
    },
    {
      key: '__cnstrc_release_time',
      value: getReleaseDate(variant)
    }
  ];

  meta.push.apply(meta, Array.from(data.variationMeta));

  return meta;
};
