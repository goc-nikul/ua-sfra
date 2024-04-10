/**
 * Dynamically retrieves the value or display value of a specified product attribute.
 * Supports dot notation for nested attributes in the product object.
 *
 * @param {*} product - The product object.
 * @param {string} attributeID - Dot-notated string representing the attribute to retrieve.
 * @returns {Object|null} - The attribute's value or display value, or null if not found.
 */
module.exports = function getAttributeValuesFromName(product, attributeID) {
  var attributeValue = null;

  if (!empty(product) && product && !empty(attributeID) && attributeID) {
    var attributes = attributeID.split('.');
    if (attributes.length === 1) {
      attributeValue = !empty(product[attributes[0]]) ? product[attributes[0]] : null;
    } else if (attributes.length === 2) {
      attributeValue = !empty(product[attributes[0]]) && !empty(product[attributes[0]][attributes[1]]) ? product[attributes[0]][attributes[1]] : null;
    } else if (attributes.length === 3) {
      attributeValue = !empty(product[attributes[0]]) && !empty(product[attributes[0]][attributes[1]]) && !empty(product[attributes[0]][attributes[1]][attributes[2]]) ? product[attributes[0]][attributes[1]][attributes[2]] : null;
    }
  }

  return attributeValue;
};
