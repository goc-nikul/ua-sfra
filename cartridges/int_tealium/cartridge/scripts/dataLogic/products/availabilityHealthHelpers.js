/* eslint-disable */
'use strict';
var ProductMgr = require('dw/catalog/ProductMgr');
/**
 * Function to create Available length json object
 * @param {Object} lengthAttrValues - length attributes values
 * @return {Object} Return length Json object
 */
function colorSizeLengthObject(type, attrValues, variationModel) {
    var obj = {};
    if (empty(attrValues)) {
        return obj;
    }
    if (type === 'color') {
        for (var i = 0; i < attrValues.length; i++) {
            variationModel.setSelectedAttributeValue('color', attrValues[i].ID);
            var desktopImages = variationModel.getImages('pdpMainDesktop').toArray();
            if (desktopImages.length > 0) {
                obj[attrValues[i].ID] = 0;
            }
        }
    } else {
        for (var i = 0; i < attrValues.length; i++) {
            obj[attrValues[i].ID] = 0;
        }
    }
    return obj;
}

/**
 * Function to calculate total count of available color and length
 * @param {Object} attributeJson - color/size attribute object
 * @param {Object} attributeValues - color/size attributes values
 * @return {String} Return Total
 */
function colorSizeCalculation(attributeJson, attributeLength) {
    var total = 0;
    for (var key in attributeJson) {
        if (attributeJson[key] >= attributeLength) {
            total = total + 1;
        }
    }
    return total;
}

/**
 * Function to calculate the availability and count of color, size and length on PDP to be used in the analytics
 * @param {String} pid - Product ID
 * @return {Object} Return Availability Object
 */
function getAvailabilityHealth(pid) {
    var result = {};
    try {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var product = ProductMgr.getProduct(pid);
        if (!product.master) {
            product = product.masterProduct;
        }
        var variationModel = product.variationModel;
        var colorVariationAttribute = variationModel.getProductVariationAttribute('color');
        var sizeVariationAttribute = variationModel.getProductVariationAttribute('size');
        var lengthVariationAttribute = variationModel.getProductVariationAttribute('length');
        var lengthVariationAttributeLength = lengthVariationAttribute ? variationModel.getAllValues(lengthVariationAttribute).length : 0;
        var colorAttrValues = variationModel.getAllValues(colorVariationAttribute);
        var colorJson = colorSizeLengthObject('color', colorAttrValues, variationModel);
        var sizeAttrValues = variationModel.getAllValues(sizeVariationAttribute);
        var sizeJson = colorSizeLengthObject('size', sizeAttrValues, variationModel);
        var colorTotal = 0;
        var sizeTotal = 0;
        var lengthTotal = 0;
        var orderableColors = [];
        var orderableSizes = [];
        var orderableLength = [];
        var lengthAttrValues = [];
        if (lengthVariationAttributeLength > 0) {
            lengthAttrValues = variationModel.getAllValues(lengthVariationAttribute);
        }
        var lengthJson = colorSizeLengthObject('length', lengthAttrValues, variationModel);
        var totalLengthJson = {};
        for (var index = 0; index < variationModel.variants.length; index++) {
            var variant = variationModel.variants[index];
            var available = variant.availabilityModel.availabilityStatus === 'IN_STOCK';
            Object.keys(colorJson).forEach(function (key) {
                if (variant.custom.color === key && variant.availabilityModel.orderable && available) {
                    var counter = colorJson[variant.custom.color] + 1;
                    colorJson[variant.custom.color] = counter;
                    if (orderableColors.indexOf(key) == -1) {
                        orderableColors.push(key);
                    }
                    colorTotal = orderableColors.length;
                }
            });
            Object.keys(sizeJson).forEach(function (key) {
                if (variant.custom.size === key && variant.availabilityModel.orderable && available) {
                    var counter = sizeJson[variant.custom.size] + 1;
                    sizeJson[variant.custom.size] = counter;
                    if (orderableSizes.indexOf(key) == -1) {
                        orderableSizes.push(key);
                    }
                    sizeTotal = orderableSizes.length;
                }
            });
            Object.keys(lengthJson).forEach(function (key) {
                if (variant.custom.length === key && variant.availabilityModel.orderable && available) {
                    var counter = lengthJson[variant.custom.length] + 1;
                    lengthJson[variant.custom.length] = counter;
                    if (orderableLength.indexOf(key) == -1) {
                        orderableLength.push(key);
                    }
                    lengthTotal = orderableLength.length;
                }
                if (variant.custom.length === key) {
                    var counter = lengthJson[variant.custom.length] + 1;
                    totalLengthJson[variant.custom.length] = counter;
                }
            });
        }
        
        var sizeLengthTotal = sizeTotal + lengthTotal;
        var fullcolourTotal = colorTotal > 0 ? colorSizeCalculation(colorJson, sizeTotal) : 0;
        var primarySizeTotal = sizeLengthTotal > 0 ? colorSizeCalculation(sizeJson, colorTotal) : 0;
        
        result.product_options_color_total = colorTotal;
        result.product_options_color_full = fullcolourTotal;
        result.product_options_size_total = sizeLengthTotal;
        result.product_options_size_full = primarySizeTotal;
        return result;
    } catch (e) {
        result.product_options_color_total = "";
        result.product_options_color_full = "";
        result.product_options_size_total = "";
        result.product_options_size_full = "";
        return result;
    }
};

module.exports = {
    getAvailabilityHealth: getAvailabilityHealth
};