'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ProductMgr = require('dw/catalog/ProductMgr');

/**
 * The availability check against size attribute
 * @param {Object} exchangeItems - list of exchange items
 * @param {dw.catalog.ProductVariationModel} variationModel - A product's variation model
 * @param {dw.catalog.ProductVariationAttributeValue} sizeAttr - Selected attribute value
 * @param {Object} colorCode - Attribute value'
 * @param {Object} masterSku - The product ID
 * @param {number} attrLength - variation attributes length
 * @return {Object} Return attribute selection response
 */
function hasOrderableSize(exchangeItems, variationModel, sizeAttr, colorCode, masterSku, attrLength) {
    var result = false;
    var selectedItemSku = null;
    var selectedValue = variationModel.getSelectedValue(sizeAttr);
    if (attrLength === 3 && !selectedValue) {
        return true;
    }
    var selectedSizeValue = selectedValue.ID;
    var attrValues = variationModel.getAllValues(sizeAttr);
    collections.forEach(attrValues, function (value) {
        if (selectedSizeValue && selectedSizeValue === value.ID) {
            selectedItemSku = masterSku + '-' + colorCode + '-' + selectedSizeValue;
        }
    });
    for (var x = 0; x < exchangeItems.length; x++) {
        var exchangeItemSku = exchangeItems[x];
        if (exchangeItemSku && selectedItemSku && exchangeItemSku === selectedItemSku) {
            result = true;
            break;
        } else {
            var product = ProductMgr.getProduct(exchangeItemSku);
            if (product) {
                exchangeItemSku = masterSku + '-' + product.custom.color + '-' + product.custom.size;
                if (exchangeItemSku && selectedItemSku && (exchangeItemSku === selectedItemSku)) {
                    result = true;
                    break;
                }
            }
        }
    }

    return result;
}

/**
 * The availability check against color attribute
 * @param {Object} exchangeItems - list of exchange items
 * @param {dw.catalog.ProductVariationModel} variationModel - A product's variation model
 * @param {dw.catalog.ProductVariationAttributeValue} colorAttr - Selected attribute value
 * @param {Object} sizeID - Attribute value'
 * @param {Object} masterSku - The product ID
 * @return {Object} Return attribute selection response
 */
function hasOrderableColor(exchangeItems, variationModel, colorAttr, sizeID, masterSku) {
    var result = false;
    var selectedItemSku = null;
    var selectedValue = variationModel.getSelectedValue(colorAttr);
    if (selectedValue && selectedValue.ID) {
        var selectedColorValue = selectedValue.ID;
        selectedItemSku = masterSku + '-' + selectedColorValue + '-' + sizeID;

        for (var x = 0; x < exchangeItems.length; x++) {
            var exchangeItemSku = exchangeItems[x];
            if (exchangeItemSku && selectedItemSku && exchangeItemSku === selectedItemSku) {
                result = true;
                break;
            } else {
                var product = ProductMgr.getProduct(exchangeItemSku);
                if (product) {
                    exchangeItemSku = masterSku + '-' + product.custom.color + '-' + product.custom.size;
                    if (exchangeItemSku && selectedItemSku && (exchangeItemSku === selectedItemSku)) {
                        result = true;
                        break;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * The availability check against OIS service
 * @param {dw.catalog.ProductVariationAttributeValue} attr - A product's variation model
 * @param {dw.catalog.ProductVariationAttributeValue} value - Selected attribute value
 * @param {dw.catalog.ProductVariationModel} variationModel - Attribute value'
 * @param {Object} exchangeVariationModel - exchange items variation model
 * @param {number} attrLength - variation attributes length
 * @return {Object} Return list of products string
 */
function hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength) {
    var result = false;
    var masterSku = variationModel.master.ID;
    var allAttributes = variationModel.productVariationAttributes;
    var exchangeItems = exchangeVariationModel.split(',');
    if (exchangeItems) {
        if (attr.ID === 'color') {
            var sizeAttr = null;
            collections.forEach(allAttributes, function (tempAttr) {
                if (tempAttr.ID === 'size') {
                    sizeAttr = tempAttr;
                }
            });
            result = hasOrderableSize(exchangeItems, variationModel, sizeAttr, value.ID, masterSku, attrLength);
        } else if (attr.ID === 'length') {
            result = true;
        }
        if (attr.ID === 'size') {
            var colorAttr = null;
            collections.forEach(allAttributes, function (tempAttr) {
                if (tempAttr.ID === 'color') {
                    colorAttr = tempAttr;
                }
            });
            result = hasOrderableColor(exchangeItems, variationModel, colorAttr, value.ID, masterSku);
        }
    }

    return result;
}

module.exports = {
    hasOrderableVariants: hasOrderableVariants
};
