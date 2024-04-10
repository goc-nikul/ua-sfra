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
var bucketedAttributesHelper = require('../custom/bucketedAttributesHelper');

/**
 * Allows customizing the category data that is ingested. By default, the cartridge aims to provide
 * a generic "base layer" of transformation so that we get all required category information
 * into Constructor. You can override this to add, customize or remove data to your needs.
 *
 * @param {Object} category The category.
 * @returns {Object} The transformed category data.
 */
function getCategoryData(category) {
    return {
        // id fields
        uuid: category.UUID,
        id: category.ID,

        // name fields
        displayName: category.displayName,

        // hierarchy fields
        parent: category.parent
        ? {
            displayName: category.parent.displayName,
            uuid: category.parent.UUID,
            id: category.parent.ID
        }
        : null,

        /**
         * Using the `data` field, you can send any metadata you want in your category.
         * This needs to be an object and will be automatically converted to JSON.
         * When fetching it from the API, you'll get the same object back.
         */
        data: {
            categoryUrl: categoryHelper.getCategoryUrl(category),
            categoryDisplayName: category.getDisplayName(),
            categoryParentId: categoryHelper.getCategoryParentID(category),
            categoryParentName: categoryHelper.getCategoryParentName(category),
            categoryAltUrl: categoryHelper.getCategoryAltUrl(category),
            parents: categoryHelper.getParentCategories(category, [], 'desc', true, true),
            priceMap: bucketedAttributesHelper.getPriceMap(category)
        }
    };
}

module.exports.getCategoryData = getCategoryData;
