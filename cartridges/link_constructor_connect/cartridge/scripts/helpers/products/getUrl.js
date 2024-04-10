var URLUtils = require('dw/web/URLUtils');

/**
 * Parses the product URL.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns The url.
 */
module.exports = function getURL(product) {
  return URLUtils.abs('Product-Show', 'pid', product.ID).toString();
};
