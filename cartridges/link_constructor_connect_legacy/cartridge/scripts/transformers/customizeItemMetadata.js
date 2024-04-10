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
 * Allows injecting custom metadata into a product. This is useful if you want to have information
 * that you will not use to filter your products (you should use facets for that), but that you
 * want to be able to access when dealing with your catalog data.
 *
 * For example, if you wanted to add a custom metadata called "color",
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
 * The `value` can be a string, an array of strings or an object (which will be converted to JSON).
 * If you want to store complex information in your metadata, you can do so with objects:
 *
 * ```javascript
 * [
 *  {
 *   key: "color",
 *   value: {
 *     name: "red",
 *     hex: "#FF0000",
 *     description: "This is a red color",
 *   },
 *  },
 * ]
 * ```
 *
 * @param {Object} product The product.
 * @returns {Array} An array of objects representing custom metadata.
 */
function getItemMetadata(_product) {
  return [];
}

module.exports.getItemMetadata = getItemMetadata;
