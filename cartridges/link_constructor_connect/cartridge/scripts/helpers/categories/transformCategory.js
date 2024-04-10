/**
 * Transforms a category into the format expected by Constructor.
 *
 * @param {dw.catalog.Category} category The category.
 * @param {object} data The data computed by the reader.
 *
 * @returns {object} The transformed data.
 */
module.exports = function transformCategory(category, _data) {
  return {
    /**
     * ID fields. These are required for the integration to work.
     * You should not remove these.
     */
    id: category.ID,

    /**
     * Hierarchy fields. These ensure that the correct category hierarchy.
     */
    parent_id: category.parent
      ? category.parent.ID
      : null,

    /**
     * Data fields.
     */
    name: category.displayName || category.ID,

    /**
     * Extended category metadata.
     * Using the `data` field, you can send any metadata you want in your category.
     * This needs to be an object and will be automatically converted to JSON.
     * When fetching it from the API, you'll get the same object back.
     */
    data: {}
  };
};
