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
 * Allows injecting custom facets into a product. This is useful if you want to have information
 * to filter your products by, such as color, size, etc.
 *
 * For example, if you wanted to add a custom facet called "color",
 * you would want to return an array of objects like this:
 *
 * ```javascript
 * [
 *  {
 *   key: "color",
 *   value: "red",
 *  },
 * ]
 * ```
 *
 * The `value` can be a string or an array of strings.
 *
 * @param {Object} product The product.
 * @returns {Array} An array of objects representing custom facets.
 */
function getItemFacets(_product) {
  return [];
}

module.exports.getItemFacets = getItemFacets;
