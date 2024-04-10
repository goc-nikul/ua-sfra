/**
 * Parses the parent id from one product.
 * Returns null if the product is not a variant.
 * Returns the parent id if the product is a variant.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns {string | null} The parent id.
 */
module.exports = function getParentId(product) {
  if (
    !product.variant
    || !product.variationModel
    || !product.variationModel.master
  ) {
    return null;
  }

  return product.variationModel.master.ID;
};
