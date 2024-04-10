/**
 * Parses one attribute value.
 * @param {*} value The value.
 * @returns {*} The parsed value.
 */
function parseAttributeValue(value) {
  /**
   * If for some reason the value is falsy, we'll return null
   * to avoid breaking in the next checks.
   */
  if (!value) {
    return null;
  }

  /**
   * For markup text values, we'll want to extract the text content.
   */
  if (value.constructor.name === 'dw.content.MarkupText') {
    return value.markup;
  }

  /**
   * For enumerators, we just want to extract the value.
   */
  if (value.constructor.name === 'dw.value.EnumValue') {
    return value.value;
  }

  /**
   * Some custom values can be native string arrays in Java.
   * If so, the value will look like this upon inspecting: `"Ljava.lang.String;@3023900b`.
   * In those cases, we want to loop over the values to extract them.
   */
  if (value.constructor.name === 'Array') {
    var result = [];

    for (var i = 0; i < value.length; i += 1) {
      var innerValue = parseAttributeValue(value[i]);
      result.push(innerValue);
    }

    return result;
  }

  /**
   * Otherwise, we'll assume that the value is a normal string and we can
   * simply use its value or `null` in case it's falsy.
   */
  return value || null;
}

/**
 * Dynamically retrieves the value or display value of a specified product attribute.
 * Supports dot notation for nested attributes in the product object.
 *
 * @param {*} product - The product object.
 * @param {string} attributeID - Dot-notated string representing the attribute to retrieve.
 * @returns {Object|null} - The attribute's value or display value, or null if not found.
 */
module.exports = function getAttributeValue(product, attributeID) {
  var value = product.custom[attributeID];

  return parseAttributeValue(value);
};
