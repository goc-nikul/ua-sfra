var categoryHelper = require('*/cartridge/scripts/helpers/categories/categoryHelper');

/**
 * Transforms a category into the format expected by Constructor.
 *
 * @param {dw.catalog.Category} category The category.
 * @param {object} data The data computed by the reader.
 * @returns {object} The transformed data.
 */
module.exports = function transformCategorySection(category, _data) {
  return {
    /**
     * ID fields. These are required for the integration to work.
     * You should not remove these.
     */
    id: category.ID,

    /**
     * Data fields.
     */
    item_name: category.displayName || category.ID,

    /**
     * Using the `metadata` field, you can send any metadata you want in your category.
     * This needs to be an object and will be automatically converted to JSON.
     * When fetching it from the API, you'll get the same object back.
     */
    metadata: [
      {
        key: 'data',
        value: {
          categoryUrl: categoryHelper.getCategoryUrl(category),
          categoryDisplayName: category.getDisplayName(),
          categoryParentId: categoryHelper.getCategoryParentID(category),
          categoryParentName: categoryHelper.getCategoryParentName(category),
          categoryAltUrl: categoryHelper.getCategoryAltUrl(category)
        }
      }
    ]
  };
};
