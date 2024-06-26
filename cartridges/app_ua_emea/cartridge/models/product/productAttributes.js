'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var Site = require('dw/system/Site');

/**
 * Determines whether a product attribute has image swatches.  Currently, the only attribute that
 *     does is Color.
 * @param {string} dwAttributeId - Id of the attribute to check
 * @returns {boolean} flag that specifies if the current attribute should be displayed as a swatch
 */
function isSwatchable(dwAttributeId) {
    var imageableAttrs = ['color'];
    return imageableAttrs.indexOf(dwAttributeId) > -1;
}

/**
 * Retrieve all attribute values
 *
 * @param {dw.catalog.ProductVariationModel} variationModel - A product's variation model
 * @param {dw.catalog.ProductVariationAttributeValue} selectedValue - Selected attribute value
 * @param {dw.catalog.ProductVariationAttribute} attr - Attribute value'
 * @param {string} attrConfig - The object contains end point to use in the Product Controller & flag for bonus product.
 * @param {string} selectedOptionsQueryParams - Selected options query params
 * @param {string} quantity - Quantity selected
 * @param {number} attrLength - variation attributes length
 * @param {boolean} exchangeOrderItem - trigger custom hasOrderableVariants
 * @param {Object} exchangeVariationModel - exchange items variation model
 * @param {Object} map - Hash map with color ID and value
 * @param {string} fitModelPreference - Selected size model preference
 * @param {Array} result - Attribute values
 * @returns {Object[]} - List of attribute value objects for template context
 */
function getAllAttrValues(variationModel, selectedValue, attr, attrConfig, selectedOptionsQueryParams, quantity, attrLength, exchangeOrderItem, exchangeVariationModel, map, fitModelPreference, result) {
    var attrValues = 'getAllAttrValues' in attrConfig && attrConfig.getAllAttrValues ? variationModel.getAllValues(attr) : variationModel.getFilteredValues(attr);
    var attrValuesOfResult = result;
    var endPoint = attrConfig.endPoint;
    if (!empty(attrValuesOfResult)) {
        for (var j = 0; j < attrValuesOfResult.length; j++) {
            var valueOfAttr = attrValuesOfResult[j];
            if (valueOfAttr && valueOfAttr.id === 'color') {
                if (valueOfAttr && valueOfAttr.values && valueOfAttr.values.length <= 0) {
                    attrValues = variationModel.getAllValues(attr);
                    break;
                }
            }
        }
    }
    var actionEndpoint = 'Product-' + endPoint;
    var allAttrValues = [];
    var masterVariationModel = variationModel.master.variationModel;
    var variantsBasedOnColor = [];
    if (attr.ID === 'size') {
        variantsBasedOnColor = variationModel.getVariants(map);
    }
    var imageViewType = null;
    if ('enableFitModels' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('enableFitModels')) {
        imageViewType = productHelper.sizeModelImagesMapping(fitModelPreference);
    }
    collections.forEach(attrValues, function (value) {
        var isSelected = (selectedValue && selectedValue.equals(value)) || false;
        var valueUrl = '';
        var hoverFitModelImage = {};
        var exclusiveOOS = false;
        var processedAttr = {
            id: value.ID,
            description: value.description,
            displayValue: value.displayValue,
            value: value.value,
            selected: isSelected
        };
        if (exchangeOrderItem) {
            var exchangeProductVariationModelHelper = require('*/cartridge/scripts/UACAPI/helpers/order/exchangeProductVariationModelHelper');
            processedAttr.selectable = attr && attr.ID === 'length' ? true : exchangeProductVariationModelHelper.hasOrderableVariants(attr, value, variationModel, exchangeVariationModel, attrLength);
            if (processedAttr.selectable) {
                valueUrl = (isSelected && endPoint !== 'Show' && attr.ID !== 'size') ? variationModel.urlUnselectVariationValue(actionEndpoint, attr) : variationModel.urlSelectVariationValue(actionEndpoint, attr, value);
                processedAttr.url = urlHelper.appendQueryParams(valueUrl, [selectedOptionsQueryParams, 'quantity=' + quantity, 'exchangeItem=true', 'exchangeVariationModel=' + exchangeVariationModel]);
            }
        } else {
            if (variantsBasedOnColor.length > 0) {
                for (var i = 0; i < variantsBasedOnColor.length; i++) {
                    var variant = variantsBasedOnColor[i];
                    if (variant.custom.size === value.value) {
                        if (variant.custom && variant.custom.exclusive && (variant.custom.exclusive.value === 'out-of-stock' || variant.custom.exclusive.value === 'coming-soon')) {
                            exclusiveOOS = true;
                            break;
                        }
                    }
                }
            }
            processedAttr.selectable = attr && attr.ID === 'length' ? true : variationModel.hasOrderableVariants(attr, value);
            processedAttr.selectable = processedAttr.selectable && exclusiveOOS ? false : processedAttr.selectable;
            valueUrl = (isSelected && endPoint !== 'Show' && attr.ID !== 'size') ? variationModel.urlUnselectVariationValue(actionEndpoint, attr) : variationModel.urlSelectVariationValue(actionEndpoint, attr, value);
            processedAttr.url = urlHelper.appendQueryParams(valueUrl, [selectedOptionsQueryParams, 'quantity=' + quantity, 'exchangeItem=false']);
        }
        if (isSwatchable(attr.attributeID)) {
            var hexValue = '#1d1d1d';
            var hexIIValue = '#1d1d1d';
            var hexLogoValue = '#1d1d1d';
            var variantCollection = variationModel.getVariants();
            collections.forEach(variantCollection, function (currentVariant) {
                if (currentVariant.custom.color === value.ID) {
                    hexValue = currentVariant.custom.hexcolor ? currentVariant.custom.hexcolor : '#1d1d1d';
                    hexIIValue = currentVariant.custom.secondaryhexcolor ? currentVariant.custom.secondaryhexcolor : hexValue;
                    hexLogoValue = currentVariant.custom.logohexcolor ? currentVariant.custom.logohexcolor : '#1d1d1d';
                }
            });
            var getGridSwatch = function (color) {
                var apiImage = color.getImage('swatch', 0) || {};
                var gridSwatch = {
                    color: {
                        hex: hexValue,
                        hexII: hexIIValue,
                        hexLogo: hexLogoValue
                    }
                };
                if (apiImage.URL) {
                    gridSwatch.image = apiImage;
                }
                return gridSwatch;
            };
            var gridSwatch = getGridSwatch(value);
            var type = gridSwatch.image ? 'image' : 'color';
            var apiImage = value.getImage('swatch') || {};
            processedAttr.type = type;
            if (!empty(imageViewType)) {
                var fitModelImage = value.getImage(imageViewType);
                if (!empty(fitModelImage)) {
                    hoverFitModelImage.URL = fitModelImage.URL + '' + productHelper.recipeForPDPSizeModelImage('pdpMainDesktop');
                }
            }
            processedAttr.hoverImage = value.getImage('gridTileDesktop');
            processedAttr.hoverImageMain = !empty(hoverFitModelImage.URL) ? hoverFitModelImage : value.getImage('pdpMainDesktop');
            processedAttr.sizeModelImageMain = !empty(hoverFitModelImage.URL) ? hoverFitModelImage : {};
            processedAttr.hoverImageDefault = value.getImage('pdpMainDesktop');
            processedAttr.color = {
                hex: hexValue,
                hexII: hexIIValue,
                hexLogo: hexLogoValue,
                stdLightness: 0.6
            };
            processedAttr.color.lightnessValues = productHelper.changeSwatchBorder(processedAttr.color.hex, processedAttr.color.hexII);
            if (apiImage.URL) {
                processedAttr.image = apiImage;
            }
        }
        var desktopImages;
        var availableStyles = masterVariationModel.variants ? masterVariationModel.variants : '';
        if (attr.ID === 'color') {
            if (masterVariationModel.master && masterVariationModel.master.custom && masterVariationModel.master.custom.exclusive && masterVariationModel.master.custom.exclusive.value != null) {
                masterVariationModel.setSelectedAttributeValue('color', value.ID);
                desktopImages = masterVariationModel.getImages('pdpMainDesktop').toArray();
                if (desktopImages.length > 0) {
                    allAttrValues.push(processedAttr);
                }
                if (selectedValue) {
                    masterVariationModel.setSelectedAttributeValue('color', selectedValue.ID);
                }
                if (masterVariationModel.master.custom.exclusive.value === 'out-of-stock' || masterVariationModel.master.custom.exclusive.value === 'coming-soon') {
                    processedAttr.selectable = false;
                }
            } else if (availableStyles.length > 0) {
                var exclusiveCount = 0;
                var styleCount = 0;
                for (let k = 0; k < availableStyles.length; k++) {
                    let colorVariant = availableStyles[k];
                    if (colorVariant.custom.color === value.value) {
                        if (colorVariant.custom && colorVariant.custom.exclusive && colorVariant.custom.exclusive.value !== null) {
                            masterVariationModel.setSelectedAttributeValue('color', value.ID);
                            desktopImages = masterVariationModel.getImages('pdpMainDesktop').toArray();
                            if (desktopImages.length > 0) {
                                allAttrValues.push(processedAttr);
                            }
                            if (selectedValue) {
                                masterVariationModel.setSelectedAttributeValue('color', selectedValue.ID);
                            }
                            break;
                        } else if ('IsNotifyMeEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('IsNotifyMeEnabled')) {
                            masterVariationModel.setSelectedAttributeValue('color', value.ID);
                            desktopImages = masterVariationModel.getImages('pdpMainDesktop').toArray();
                            if (desktopImages.length > 0) {
                                allAttrValues.push(processedAttr);
                            }
                            if (selectedValue) {
                                masterVariationModel.setSelectedAttributeValue('color', selectedValue.ID);
                            }
                            break;
                        } else {
                            masterVariationModel.setSelectedAttributeValue('color', value.ID);
                            desktopImages = masterVariationModel.getImages('pdpMainDesktop').toArray();
                            if (desktopImages.length > 0) {
                                allAttrValues.push(processedAttr);
                            }
                            if (masterVariationModel.hasOrderableVariants(attr, value) && !exclusiveOOS) {
                                processedAttr.selectable = true;
                            }
                            if (selectedValue) {
                                masterVariationModel.setSelectedAttributeValue('color', selectedValue.ID);
                            }
                            break;
                        }
                    }
                }
                for (let k = 0; k < availableStyles.length; k++) {
                    let colorVariant = availableStyles[k];
                    if (colorVariant.custom.color === value.value) {
                        if (colorVariant.custom.exclusive && colorVariant.custom.exclusive.value !== null &&
                            (colorVariant.custom.exclusive.value === 'out-of-stock' || colorVariant.custom.exclusive.value === 'coming-soon')) {
                            exclusiveCount += 1;
                        }
                        styleCount += 1;
                    }
                }
                if (exclusiveCount > 0 && exclusiveCount === styleCount) {
                    processedAttr.selectable = false;
                }
            }
        } else {
            allAttrValues.push(processedAttr);
        }
    });
    return allAttrValues;
}

/**
 * Gets the Url needed to relax the given attribute selection, this will not return
 * anything for attributes represented as swatches.
 *
 * @param {Array} values - Attribute values
 * @param {string} attrID - id of the attribute
 * @returns {string} -the Url that will remove the selected attribute.
 */
function getAttrResetUrl(values, attrID) {
    var urlReturned;
    var value;

    for (var i = 0; i < values.length; i++) {
        value = values[i];
        if (!value.images) {
            if (value.selected) {
                urlReturned = value.url;
                break;
            }

            if (value.selectable) {
                urlReturned = value.url.replace(attrID + '=' + value.value, attrID + '=');
                break;
            }
        }
    }

    return urlReturned;
}

/**
 * @constructor
 * @classdesc Get a list of available attributes that matches provided config
 *
 * @param {dw.catalog.ProductVariationModel} variationModel - current product variation
 * @param {Object} attrConfig - attributes to select
 * @param {Array} attrConfig.attributes - an array of strings,representing the
 *                                        id's of product attributes.
 * @param {string} attrConfig.attributes - If this is a string and equal to '*' it signifies
 *                                         that all attributes should be returned.
 *                                         If the string is 'selected', then this is comming
 *                                         from something like a product line item, in that
 *                                         all the attributes have been selected.
 *
 * @param {string} attrConfig.endPoint - the endpoint to use when generating urls for
 *                                       product attributes
 * @param {string} selectedOptionsQueryParams - Selected options query params
 * @param {string} quantity - Quantity selected
 * @param {boolean} exchangeOrderItem - trigger custom hasOrderableVariants
 * @param {Object} exchangeVariationModel - exchange items variation model
 * @param {string} fitModelPreference - Selected size model preference
 */
function VariationAttributesModel(variationModel, attrConfig, selectedOptionsQueryParams, quantity, exchangeOrderItem, exchangeVariationModel, fitModelPreference) {
    var allAttributes = variationModel.productVariationAttributes;
    var attrLength = allAttributes.length;
    var result = [];
    var HashMap = require('dw/util/HashMap');
    var map = new HashMap();
    collections.forEach(allAttributes, function (attr) {
        var selectedValue = variationModel.getSelectedValue(attr);
        if (attr.ID === 'color' && selectedValue) {
            map.put(attr.ID, selectedValue.ID);
        }
        var values = getAllAttrValues(variationModel, selectedValue, attr, attrConfig,
            selectedOptionsQueryParams, quantity, attrLength, exchangeOrderItem, exchangeVariationModel, map, fitModelPreference, result);
        var resetUrl = getAttrResetUrl(values, attr.ID);
        if (values && attr.ID === 'length') {
            var sortOrderList = ['S', 'R', 'T'];
            var sortedValues = [];
            Object.keys(sortOrderList).forEach(function (id) {
                var sortOrder = sortOrderList[id];
                if (sortOrder) {
                    Object.keys(values).forEach(function (key) {
                        var value = values[key];
                        if (value && value.id === sortOrder) {
                            sortedValues.push(value);
                        }
                    });
                }
            });
            if (sortedValues && sortedValues.length > 0) {
                values = sortedValues;
            }
        }

        if ((Array.isArray(attrConfig.attributes)
            && attrConfig.attributes.indexOf(attr.attributeID) > -1)
            || attrConfig.attributes === '*') {
            result.push({
                attributeId: attr.attributeID,
                displayName: attr.displayName,
                id: attr.ID,
                swatchable: isSwatchable(attr.attributeID),
                values: values,
                resetUrl: resetUrl
            });
        } else if (attrConfig.attributes === 'selected') {
            result.push({
                displayName: attr.displayName,
                displayValue: selectedValue && selectedValue.displayValue ? selectedValue.displayValue : '',
                attributeId: attr.attributeID,
                id: attr.ID
            });
        }
    });

    result.forEach(function (item) {
        this.push(item);
    }, this);
}

VariationAttributesModel.prototype = [];

module.exports = VariationAttributesModel;
