/**
 * Retrieves the default colorway ID for a given product. If the default colorway ID is available,
 * it returns a JSON string with an object containing the ID. If not available, it returns a JSON
 * string with an object where the ID is null.
 *
 * @param {dw.catalog.Product} product The product from which to retrieve the default colorway ID.
 * @returns {string} A JSON string. The object contains the defaultColorwayId property, which is
 * either a JSON string of an object with the ID or null.
 */
module.exports = function getDefaultColorwayId(product) {
  var defaultColorway = product && !empty(product.custom.defaultColorway) ? product.custom.defaultColorway : null;

  return !empty(defaultColorway) ? JSON.stringify({ id: defaultColorway }) : defaultColorway;
};
