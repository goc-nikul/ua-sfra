/**
 * Returns the last modified date of a product.
 *
 * @param {dw.catalog.Product} product The product.
 */
module.exports = function getLastModifiedDate(product) {
  return new Date(product.lastModified);
};
