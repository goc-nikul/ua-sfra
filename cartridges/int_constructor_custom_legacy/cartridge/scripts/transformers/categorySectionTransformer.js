/**
 * This function is responsible for transforming the category data into the format
 * that will be written to the final catalog files before sending it to the
 * Constructor API, and into a format that is understood by our API.
 *
 * NOTE: You should not modify this file. If you need to customize any piece of catalog
 * data, look for the `customize` functions in this folder.
 *
 * NOTE: This behaves similarly to the category data jobs, but will send categories
 * as `items` into the `Categories` section instead. This is a customization done for
 * Under Armour to improve mobile speeds.
 *
 * @param {*} category The category.
 * @returns {*} The transformed data.
 */
function transformCategorySection(category) {
    var customizeCategorySectionData = require('./customizeCategorySectionData');

    return customizeCategorySectionData.getCategorySectionData(category);
}

module.exports.transformCategorySection = transformCategorySection;
