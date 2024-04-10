/**
 * Parses the product description.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns The parsed description, or null if not found.
 */
module.exports = function getDescription(product) {
  if (product.longDescription) {
    return product.longDescription.toString();
  }

  if (product.shortDescription) {
    return product.shortDescription.toString();
  }

  return null;
};
