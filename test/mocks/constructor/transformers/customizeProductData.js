'use strict';

var productHelper = require('../../../mocks/constructor/custom/productHelper');
var variationTransformer = require('../../../mocks/constructor/transformers/variationTransformer');
var bucketedAttributesHelper = require('../../../mocks/constructor/custom/bucketedAttributesHelper');
var promotionMgr = require('../../../mocks/dw/dw_campaign_PromotionMgr');
var config = require('../../../mocks/constructor/helpers/config');
var sortOptionsHelper = require('../../../mocks/constructor/custom/sortOptionsHelper');
var Collection = require('../../../mocks/dw/dw_util_Collection');

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

function parseDescription(product) {
    return productHelper.getAttributeValue(product, 'whatsItDo') || null;
}

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

        if (!empty(attributeValue)) {
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

function getProductData(product, data) {
    var parentId = variationTransformer.parseParentId(product);
    var defaultColorway = productHelper.getDefaultColorwayId(product);

    var productData = {
        uuid: product.UUID,
        id: productHelper.getProductId(product),
        pageURL: productHelper.getProductUrl(product),
        name: product.name || product.ID || product.UUID,
        categories: parseCategories(product.categories),
        description: parseDescription(product),
        image: 'imageData' in data && data.imageData && 'url' in data.imageData && data.imageData.url ? data.imageData.url : null,
        online: product.online,
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

module.exports = {
    parseCategories: parseCategories,
    parseDescription: parseDescription,
    prepAttributeData: prepAttributeData,
    getProductData: getProductData
};
