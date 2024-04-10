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

var productHelper = require('../custom/productHelper');

/**
 * Allows injecting custom metadata into a product. This is useful if you want to have information
 * that you will not use to filter your products (you should use facets for that), but that you
 * want to be able to access when dealing with your catalog data.
 *
 * For example, if you wanted to add a custom metadata called "color",
 * you would want to return an array of objects like this:
 *
 * ```javascript
 * [
 *  {
 *   key: "color",
 *   value: "red",
 *  },
 * ]
 * ```
 *
 * The `value` can be a string, an array of strings or an object (which will be converted to JSON).
 * If you want to store complex information in your metadata, you can do so with objects:
 *
 * ```javascript
 * [
 *  {
 *   key: "color",
 *   value: {
 *     name: "red",
 *     hex: "#FF0000",
 *     description: "This is a red color",
 *   },
 *  },
 * ]
 * ```
 *
 * @param {Object} product The product.
 * @param {Object} data The product variation data.
 * @returns {Array} An array of objects representing custom metadata.
 */
function getVariationMetadata(product, data) {
    var colorAttribute = product.variationModel.getProductVariationAttribute('color');

    var meta = [
        {
            key: 'json:hexColor',
            value: productHelper.getHexColor(product)
        },
        {
            key: 'upc',
            value: product.getUPC()
        },
        {
            key: 'json:colorWayId',
            value: productHelper.getColorWayId(product)
        },
        {
            key: 'colorValue',
            value: productHelper.getColorValue(product, colorAttribute)
        },
        {
            key: 'defaultColor',
            value: productHelper.getDefaultColor(product, colorAttribute)
        },
        {
            key: 'currentHealth',
            value: data.inventory
        },
        {
            key: 'gridTileHoverImageURL',
            value: productHelper.getGridTileHoverImage(product, data.sizeModelImages)
        },
        {
            key: 'imageName',
            value: !empty(data.imageData) && 'title' in data.imageData ? data.imageData.title : ''
        },
        {
            key: 'imageFileName',
            value: !empty(data.imageData) && 'fileName' in data.imageData ? data.imageData.fileName : ''
        },
        {
            key: 'imageRecipe',
            value: !empty(data.imageData) && 'recipe' in data.imageData ? data.imageData.recipe : ''
        },
        {
            key: 'imageViewType',
            value: !empty(data.imageData) && 'viewType' in data.imageData ? data.imageData.viewType : ''
        },
        {
            key: 'json:secondaryHexColor',
            value: productHelper.getSecondaryHexColor(product)
        },
        {
            key: 'json:defaultColorwayId',
            value: data.defaultColorwayId
        },
        {
            key: 'hideColorWay',
            value: data.hideColorWay
        },
        {
            key: 'exclusiveType',
            value: productHelper.getExclusiveType(product)
        },
        {
            key: 'orderable',
            value: data.orderable
        },
        {
            key: 'preorderable',
            value: product.availabilityModel.getAvailabilityLevels(1).getPreorder().getValue() > 0
        },
        {
            key: 'preorderMessage',
            value: data.preorderMessages
        },
        {
            key: 'json:sizeModelImages',
            value: productHelper.getSizeModelImageURLs(data)
        },
        {
            key: 'listPrice',
            value: data.listPrice
        },
        {
            key: 'salePrice',
            value: data.salePrice
        },
        {
            key: 'sortOptions',
            value: data.sortOptions
        },
        {
            key: 'is_default',
            value: productHelper.isDefaultColorwayId(product)
        },
        {
            key: '__cnstrc_release_time',
            value: productHelper.getReleaseDate(product)
        }
    ];

    // add simple product attribute values to meta
    meta.push.apply(meta, Array.from(data.variationMeta));

    return meta;
}

module.exports.getVariationMetadata = getVariationMetadata;
