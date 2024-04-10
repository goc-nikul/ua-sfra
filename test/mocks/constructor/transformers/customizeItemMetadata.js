'use strict';

var productHelper = require('../custom/productHelper');
var mockProductHelper = require('../../../mocks/constructor/custom/productHelper');

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
            value: product.ID === 'GC-0001-ALL' ? [10, 30, 70, 80, 110, 210] : data.minSalePrice
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
            value: mockProductHelper.getReleaseDate(product)
        }
    ];

    // add simple product attribute values to meta
    meta.push.apply(meta, Array.from(data.itemMeta));

    return meta;
}

module.exports.getItemMetadata = getItemMetadata;
