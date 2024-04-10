/**
 * In this module, we export a function that can be overlaid so that you can customize
 * the way that the catalog data is transformed.
 *
 * Ideally, you should create an overlay cartridge to override this function. You can also
 * edit this file directly to customize it, but note that you'll potentially have to deal
 * with merge conflicts if you choose to directly modify the cartridge source code.
 *
 * IMPORTANT: You can customize any value transformed on this file, but changing the data structure
 * itself will likely break the integration. Newly added keys will not be recognized when
 * ingesting catalog data, and removed keys will cause the ingestion to fail.
 *
 * @see https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges/b2c-cartridges-customize
 */

var categoryHelper = require('../custom/categoryHelper');

/**
 * Allows customizing the category data that is ingested. By default, the cartridge aims to provide
 * a generic "base layer" of transformation so that we get all required category information
 * into Constructor. You can override this to add, customize or remove data to your needs.
 *
 * @param {Object} category The category.
 * @returns {Object} The transformed category data.
 */
function getCategorySectionData(category) {
    return {
        // id fields
        uuid: category.UUID,
        id: category.ID,

        // name fields
        name: category.displayName || category.ID,

        // hierarchy fields
        // Note that we're using `parentId`, since this is technically a product ingestion,
        // since we're sending data with `items.csv` to the `Categories` index section.
        parentId: null,

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
}

module.exports.getCategorySectionData = getCategorySectionData;
