/**
 * Parses one attribute value.
 * @param {any} value The value.
 * @returns The parsed value.
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
   * Otherwise, we'll assume that the value is a normal js object and return it.
   */
  return value;
}

/**
 * Returns an attribute value for a given product.
 * Handles attribute types that may cause failures, such as native Java / Rhino types.
 *
 * @param {dw.catalog.Product} product The product.
 * @param {string} attributeID The attribute id.
 * @returns The attribute value.
 */
module.exports = function getAttributeValue(product, attributeID) {
  var value = product.custom[attributeID];

  return parseAttributeValue(value);
};
