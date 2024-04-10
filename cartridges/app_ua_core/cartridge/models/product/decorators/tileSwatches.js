'use strict';

var ATTRIBUTE_NAME = 'color';
var collections = require('*/cartridge/scripts/util/collections'); //eslint-disable-line
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

var getGridSwatch = function (color, hit) {
    var variants = hit.getRepresentedProducts();
    var hexValue = '#1d1d1d';
    var hexIIValue = '#1d1d1d';
    var hexLogoValue = '#1d1d1d';
    collections.forEach(variants, function (variant) {
        if (variant.custom.color === color.value) {
            hexValue = variant.custom.hexcolor ? variant.custom.hexcolor : '#1d1d1d';
            hexIIValue = variant.custom.secondaryhexcolor ? variant.custom.secondaryhexcolor : hexValue;
            hexLogoValue = variant.custom.logohexcolor ? variant.custom.logohexcolor : '#1d1d1d';
        }
    });
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

/**
 * @param {string} productId , master product ID
 * @param {string} colorValue , variation color
 * @returns {string} url, URL of variation product
 */
var getVariationUrl = function (productId, colorValue) {
    var url = URLUtils.url(
        'Product-Show',
        'pid',
        productId,
        'dwvar_' + productId + '_color',
        colorValue
    );
    return url.toString();
};

/**
 * @description returns object, used to render swatches on PLP and PDP
 * @param {Object} hit, product search result hit
 * @param {string} outletColors, comma separated list of outlet color codes
 * @param {string} experienceType, identifies what filtering to apply to swatches (if any) outlet|premium|null
 * @param {string} sizeModeViewPref, model size view pref
 * @param {boolean} isFilterByTeam, check if filter by team and PLP page
 * @param {string} filterTeam, filter by team
 * @param {string} selectedColor, filter by color
 * @returns {Object} swatches object
 */
var getSwatches = function (hit, outletColors, experienceType, sizeModeViewPref, isFilterByTeam, filterTeam, selectedColor) {
    if (!hit) {
        return null;
    }
    const values = [];
    var colors = hit.getRepresentedVariationValues(ATTRIBUTE_NAME).iterator();
    var variationModel = hit.getProduct().getVariationModel();
    var masterProudct = variationModel.getMaster();
    var isFanWear = typeof masterProudct !== 'undefined' && masterProudct !== null && !empty(masterProudct.custom.enduse) ? true : false; // eslint-disable-line no-unneeded-ternary
    var sizeModelSwatchImage = [];
    var imageViewType = null;
    var fitModelEnable = 'enableFitModels' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enableFitModels') : false;
    if (fitModelEnable) {
        imageViewType = productHelper.sizeModelImagesMapping(sizeModeViewPref);
    }
    while (colors.hasNext()) {
        let colorItem = colors.next(); // eslint-disable-line
        if ((experienceType === 'outlet' || experienceType === 'outletMerchOverride') && outletColors && outletColors.indexOf(colorItem.ID) === -1) continue; // eslint-disable-line no-continue
        if ((experienceType === 'premium' || experienceType === 'premiumMerchOverride') && outletColors && outletColors.indexOf(colorItem.ID) !== -1) continue; // eslint-disable-line no-continue
        variationModel.setSelectedAttributeValue('color', colorItem.ID);
        var colorVariationAttribute = variationModel.getProductVariationAttribute('color');
        if (colorVariationAttribute) {
            var colorVariants = variationModel.getSelectedVariants();
            if (empty(experienceType)) {
                if (colorVariants && colorVariants.length) {
                    var colorVariationValue = variationModel.getVariationValue(colorVariants[0], colorVariationAttribute);
                    if (colorVariationValue && !variationModel.hasOrderableVariants(colorVariationAttribute, colorVariationValue)) {
                        continue; // eslint-disable-line no-continue
                    }
                }
            }
            if (colorVariants && colorVariants.length) {
                if (isFilterByTeam && isFanWear) {
                    var colorVariant = colorVariants[0];
                    var selectedTeam = colorVariant.custom.team;
                    if (!empty(filterTeam) && filterTeam !== selectedTeam) {
                        continue; // eslint-disable-line no-continue
                    }
                }

                var earlyAccessSwatchHide = colorVariants.toArray().every(cVariant =>'earlyAccessConfigs' in cVariant.custom && cVariant.custom.earlyAccessConfigs.value === 'HIDE');
                if (earlyAccessSwatchHide) {
                    continue; // eslint-disable-line no-continue
                }
            }
            var desktopImages = variationModel.getImages('gridTileDesktop').toArray();
            if (fitModelEnable && !empty(imageViewType)) {
                sizeModelSwatchImage = variationModel.getImages(imageViewType).toArray();
                if (sizeModelSwatchImage.length > 0) {
                    sizeModelSwatchImage = productHelper.addRecipeToSizeModelImage(sizeModelSwatchImage, 1);
                }
            }
            if (desktopImages.length > 0) {
                var gridSwatch = getGridSwatch(colorItem, hit);
                var type = gridSwatch.image ? 'image' : 'color';
                var swatchData = {
                    id: colorItem.ID,
                    description: colorItem.description,
                    displayValue: colorItem.displayValue,
                    value: colorItem.value,
                    selectable: true,
                    selected: colorItem.value === selectedColor,
                    type: type,
                    url: getVariationUrl(hit.productID, colorItem.value),
                    color: {
                        value: colorItem.value,
                        hex: gridSwatch.color.hex,
                        hexII: gridSwatch.color.hexII,
                        hexLogo: gridSwatch.color.hexlogo,
                        title: colorItem.displayValue,
                        stdLightness: 0.6
                    },
                    hoverImage: sizeModelSwatchImage.length > 0 && !empty(sizeModelSwatchImage[0]) ? sizeModelSwatchImage[0] : colorItem.getImage('gridTileDesktop', 0)
                };
                swatchData.color.lightnessValues = productHelper.changeSwatchBorder(swatchData.color.hex, swatchData.color.hexII);
                if (gridSwatch.image) {
                    swatchData.image = {
                        alt: gridSwatch.image.alt,
                        url: gridSwatch.image.URL.toString(),
                        title: gridSwatch.image.title
                    };
                }
                values.push(swatchData);
            }
        }
    }

    const retObj = {
        count: values.length,
        values: values };
    return retObj;
};

module.exports = function (object, hit, outletColors, experienceType, sizeModeViewPref, isFilterByTeam, filterTeam, selectedColor) {
    Object.defineProperty(object, 'swatches', {
        enumerable: true,
        value: getSwatches(hit, outletColors, experienceType, sizeModeViewPref, isFilterByTeam, filterTeam, selectedColor)
    });
};
