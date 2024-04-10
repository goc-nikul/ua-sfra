'use strict';

var productHelper = require( '../../../../cartridges/int_constructor_custom_legacy/cartridge/scripts/custom/productHelper');

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
            value: !empty(data.image) && 'title' in data.image ? data.image.title : null
        },
        {
            key: 'imageFileName',
            value: !empty(data.image) && 'fileName' in data.image ? data.image.fileName : null
        },
        {
            key: 'imageRecipe',
            value: !empty(data.image) && 'recipe' in data.image ? data.image.recipe : null
        },
        {
            key: 'imageViewType',
            value: !empty(data.image) && 'viewType' in data.image ? data.image.viewType : null
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
