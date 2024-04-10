'use script';

var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var ProductHelpers = require('*/cartridge/scripts/helpers/productHelpers');

var IMAGE_SIZE = 'medium';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
/**
 * Get product search hit for a given product
 * @param {dw.catalog.Product} apiProduct - Product instance returned from the API
 * @returns {dw.catalog.ProductSearchHit} - product search hit for a given product
 */
function getProductSearchHit(apiProduct) {
    var searchModel = new ProductSearchModel();
    searchModel.setSearchPhrase(apiProduct.ID);
    searchModel.search();

    if (searchModel.count === 0) {
        searchModel.setSearchPhrase(apiProduct.ID.replace(/-/g, ' '));
        searchModel.search();
    }

    var hit = searchModel.getProductSearchHit(apiProduct);
    if (!hit) {
        if (searchModel.getProductSearchHits().hasNext()) {
            var tempHit = searchModel.getProductSearchHits().next();
            if (tempHit.firstRepresentedProductID === apiProduct.ID) {
                hit = tempHit;
            }
        }
    }
    return hit;
}

/**
 * Get Product default variant for color
 *
 * @param {dw.catalog.Product} prod - apiProduct
 * @param {string} colorId - color of the product
 * @return {dw.catalog.Product} - product - color variant
 */
function getVariantForColor(prod, colorId) {
    var collections = require('*/cartridge/scripts/util/collections');
    var newProduct = prod;
    var variants = prod.getVariants();
    var variantProduct = null;
    if (variants === null || variants.length === 0) {
        return newProduct;
    }

    collections.forEach(variants, function (variant) {
        if (variant.onlineFlag && variant.availabilityModel.orderable && variant.custom.color === colorId && variantProduct == null) {
            variantProduct = variant;
            newProduct = variant;
        }
    });
    return newProduct;
}

/**
 * Get default color variant of a product
 *
 * @param {dw.catalog.Product} product - apiProduct
 * @return {dw.catalog.Product} - product -  available default color variant
 */
function getDefaultColorVariant(product) {
    var defaultColorVarinat = product;

    if (product.isMaster() && product.custom.defaultColorway !== null && product.custom.defaultColorway.length > 0) {
        var colors = product.custom.defaultColorway.split(',');
        for (var i = 0; i < colors.length; ++i) {
            var variant = getVariantForColor(product, colors[i]);
            if (variant.isVariant() && variant.onlineFlag && variant.availabilityModel.availability !== 0 && variant.availabilityModel.orderable && variant.availabilityModel.inStock) {
                defaultColorVarinat = variant;
                break;
            }
        }
    }
    return defaultColorVarinat;
}

/**
 * Get Product variant for color & size
 *
 * @param {dw.catalog.Product} prod - apiProduct
 * @param {string} colorId - color of the product
 * @param {string} sizeID - size of the product
 * @return {dw.catalog.Product} - product - color variant
 */
function getVariantForColorSize(prod, colorId, sizeID) {
    var collections = require('*/cartridge/scripts/util/collections');
    var newProduct = prod;
    var variants = prod.getVariants();
    var variantProduct = null;
    if (variants === null || variants.length === 0) {
        return newProduct;
    }

    collections.forEach(variants, function (variant) {
        if (variant.onlineFlag && variant.availabilityModel.orderable && variant.custom.color === colorId && variant.custom.size === sizeID && variantProduct == null) {
            variantProduct = variant;
            newProduct = variant;
        }
    });
    return newProduct;
}

/**
 * Get Product default variant for color
 *
 * @param {dw.catalog.Product} prod - apiProduct
 * @param {string} colorId - color of the product
 * @param {boolean} isShopthisOutfit - shop This Look outfit
 * @return {dw.catalog.Product} - product - color variant
 */
function getVariantForCustomAttribute(prod, colorId, isShopthisOutfit) {
    var collections = require('*/cartridge/scripts/util/collections');
    var newProduct = prod;
    var variants = prod.getVariants();
    if (variants === null || variants.length === 0) {
        return newProduct;
    }

    collections.forEach(variants, function (variant) {
        if (variant.onlineFlag && variant.availabilityModel.orderable && variant.custom.team === colorId) {
            newProduct = variant;
            return;
        } else if (variant.onlineFlag && variant.availabilityModel.orderable && variant.custom.colorgroup === colorId && !isShopthisOutfit) {
            newProduct = variant;
            return;
        } else if (isShopthisOutfit && variant.onlineFlag && variant.availabilityModel.orderable && variant.custom.color === colorId) {
            newProduct = variant;
            return;
        }
    });
    return newProduct;
}

/**
 * Checks if this product is hidden
 * @param {dw.catalog.Product} prod product
 * @returns {boolean} true if variant is hidden
 */
function isHiddenProduct(prod) {
    return 'earlyAccessConfigs' in prod.custom && prod.custom.earlyAccessConfigs.value === 'HIDE';
}

/**
 * Check if all variants of a color are hidden
 * @param {dw.util.Collection} productVariants color variants
 * @returns {boolean} true if all variants are hidden
 */
function isHiddenColor(productVariants) {
    return productVariants.toArray().every((variant) => {
        return isHiddenProduct(variant);
    });
}

/**
 * Get Product orderable variant for master product
 *
 * @param {dw.catalog.Product} prod - apiProduct
 * @param {string} experienceType - string for experienceType outlet|premium|null
 * @return {dw.catalog.Product} - product - orderable variant
 */
function getOrderableVariant(prod, experienceType) {
    let defaultVariant = prod.getVariationModel().getDefaultVariant(); //eslint-disable-line
    let outletColors = prod.custom.outletColors; //eslint-disable-line

    // Return defaultVariant if orderable
    if (!empty(defaultVariant) && defaultVariant.availabilityModel.orderable && !isHiddenProduct(defaultVariant)) {
        if (empty(outletColors) || experienceType == '') return defaultVariant; // eslint-disable-line
        else if (experienceType === 'premium' && outletColors.indexOf(defaultVariant.custom.color) === -1) return defaultVariant;
        else if (experienceType === 'outlet' && outletColors.indexOf(defaultVariant.custom.color) > -1) return defaultVariant;
    }

    // If default variant is not orderable, try to find an orderable variant in
    // the same color as the default variant, or if none, any orderable variant,
    // regardless of color.
    var productVariants;

    // First check for orderable variants in the same color as the default variant
    if (!empty(defaultVariant)) {
        var colorVariationAttribute = prod.variationModel.getProductVariationAttribute('color');
        var colorVariationValue = prod.variationModel.getVariationValue(defaultVariant, colorVariationAttribute);
        if (colorVariationAttribute && colorVariationValue && prod.variationModel.hasOrderableVariants(colorVariationAttribute, colorVariationValue)) {
            var HashMap = require('dw/util/HashMap');
            var map = new HashMap();
            map.put(colorVariationAttribute.ID, colorVariationValue.ID);
            // Contains variants which have the same color as default variant
            productVariants = prod.variationModel.getVariants(map);
            if (isHiddenColor(productVariants)) {
                productVariants = null;
            } else {
                productVariants = productVariants.iterator();
            }
        }
    }

    // If no orderable variants in the same color as the default variant,
    // or no default variant to start with, check for any orderable
    // variant, regardless of color.
    if (!productVariants) {
        // Contains all online variants
        productVariants = prod.variationModel.getVariants().iterator();
    }

    // If there are eligible alternatives to the default variante, retunr the
    // first orderable variant from the eligible list
    if (productVariants) {
        while (productVariants.hasNext()) {
            let productVariant = productVariants.next(); //eslint-disable-line
            if (productVariant.availabilityModel.orderable && !isHiddenProduct(productVariant)) {
                if(empty(outletColors) || experienceType == '') return productVariant; // eslint-disable-line
                else if (experienceType === 'premium' && outletColors.indexOf(productVariant.custom.color) === -1) return productVariant;
                else if (experienceType === 'outlet' && outletColors.indexOf(productVariant.custom.color) > -1) return productVariant;
            }
        }
    }

    // No eligible variant found, so return master
    return prod;
}
/**
 * Get Product Image URL
 *
 * @param {dw.catalog.Product} product - Suggested product
 * @param {string} size - size of image
 * @return {string} - Image URL
 */
function getProductImageUrl(product, size) {
    var imageProduct = product;
    if (product.master) {
        imageProduct = product.variationModel.defaultVariant;
    }
    var image = imageProduct.getImage(size || IMAGE_SIZE);
    return image && image.URL.toString();
}

/**
 * Create JSON and return the variation product prices,color ids and color name
 * variation product prices and color.
 * @param   {Object} productObj        product object
 * @param   {Object} color        color object
 * @param   {string} variantPrice        variantPrice
 * @return  {Object}           The JSON obj values
 */
function variationPriceColorJSON(productObj, color, variantPrice) {
    var Resource = require('dw/web/Resource');
    var variationJSON = {};
    variationJSON.colorID = color.id;
    var colorName = '';
    var fixColorName = '';
    if (!empty(productObj.custom.team) && productObj.custom.team !== 'N/A') {
        colorName = productObj.custom.team + '-' + productObj.custom.color;
    } else if (productObj.custom.colorway || productObj.custom.color) {
        var fixProductColorNames = ProductHelpers.fixProductColorNames(productObj.custom.colorway);
        if (productObj.custom.colorway) {
            fixColorName = !empty(fixProductColorNames) ? fixProductColorNames + '-' : productObj.custom.colorway + '-';
        }
        colorName = fixColorName + productObj.custom.color;
    } else {
        colorName = Resource.msg('label.select', 'common', null) + ' ' + color.displayValue;
    }
    variationJSON.colorName = colorName;
    variationJSON.price = variantPrice;
    return variationJSON;
}

/**
 * Identify if product is availabe for locale based on site preference value
 * and custom attribute ' availableForLocale' in the product
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @return {boolean} - If item
 */
function isProductAvailableForLocale(product) {
    var isAvailablePerLocale = ('enableAvailablePerLocale' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enableAvailablePerLocale');
    try {
        if (empty(product)) {
            return false;
        }
        if ((isAvailablePerLocale && product.custom.availableForLocale.value !== 'No') || !isAvailablePerLocale) {
            return true;
        }

        return false;
    } catch (e) {
        Logger.error('productHelpers.js::isProductAvailableForLocale() ' + e.message);
        return false;
    }
}

/**
 * Identify if product is availabe for locale based on site preference value
 * and custom attribute ' availableForLocale' in the product
 * @return {boolean} - If enableAvailablePerLocale
 */
function enableAvailablePerLocale() {
    try {
        var isAvailablePerLocale = ('enableAvailablePerLocale' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enableAvailablePerLocale');
        if (isAvailablePerLocale) {
            return true;
        }
        return false;
    } catch (e) {
        Logger.error('productHelpers.js::enableAvailablePerLocale() ' + e.message);
        return false;
    }
}

/**
 * Identify if product tile image slider site preference value is enabled
 * @return {boolean} - If enablePLPImageSlider
 */
function enablePLPImageSlider() {
    try {
        var showPLPImageSlider = ('enablePLPImageSlider' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enablePLPImageSlider');
        if (showPLPImageSlider) {
            return true;
        }
        return false;
    } catch (e) {
        Logger.error('productHelpers.js::enablePLPImageSlider() ' + e.message);
        return false;
    }
}

ProductHelpers.getProductSearchHit = getProductSearchHit;
ProductHelpers.getProductImageUrl = getProductImageUrl;
ProductHelpers.getVariantForColor = getVariantForColor;
ProductHelpers.getDefaultColorVariant = getDefaultColorVariant;
ProductHelpers.isHiddenProduct = isHiddenProduct;
ProductHelpers.isHiddenColor = isHiddenColor;
ProductHelpers.getOrderableVariant = getOrderableVariant;
ProductHelpers.getVariantForCustomAttribute = getVariantForCustomAttribute;
ProductHelpers.variationPriceColorJSON = variationPriceColorJSON;
ProductHelpers.isProductAvailableForLocale = isProductAvailableForLocale;
ProductHelpers.enableAvailablePerLocale = enableAvailablePerLocale;
ProductHelpers.enablePLPImageSlider = enablePLPImageSlider;
ProductHelpers.getVariantForColorSize = getVariantForColorSize;
module.exports = ProductHelpers;
