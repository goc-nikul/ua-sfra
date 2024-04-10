/**
 * This function is responsible for transforming the category data into the format
 * that will be written to the final catalog files before sending it to the
 * Constructor API, and into a format that is understood by our API.
 *
 * NOTE: You should not modify this file. If you need to customize any piece of catalog
 * data, look for the `customize` functions in this folder.
 *
 * @param {*} category The category.
 * @returns The transformed data.
 */
function transformCategory(category) {
  var customizeCategoryData = require('int_constructor_custom_legacy/cartridge/scripts/transformers/customizeCategoryData');

  return customizeCategoryData.getCategoryData(category);
}

module.exports.transformCategory = transformCategory;
