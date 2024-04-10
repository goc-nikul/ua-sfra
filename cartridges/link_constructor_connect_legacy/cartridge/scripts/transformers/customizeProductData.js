/**
 * In this module, we export a function that can be overlaid so that you can customize
 * the way that the catalog data is transformed.
 *
 * Ideally, you should create an overlay cartridge to override this function. You can also
 * edit this file directly to customize it, but note that you'll potentially have to deal
 * with merge conflicts if you choose to directly modify the cartridge source code.
 *
 * IMPORTANT: You can customize any value transformed on this file, but changing the data structure
 * itself will likely break the integration. Newly added keys will not be recognized when
 * ingesting catalog data, and removed keys will cause the ingestion to fail.
 *
 * @see https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges/b2c-cartridges-customize
 */

/**
 * Parses one image from a product.
 *
 * @param {Object} product The product.
 * @returns {string | null} The parsed image.
 */
function parseImage(product) {
  var imageIndex = 0;
  var i = 0;
  var image;

  /**
   * Media types to scan. The first image found will be used.
   * If you want to use a different image, you can change the order of the media types or
   * add more media types to the list.
   */
  var viewTypes = [
    'Product',
    'large',
    'grid',
    'default'
  ];

  for (i = 0; i < viewTypes.length; i += 1) {
    image = product.getImage(viewTypes[i], imageIndex);
    if (image) break;
  }

  if (!image) return null;

  return image.getURL().toString();
}

/**
 * Parses the product categories.
 *
 * @param {Object} categories The categories.
 * @returns {Array} The parsed categories.
 */
function parseCategories(categories) {
  if (!categories) return [];

  return categories.toArray().map(function handler(category) {
    return {
      displayName: category.displayName,
      uuid: category.UUID,
      id: category.ID
    };
  });
}

/**
 * Parses the product description.
 * @param {Object} product The product.
 * @returns The parsed description, or null if not found.
 */
function parseDescription(product) {
  if (product.longDescription) {
    return product.longDescription.toString();
  }

  if (product.shortDescription) {
    return product.shortDescription.toString();
  }

  return null;
}

/**
 * Allows customizing the product data that is ingested. By default, the cartridge aims to provide
 * a generic "base layer" of transformation so that we get all required product information
 * into Constructor. You can override this to add, customize or remove data to your needs.
 *
 * Assuming you're using the cartridge to export your products to Constructor (meaning they
 * don't exist there yet), you'll need to keep most information here since that is required.
 * If you already have products in Constructor, you can remove data as needed, and the only
 * required field is the id - since we need to identify which products we're modifying.
 *
 * For example, some ways in which you might want to use the cartridge:
 *
 * a) Create/update products in Constructor using your Salesforce data.
 *
 * b) Handle only a few facets or metadata (e.g. your inventory, price or promotions) and
 *    leave the rest to be handled by other integrations - assuming those exist.
 *
 * @param {Object} product The product.
 * @returns {Object} The transformed product data.
 */
function getProductData(product) {
  var variationTransformer = require('./variationTransformer');

  return {
    /**
     * ID fields. These are required for the integration to work.
     * You should not remove these.
     */
    uuid: product.UUID,
    id: product.ID,

    /**
     * Data fields. These are optional, but you should keep them if you
     * want to ingest this data into Constructor via this cartridge.
     */
    pageURL: dw.web.URLUtils.abs('Product-Show', 'pid', product.ID).toString(),
    name: product.name || product.ID || product.UUID,
    categories: parseCategories(product.categories),
    description: parseDescription(product),
    image: parseImage(product),
    online: product.online,

    /**
     * Hierarchy fields. These are optional, but you need to fill them if you want the cartridge
     * to import your product hierarchy as items and variations in Constructor.
     *
     * In short, if `parentId` is null, the product will be imported as an item.
     * If `parentId` is not null, the product will be imported as a variation.
     *
     * Note: to import a variation, you need to have the item with the same
     * id in the payload.
     *
     * Note: the `parentId` always points to the `id` field.
     */
    parentId: variationTransformer.parseParentId(product)
  };
}

module.exports.getProductData = getProductData;
