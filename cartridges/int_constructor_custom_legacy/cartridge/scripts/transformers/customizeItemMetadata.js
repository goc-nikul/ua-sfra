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
 * @param {Object} data Supplemental item data.
 * @returns {Array} An array of objects representing custom metadata.
 */
function getItemMetadata(product, data) {
    var variantData = productHelper.getVariantData(product, data);
    var primaryCategory = product.getPrimaryCategory();

    var meta = [
        {
            key: 'onModelImageURL',
            value: productHelper.getOnModelImage(product)
        },
        {
            key: 'categoryPath',
            value: productHelper.getCategoryPath(product, primaryCategory)
        },
        {
            key: 'fitCare',
            value: productHelper.getFitCare(product)
        },
        {
            key: 'longDescription',
            value: product.getLongDescription()
        },
        {
            key: 'lastModified',
            value: product.getLastModified()
        },
        {
            key: 'masterColors',
            value: !empty(variantData) && 'colors' in variantData ? variantData.colors : ''
        },
        {
            key: 'masterSizes',
            value: !empty(variantData) && 'sizes' in variantData ? variantData.sizes : ''
        },
        {
            key: 'masterStockSizes',
            value: !empty(variantData) && 'qtys' in variantData ? variantData.qtys : ''
        },
        {
            key: 'variantSkuList',
            value: !empty(variantData) && 'skus' in variantData ? variantData.skus : ''
        },
        {
            key: 'variantUpcList',
            value: !empty(variantData) && 'upcs' in variantData ? variantData.upcs : ''
        },
        {
            key: 'videoMaterials',
            value: productHelper.getVideoMaterials(product)
        },
        {
            key: 'priceCurrency',
            value: productHelper.getPriceCurrency(product.priceModel)
        },
        {
            key: 'colorCount',
            value: productHelper.getSwatchCount(product.ID)
        },
        {
            key: 'json:defaultColorwayId',
            value: data.defaultColorwayId
        },
        {
            key: 'categoryUrl',
            value: !empty(primaryCategory) ? primaryCategory.getPageURL() : ''
        },
        {
            key: 'preorderMessage',
            value: data.preorderMessages
        },
        {
            key: 'json:promotions',
            value: productHelper.getPromotions(product)
        },
        {
            key: 'upperLeftFlameIcon',
            value: productHelper.getTileUpperLeftFlameIconBadge(product)
        },
        {
            key: 'listPriceLow',
            value: data.minListPrice
        },
        {
            key: 'listPriceHigh',
            value: data.maxListPrice
        },
        {
            key: 'salePriceLow',
            value: product.ID === 'GC-0001-ALL' || product.ID === 'GC00001' ? [10, 30, 70, 80, 110, 210] : data.minSalePrice
        },
        {
            key: 'salePriceHigh',
            value: data.maxSalePrice
        },
        {
            key: 'sortOptions',
            value: data.sortOptions
        },
        {
            key: 'json:groupPricing',
            value: data.promoPricingEnabled && !empty(variantData) && 'customerGroupPricing' in variantData ? variantData.customerGroupPricing : ''
        },
        {
            key: 'isColorSlicedProduct',
            value: data.isSlicedProduct
        },
        {
            key: '__cnstrc_release_time',
            value: productHelper.getReleaseDate(product)
        }
    ];

    // add simple product attribute values to meta
    meta.push.apply(meta, Array.from(data.itemMeta));

    return meta;
}

module.exports.getItemMetadata = getItemMetadata;
