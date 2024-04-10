/**
 * Allows injecting custom facets and metadata into a product.
 *
 * In Constructor, you:
 * - Use facets to allow users to filter your products.
 * - Use metadata to store information about your products.
 *
 * Both facets and metadata are simple key-value pairs. The difference is that while metadata
 * can store objects, facets can only store primitive types or an array of primitive types.
 *
 * Whenever you store objects in metadata, you'll get the same object back when you query
 * the product from Constructor.
 *
 * For example, if you wanted to add a custom facet called "color", you can do it like this:
 *
 * ```javascript
 * return {
 *   metadata: [],
 *   facets: [
 *     {
 *       key: "color",
 *       value: "red",
 *     },
 *   ],
 * };
 * ```
 *
 * And if you're using metadata, you can add the string above but also objects:
 *
 * ```javascript
 * return {
 *   facets: [],
 *   metadata: [
 *     {
 *       key: "color",
 *       value: {
 *         name: "red",
 *         hex: "#FF0000",
 *         description: "This is a red color",
 *       },
 *     },
 *   ],
 * };
 * ```
 *
 * @param {dw.catalog.Product} product The product.
 * @returns {Object} An object containing the facets and metadata for the product.
 */
module.exports = function getFacetsAndMetadata(_product) {
  return {
    facets: [],
    metadata: []
  };
};
