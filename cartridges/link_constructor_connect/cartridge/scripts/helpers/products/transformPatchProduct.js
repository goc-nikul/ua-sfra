var getParentId = require('*/cartridge/scripts/helpers/products/getParentId');

/**
 * Transforms a product into the format expected by Constructor.
 *
 * Note that this transformer is intended to patch products, updating only a few pieces of data
 * instead of sending the whole product - like you can see in the `transformProduct` transformer.
 *
 * Technically this transformer can update any field defined in the `transformProduct` transformer,
 * but it is meant for smaller updates.
 *
 * For example, you can use this transformer to update pricing and stock information at frequent
 * periods, such as an update at every 15 minutes.
 *
 * @param {dw.catalog.Product} product The product.
 * @param {object} data The data computed by the reader.
 *
 * @returns {object} The transformed data.
 */
module.exports = function transformPatchProduct(product, _data) {
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
    facets: [
      // Add any facet you want to ingest here
    ],
    metadata: [
      // Add any metadata you want to ingest here
    ]
  };

  return result;
};
