/**
 * Parses the product categories.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns {Array<string>} The parsed categories.
 */
module.exports = function getCategories(product) {
  if (!product.categories) return [];

  return product.categories.toArray().map(function (category) {
    return category.ID;
  });
};
