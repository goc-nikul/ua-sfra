/**
 * Parses the product ID.
 *
 * Retrieves the SKU for a given product. For variants with a custom SKU defined,
 * it returns the custom SKU; otherwise, it returns the product's default ID.
 * @param {dw.catalog.Product} product - The product instance.
 * @returns {string} - The SKU or ID of the product.
 */
module.exports = function getProductId(product) {
  if (product.isVariant() && product.custom.sku && !empty(product.custom.sku)) {
    return product.custom.sku;
  }

  return product.ID;
};
