var getFacetsAndMetadataForVariation = require('*/cartridge/scripts/helpers/products/getFacetsAndMetadataForVariation');
var getFacetsAndMetadata = require('*/cartridge/scripts/helpers/products/getFacetsAndMetadata');
var getDescription = require('*/cartridge/scripts/helpers/products/getDescription');
var getCategories = require('*/cartridge/scripts/helpers/products/getCategories');
var getParentId = require('*/cartridge/scripts/helpers/products/getParentId');
var getKeywords = require('*/cartridge/scripts/helpers/products/getKeywords');
var getImage = require('*/cartridge/scripts/helpers/products/getImage');
var getUrl = require('*/cartridge/scripts/helpers/products/getUrl');

/**
 * Transforms a product into the format expected by Constructor.
 *
 * @param {dw.catalog.Product} product The product.
 * @param {object} data The data computed by the reader.
 *
 * @returns {object} The transformed data.
 */
module.exports = function transformProduct(product, _data) {
  var result = {
    /**
     * ID fields. These are required for the integration to work.
     * You should not remove these.
     */
    id: product.ID,

    /**
     * Hierarchy fields. These are optional, but you need to fill them if you want the cartridge
     * to import your product hierarchy as items and variations in Constructor.
     *
     * In short, if `item_id` is null, the product will be imported as an item.
     * If `item_id` is not null, the product will be imported as a variation.
     *
     * Note that to import a variation, you need to have the item with the same id in the payload.
     * Note that the `item_id` should always point to another existing `id` field.
     */
    item_id: getParentId(product),

    /**
     * Data fields. These are optional, but you should keep them if you
     * want to ingest those pieces of data using the cartridge.
     */
    active: product.online,
    item_name: product.name || product.ID,
    description: getDescription(product),
    group_ids: getCategories(product),
    keywords: getKeywords(product),
    image_url: getImage(product),
    url: getUrl(product)
  };

  /**
   * Here, we'll populate facets and metadata depending on whether
   * the product is a variation or not.
   */
  if (result.item_id) {
    var variantAttributes = getFacetsAndMetadataForVariation(product);
    result.metadata = variantAttributes.metadata;
    result.facets = variantAttributes.facets;
  } else {
    var attributes = getFacetsAndMetadata(product);
    result.metadata = attributes.metadata;
    result.facets = attributes.facets;
  }

  return result;
};
