var getAttributeValue = require('*/cartridge/scripts/helpers/products/getAttributeValue');

/**
 * Parses the product description.
 *
 * @param {dw.catalog.Product} product The product.
 * @returns The parsed description, or null if not found.
 */
module.exports = function getDescription(product) {
  var productDescriptionAttribute = 'whatsItDo';

  return getAttributeValue(product, productDescriptionAttribute) || null;
};
