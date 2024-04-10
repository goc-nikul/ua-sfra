/**
 * Allows injecting custom facets and metadata into a product.
 * This function is the same as `getFacetsAndMetadata`, but it's used for variations.
 *
 * Refer to the documentation at:
 * @see {@link ('./getFacetsAndMetadata.js')}
 *
 *
 * @param {dw.catalog.Product} variant The variant.
 * @returns {Object} An object containing the facets and metadata for the variation.
 */
module.exports = function getFacetsAndMetadataForVariation(_variant) {
  return {
    facets: [],
    metadata: []
  };
};
