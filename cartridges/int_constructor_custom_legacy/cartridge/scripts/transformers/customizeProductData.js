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
var variationTransformer = require('link_constructor_connect_legacy/cartridge/scripts/transformers/variationTransformer');
var bucketedAttributesHelper = require('../custom/bucketedAttributesHelper');
var promotionMgr = require('dw/campaign/PromotionMgr');
var config = require('../helpers/config');
var sortOptionsHelper = require('../custom/sortOptionsHelper');

/**
 * Parses the product categories.
 *
 * @param {Object} categories The categories.
 * @returns {Array} The parsed categories.
 */
function parseCategories(categories) {
    if (!categories) return [];

    return categories.toArray().map(function handler(category) {
        return {
            displayName: category.displayName,
            uuid: category.UUID,
            id: category.ID
        };
    });
}

/**
 * Parses the product description.
 * @param {Object} product The product.
 * @returns {*} The parsed description, or null if not found.
 */
function parseDescription(product) {
    return productHelper.getAttributeValue(product, 'whatsItDo') || null;
}


/**
 * Gets and puts product attribute data in the appropriate arrays
 *
 * @param {*} product The product.
 * @param {Object} data Product and feed data.
 * @returns {Object} Product and feed data with added attribute lists.
 */
function prepAttributeData(product, data) {
    var attributeData = {};

    // clear arrays we're pushing custom object data into
    attributeData.itemFacets = [];
    attributeData.itemMeta = [];
    attributeData.variationFacets = [];
    attributeData.variationMeta = [];

    // loop through list of simple product attributes
    data.attributeList.forEach(function (attribute) {
        // get attribute value(s) for the passed product
        var attributeValue = productHelper.getAttributeValuesFromName(product, attribute.sfccKey);

        if (empty(attributeValue) && attribute.sfccKey === 'searchableIfUnavailableFlag') {
            attributeValue = false;
        }

        if (!empty(attributeValue)) {
            // for each type of:
            // * constructor data(facet or metadata) AND
            // * each type of sfcc product(master/parent or variant),
            // push the constructor key and attribute value to the appropriate array

            // build the object that will be passed to Constructor
            var obj = { key: attribute.cioKey, value: attributeValue };

            // get type of data and type of feed options
            var onVariation = attribute.feedType.find(item => (item.value === 'variation'));
            var onMaster = attribute.feedType.find(item => (item.value === 'master'));
            var onFacet = attribute.dataType.find(item => (item.value === 'facet'));
            var onMeta = attribute.dataType.find(item => (item.value === 'metadata'));

            if (onFacet) {
                if (onVariation) {
                    // facets for variation products
                    attributeData.variationFacets.push(obj);
                }

                if (onMaster) {
                    // facets for master/parent products
                    attributeData.itemFacets.push(obj);
                }
            }

            if (onMeta) {
                if (onVariation) {
                    // metadata for variation products
                    attributeData.variationMeta.push(obj);
                }

                if (onMaster) {
                    // metadata for master/parent products
                    attributeData.itemMeta.push(obj);
                }
            }
        }
    });

    return attributeData;
}

/**
 * Allows customizing the product data that is ingested. By default, the cartridge aims to provide
 * a generic "base layer" of transformation so that we get all required product information
 * into Constructor. You can override this to add, customize or remove data to your needs.
 *
 * Assuming you're using the cartridge to export your products to Constructor (meaning they
 * don't exist there yet), you'll need to keep most information here since that is required.
 * If you already have products in Constructor, you can remove data as needed, and the only
 * required field is the id - since we need to identify which products we're modifying.
 *
 * For example, some ways in which you might want to use the cartridge:
 *
 * a) Create/update products in Constructor using your Salesforce data.
 *
 * b) Handle only a few facets or metadata (e.g. your inventory, price or promotions) and
 *    leave the rest to be handled by other integrations - assuming those exist.
 *
 * @param {Object} product The product.
 * @param {Object} data Product and feed data.
 * @returns {Object} The transformed product data.
 */
function getProductData(product, data) {
    var parentId = variationTransformer.parseParentId(product);
    var defaultColorway = productHelper.getDefaultColorwayId(product);

    var productData = {
        /**
         * ID fields. These are required for the integration to work.
         * You should not remove these.
         */
        uuid: product.UUID,
        id: productHelper.getProductId(product),

        /**
         * Data fields. These are optional, but you should keep them if you
         * want to ingest this data into Constructor via this cartridge.
         */
        pageURL: productHelper.getProductUrl(product),
        name: product.name || product.ID || product.UUID,
        categories: parseCategories(product.categories),
        description: parseDescription(product),
        image: 'imageData' in data && data.imageData && 'url' in data.imageData && data.imageData.url ? data.imageData.url : null,
        online: product.online,

        /**
         * Hierarchy fields. These are optional, but you need to fill them if you want the cartridge
         * to import your product hierarchy as items and variations in Constructor.
         *
         * In short, if `parentId` is null, the product will be imported as an item.
         * If `parentId` is not null, the product will be imported as a variation.
         *
         * Note: to import a variation, you need to have the item with the same
         * id in the payload.
         *
         * Note: the `parentId` always points to the `id` field.
         */
        parentId: parentId,

        // custom data
        promos: promotionMgr.getActivePromotions().getProductPromotions(product),
        searchRefinements: bucketedAttributesHelper.getAttributeValuesMap(product),
        sortOptions: sortOptionsHelper.buildSortData(product),
        defaultColorwayId: !empty(defaultColorway) ? JSON.stringify({ id: defaultColorway }) : defaultColorway,
        preorderMessages: productHelper.getPreorderMessages(product)
    };

    // get SFCC product attributes in the SFCC ConstructorIOdata custom object
    var attributeData = prepAttributeData(product, data);

    // Set discount percentage filter range
    if (attributeData && attributeData.itemFacets) {
        attributeData.itemFacets.forEach(function (attr) {
            if (attr.key === 'discountPercentage') {
                attr.value = productHelper.getDiscountPercentage(product); // eslint-disable-line no-param-reassign
            }
        });
    }

    Object.assign(productData, attributeData);

    if (parentId) {
        // get inventory
        productData.inventory = productHelper.getInventoryAmount(product);
        productData.orderable = product.availabilityModel.isInStock();
        productData.hideColorWay = productHelper.hideColorWay(productData.orderable);

        // get pricing
        productData.listPrice = product.priceModel.getPriceBookPrice(config.configKeys.CUSTOM_LIST_PRICEBOOK_NAME).value;
        productData.salePrice = product.priceModel.getPriceBookPrice(config.configKeys.CUSTOM_SALE_PRICEBOOK_NAME).value;

        // get size model images
        productData.sizeModelImages = productHelper.getSizeModelImages(product, 99);
    }

    // merge product data and passed data
    Object.assign(productData, data);

    return productData;
}

module.exports.getProductData = getProductData;
