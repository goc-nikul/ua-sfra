'use strict';

var Logger = require('dw/system/Logger');

var ATTRIBUTE_NAME = 'color';
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var Site = require('dw/system/Site');
var HashMap = require('dw/util/HashMap');
var Resource = require('dw/web/Resource');

var findColorByPrice = function (productObj, masterProduct) {
    if (productObj.memberPricing.hasMemberPrice && productObj.memberPricing.memberPriceVariants.length) {
        var firstMemberPriceVariant = productObj.memberPricing.memberPriceVariants[0];
        return firstMemberPriceVariant.custom.color;
    }
    var collections = require('*/cartridge/scripts/util/collections');
    var lowestPriceColor = null;
    var lowestPrice = null;
    var highestPrice = null;
    var variants = masterProduct.getVariants();
    collections.forEach(variants, function (v) {
        if (
            v.isVariant() &&
            v.onlineFlag &&
            v.availabilityModel.availability !== 0 &&
            v.availabilityModel.orderable &&
            !productHelper.isHiddenProduct(v)
        ) {
            if (!lowestPrice || v.priceModel.minPrice.value < lowestPrice) {
                lowestPrice = v.priceModel.minPrice.value;
                lowestPriceColor = v.custom.color;
            }
            if (!highestPrice || v.priceModel.minPrice.value > highestPrice) {
                highestPrice = v.priceModel.minPrice.value;
            }
        }
    });

    return highestPrice !== lowestPrice ? lowestPriceColor : null;
};

var getImages = function (product, apiProduct, hit, sizeModeViewPref, experienceType) {
    var variationModel = apiProduct.getVariationModel();
    if (apiProduct.custom.giftCard.value === 'EGIFT_CARD') {
        ATTRIBUTE_NAME = 'Amount';
    } else {
        ATTRIBUTE_NAME = 'color';
    }
    var attribute = variationModel.getProductVariationAttribute(ATTRIBUTE_NAME);
    var value = null; // eslint-disable-next-line
    var team =
        request.httpParameterMap.team && request.httpParameterMap.team.value
            ? request.httpParameterMap.team.value.split('|')
            : [];
    // eslint-disable-next-line no-undef
    var colorGroup =
        request.httpParameterMap.colorGroup && request.httpParameterMap.colorGroup.value
            ? request.httpParameterMap.colorGroup.value.split('|')
            : [];
    colorGroup = empty(team) ? colorGroup : team;
    // eslint-disable-next-line no-undef
    var isShopthisOutfit = request.httpParameterMap.shopThisLookoutfit
        ? request.httpParameterMap.shopThisLookoutfit.booleanValue
        : false;
    var selectedColor = '';
    try {
        var count = 0;
        var colorFound = false;
        var variant;
        var defaultColorByPrice;

        var defaultColorByPriceEnabled = Site.current.getCustomPreferenceValue('defaultColorByPrice');
        if (defaultColorByPriceEnabled && apiProduct.isMaster() && ATTRIBUTE_NAME === 'color') {
            defaultColorByPrice = findColorByPrice(product, apiProduct);
        }

        if (apiProduct.isMaster() && ATTRIBUTE_NAME === 'color' && colorGroup.length > 0) {
            for (var j = 0; j < colorGroup.length; ++j) {
                var translatedColorGroup = Resource.msg(
                    colorGroup[j].replace(/ /g, '_'),
                    'productColor',
                    colorGroup[j]
                );
                variant = productHelper.getVariantForCustomAttribute(
                    apiProduct,
                    translatedColorGroup,
                    isShopthisOutfit
                );
                if (
                    variant.isVariant() &&
                    variant.onlineFlag &&
                    variant.availabilityModel.availability !== 0 &&
                    variant.availabilityModel.orderable &&
                    !productHelper.isHiddenProduct(variant)
                ) {
                    for (var k = 0; k < hit.getRepresentedVariationValues(ATTRIBUTE_NAME).size(); ++k) {
                        if (hit.getRepresentedVariationValues(ATTRIBUTE_NAME).get(k).ID === variant.custom.color) {
                            count = k;
                            colorFound = true;
                            selectedColor = variant.custom.color;
                            break;
                        }
                    }
                    if (colorFound) {
                        break;
                    }
                }
            }
        } else if (defaultColorByPrice) {
            if (defaultColorByPrice) {
                for (var v = 0; v < hit.getRepresentedVariationValues(ATTRIBUTE_NAME).size(); ++v) {
                    if (hit.getRepresentedVariationValues(ATTRIBUTE_NAME).get(v).ID === defaultColorByPrice) {
                        count = v;
                        colorFound = true;
                        selectedColor = defaultColorByPrice;
                        break;
                    }
                }
            }
        } else if (
            apiProduct.isMaster() &&
            apiProduct.custom.defaultColorway !== null &&
            apiProduct.custom.defaultColorway.length > 0 &&
            ATTRIBUTE_NAME === 'color'
        ) {
            var colors = apiProduct.custom.defaultColorway.split(',');
            for (var i = 0; i < colors.length; ++i) {
                variant = productHelper.getVariantForColor(apiProduct, colors[i]);
                if (
                    variant.onlineFlag &&
                    variant.availabilityModel.availability !== 0 &&
                    variant.availabilityModel.orderable &&
                    !productHelper.isHiddenProduct(variant)
                ) {
                    for (var o = 0; o < hit.getRepresentedVariationValues(ATTRIBUTE_NAME).size(); ++o) {
                        if (hit.getRepresentedVariationValues(ATTRIBUTE_NAME).get(o).ID === colors[i]) {
                            count = o;
                            colorFound = true;
                            selectedColor = colors[i];
                            break;
                        }
                    }
                    if (colorFound) {
                        break;
                    }
                }
            }
        }

        while (count < hit.getRepresentedVariationValues(ATTRIBUTE_NAME).size()) {
            var map = new HashMap();
            map.put(ATTRIBUTE_NAME, hit.getRepresentedVariationValues(ATTRIBUTE_NAME).get(count).ID);
            // Contains variants which have the same color as default variant
            let productVariants = variationModel.getVariants(map);
            if (!productHelper.isHiddenColor(productVariants)) {
                break;
            }
            count++;
        }
        // getRepresentedVariationValues will throw exception for the unavailable variation attributes.
        value = hit.getRepresentedVariationValues(ATTRIBUTE_NAME).get(count);
    } catch (e) {
        Logger.error('exception in executing hit.getRepresentedVariationValues() ' + e.message);
    }
    var images = {
        mobile: {
            main: '',
            all: ''
        },
        desktop: {
            main: '',
            hover: ''
        }
    };
    var desktopImages = [];
    var mobileImages = [];
    var allMobileImages = [];
    var sizeModelImages = [];
    var selectedValue = null;
    if (value) {
        var imageViewType = null;
        var fitModelEnable =
            'enableFitModels' in Site.current.preferences.custom
                ? Site.current.getCustomPreferenceValue('enableFitModels')
                : false;
        variationModel.setSelectedAttributeValue(ATTRIBUTE_NAME, value.ID);
        if (
            experienceType &&
            (experienceType === 'outlet' || experienceType === 'outletMerchOverride') &&
            apiProduct.custom.outletColors &&
            apiProduct.custom.outletColors.indexOf(value.ID) === -1
        ) {
            // eslint-disable-line no-empty
        } else if (
            experienceType &&
            (experienceType === 'premium' || experienceType === 'premiumMerchOverride') &&
            apiProduct.custom.outletColors &&
            apiProduct.custom.outletColors.indexOf(value.ID) !== -1
        ) {
            // eslint-disable-line no-empty
        } else {
            desktopImages = variationModel.getImages('gridTileDesktop').toArray();
            mobileImages = variationModel.getImage('gridTileMobile', attribute, value);
            allMobileImages = variationModel.getImages('pdpMainDesktop').toArray();
            if (!empty(variationModel.getProductVariationAttribute('color'))) {
                selectedValue = variationModel.getSelectedValue(variationModel.getProductVariationAttribute('color'));
                selectedColor = selectedValue ? selectedValue.getID() : '';
            }
            if (fitModelEnable) {
                imageViewType = productHelper.sizeModelImagesMapping(sizeModeViewPref);
                if (!empty(imageViewType)) {
                    sizeModelImages = variationModel.getImages(imageViewType).toArray();
                    if (sizeModelImages.length > 0) {
                        sizeModelImages = productHelper.addRecipeToSizeModelImage(sizeModelImages, 2);
                    }
                }
            }
        }
        if (desktopImages.length === 0 && colorGroup.length === 0) {
            var variationValues = hit.getRepresentedVariationValues(ATTRIBUTE_NAME);
            for (var m = 0; m < variationValues.size(); ++m) {
                var variationMap = new HashMap();
                var attributeID = variationValues.get(m).ID;
                variationMap.put(ATTRIBUTE_NAME, attributeID);
                var variants = variationModel.getVariants(variationMap);
                variationModel.setSelectedAttributeValue(ATTRIBUTE_NAME, attributeID);
                for (var p = 0; p < variants.length; p++) {
                    // eslint-disable-next-line curly
                    if (
                        experienceType &&
                        (experienceType === 'outlet' || experienceType === 'outletMerchOverride') &&
                        apiProduct.custom.outletColors &&
                        apiProduct.custom.outletColors.indexOf(attributeID) === -1
                    )
                        break;
                    // eslint-disable-next-line curly
                    if (
                        experienceType &&
                        (experienceType === 'premium' || experienceType === 'premiumMerchOverride') &&
                        apiProduct.custom.outletColors &&
                        apiProduct.custom.outletColors.indexOf(attributeID) !== -1
                    )
                        break;
                    if (variationModel.getImages('gridTileDesktop').toArray().length === 0) {
                        break;
                    } else if (
                        variants[p].onlineFlag &&
                        variants[p].availabilityModel.availability !== 0 &&
                        variants[p].availabilityModel.orderable
                    ) {
                        desktopImages = variationModel.getImages('gridTileDesktop').toArray();
                        mobileImages = variationModel.getImage(
                            'gridTileMobile',
                            attribute,
                            hit.getRepresentedVariationValues(ATTRIBUTE_NAME).get(m)
                        );
                        allMobileImages = variationModel.getImages('pdpMainDesktop').toArray();
                        if (!empty(variationModel.getProductVariationAttribute('color'))) {
                            selectedValue = variationModel.getSelectedValue(
                                variationModel.getProductVariationAttribute('color')
                            );
                            selectedColor = selectedValue ? selectedValue.getID() : '';
                        }
                        imageViewType = productHelper.sizeModelImagesMapping(sizeModeViewPref);
                        if (fitModelEnable && !empty(imageViewType)) {
                            sizeModelImages = variationModel.getImages(imageViewType).toArray();
                            if (sizeModelImages.length > 0) {
                                sizeModelImages = productHelper.addRecipeToSizeModelImage(sizeModelImages, 2);
                            }
                        }
                        if (desktopImages.length > 0) {
                            break;
                        }
                    }
                }
                if (desktopImages.length > 0) {
                    break;
                }
            }
        }
    }
    if (value && desktopImages.length > 0) {
        images = {
            mobile: {
                main: mobileImages,
                all: allMobileImages
            },
            desktop: {
                main: sizeModelImages.length > 0 && !empty(sizeModelImages[0]) ? sizeModelImages[0] : desktopImages[0],
                hover: sizeModelImages.length > 0 && !empty(sizeModelImages[1]) ? sizeModelImages[1] : desktopImages[1]
            },
            selectedColor: {
                color: selectedColor
            }
        };
    } else {
        var url = productHelper.getNoImageURL('gridTileDesktop');
        images = {
            desktop: {
                main: {
                    alt: 'No Image',
                    title: 'No Image',
                    URL: url,
                    url: url,
                    viewType: 'gridTileDesktop'
                },
                hover: null
            }
        };
    }

    return images;
};
module.exports = function (object, apiProduct, hit, sizeModeViewPref, experienceType) {
    Object.defineProperty(object, 'images', {
        enumerable: true,
        value: getImages(object, apiProduct, hit, sizeModeViewPref, experienceType)
    });
};
