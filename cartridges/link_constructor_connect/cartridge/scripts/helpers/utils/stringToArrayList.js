var ArrayList = require('dw/util/ArrayList');

/**
 * Converts a string separated by comma into an ArrayList.
 *
 * @example stringToArrayList('foo, bar, baz') => ['foo', 'bar', 'baz']
 *
 * @param {string} value The string.
 * @returns {dw.util.ArrayList} The array list.
 */
module.exports = function stringToArrayList(value) {
  var result = new ArrayList();

  if (value) {
    value.split(',').forEach(function (id) {
      result.add(id.trim());
    });
  }

  return result;
};
