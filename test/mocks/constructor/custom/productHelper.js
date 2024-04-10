'use strict';

function parseAttributeValue(value) {
    if (!value) {
        return null;
    }

    if (value.constructor.name === 'dw.content.MarkupText') {
        return value.markup;
    }

    if (value.constructor.name === 'dw.value.EnumValue') {
        return value.value;
    }

    if (value.constructor.name === 'Array') {
        var result = [];

        for (var i = 0; i < value.length; i += 1) {
            var innerValue = parseAttributeValue(value[i]);
            result.push(innerValue);
        }

        return result;
    }

    return value || null;
}

function getAttributeValue(product, attributeID) {
    var value = product.custom[attributeID];

    return parseAttributeValue(value);
}

function getVariationGroupOrNull(product) {
    if (!product.variationModel) {
        return null;
    }

    var variationGroups = product.variationModel.variationGroups.toArray();

    var sameColorVariationGroup = variationGroups.filter(function filter(variationGroup) {
        return variationGroup.custom.color === product.custom.color;
    })[0];

    return sameColorVariationGroup || variationGroups[0] || null;
}

function getInventoryAmount(product) {
    if (!empty(product)) {
        // if exclusive = out-of-stock, return 0
        if ('exclusive' in product.custom && !empty(product.custom.exclusive)) {
            if (product.custom.exclusive === 'out-of-stock') {
                return 0;
            }
        }

        var inventoryRecord = product.availabilityModel.inventoryRecord;

        if (!empty(inventoryRecord) && Object.keys(inventoryRecord).length) {
            // if the inventory is perpetual, return the highest allowed value for positive integers
            if (inventoryRecord.isPerpetual()) {
                return 2147483647;
            }

            // return inventory amount
            return inventoryRecord.ATS.value;
        }
    }

    // if there is no product or inventory record, return 0
    return 0;
}

function getCustomerGroupPricing(product, productPromotions, changeKeys) {
    var pricing = [];

    if (!empty(productPromotions) && productPromotions.length > 0) {
        var promos = productPromotions.toArray();

        // get promotion pricing for the passed product
        promos.forEach(function (promo) { // eslint-disable-line array-callback-return
            // only use promos not based on coupons
            if (!promo.basedOnCoupons) {
                var promoPrice = promo.getPromotionalPrice(product);
                // verify the promo is applicable
                if (!empty(promoPrice) && promoPrice.isAvailable()) {
                    // get customer groups on promo
                    var groups = promo.customerGroups.toArray();

                    // save promo customer groups and price
                    groups.forEach(function (group) { // eslint-disable-line array-callback-return
                        var groupId = changeKeys ? 'Price ' + group.ID : group.ID;

                        // add customer group and price to the list if they are not in the list already
                        if (pricing.findIndex(item => (item.key === groupId && item.value === promoPrice.value)) < 0) {
                            pricing.push({ key: groupId, value: promoPrice.value });
                        }
                    });
                }
            }
        });
    }

    return pricing;
}

function getDisplayValues(product, attributeName) {
    var displayValues = [];

    // get product attribute and values
    var attribute = product.variationModel.getProductVariationAttribute(attributeName);
    if (!empty(attribute)) {
        var attributeValues = product.variationModel.getAllValues(attribute).toArray();

        // get display value for each attribute value
        attributeValues.forEach(function (value) {
            displayValues.push(value.displayValue);
        });
    }

    return displayValues;
}

function buildInventorySizeMap(product, sizeMap) {
    // get size attribute for the passed product
    var sizeAttribute = product.variationModel.getProductVariationAttribute('size');
    if (!empty(sizeAttribute)) {
        // get size value for the passed product
        var sizeValue = product.variationModel.getVariationValue(product, sizeAttribute);
        if (!empty(sizeValue)) {
            // get inventory record and quantity for the passed product
            var qty = !empty(product) ? getInventoryAmount(product) : 0;

            // get inventory quantity from map(if any)
            var inventoryFromMap = sizeMap.get(sizeValue.value);

            // add inventory record qty to inventory from map and save
            if (!empty(inventoryFromMap) && qty > 0) {
                sizeMap.set(sizeValue.value, qty + inventoryFromMap);
            } else {
                sizeMap.set(sizeValue.value, qty);
            }
        }
    }

    return sizeMap;
}

function buildCustomerGroupPromoPriceMap(product, variantPrices) {
    var promotionMgr = require('dw/campaign/PromotionMgr');

    // get all active product promos applicable to the passed product
    var promos = promotionMgr.getActivePromotions().getProductPromotions(product);

    // get list of prices for each customer group in each of the promos
    var prices = getCustomerGroupPricing(product, promos, false);
    prices.forEach(function (price) {
        if (!empty(price)) {
            // add customer group and price to the list if they are not in the list already
            if (variantPrices.findIndex(item => (item.key === price.key && item.value === price.value)) < 0) {
                variantPrices.push(price);
            }
        }
    });

    return variantPrices;
}

function formatGroupPromoPricing(originalPrices) {
    var prices = {};

    if (originalPrices.length > 0) {
        originalPrices.forEach((originalPrice) => {
            if (!prices[originalPrice.key]) {
                // add customer group, min and max prices to the new list if not already present
                prices[originalPrice.key] = { min: originalPrice.value, max: originalPrice.value };
            } else {
                // update min price if price for the matching customer group < current price
                if (originalPrice.value < prices[originalPrice.key].min) {
                    prices[originalPrice.key].min = originalPrice.value;
                }

                // update max price if price for the matching customer group > current price
                if (originalPrice.value > prices[originalPrice.key].max) {
                    prices[originalPrice.key].max = originalPrice.value;
                }
            }
        });
    }

    return prices;
}

function getVariantData(product, data) {
    if (product.variant) {
        return '';
    }

    // get variant data from shared variation attributes
    var variantData = {};
    var colors = [];
    var sizes = [];

    // list of variant colors
    colors = getDisplayValues(product, 'color');
    if (colors.length > 0) {
        variantData.colors = colors.join(',');
    }

    // list of variant sizes(S, M, L, XL, etc)
    sizes = getDisplayValues(product, 'size');
    if (sizes.length > 0) {
        variantData.sizes = sizes.join(',');
    }

    // get variant data NOT from shared variation attributes
    var skus = [];
    var upcs = [];
    var sizeMap = new Map();
    var variants = product.getVariants().toArray();
    var variantPrices = [];

    variants.forEach(function (variant) {
        if (variant.onlineFlag) {
            // for each variant, add the sku
            skus.push(variant.custom.sku);

            // for each variant, add the upc(product id)
            upcs.push(variant.ID);

            // for each size(S, M, L, XL, etc), add up the inventory
            sizeMap = buildInventorySizeMap(variant, sizeMap);

            // for each variant, add customer group pricing for promos
            if (data.promoPricingEnabled) {
                variantPrices = buildCustomerGroupPromoPriceMap(variant, variantPrices);
            }
        }
    });

    // list of variant skus
    if (skus.length > 0) {
        variantData.skus = JSON.stringify(skus);
    }

    // list of variant upcs(product ids)
    if (upcs.length > 0) {
        variantData.upcs = JSON.stringify(upcs);
    }

    // list of inventory quantities for each variant
    if (sizeMap.size > 0) {
        var sizeArray = Array.from(sizeMap.values());
        variantData.qtys = sizeArray.join(',');
    }

    // list of min/max prices for each variant by customer group(if they have at least one active promo)
    if (data.promoPricingEnabled && variantPrices.length > 0) {
        variantData.customerGroupPricing = JSON.stringify(formatGroupPromoPricing(Array.from(variantPrices)));
    }

    return variantData;
}

function isEGiftCard(product) {
    return 'giftCard' in product.custom && !empty(product.custom.giftCard) && product.custom.giftCard.value === 'EGIFT_CARD';
}

function getMinPrice(product, priceBookID) {
    // return set minimum if product is an e-gift card
    if (isEGiftCard(product)) {
        return 10;
    }

    var price = product.priceModel.getMinPriceBookPrice(priceBookID).value;
    if (empty(price)) {
        price = product.priceModel.getPrice().value;
    }

    return price;
}

function getMaxPrice(product, priceBookID) {
    // return set maximum if product is an e-gift card
    if (isEGiftCard(product)) {
        return 500;
    }

    var price = product.priceModel.getMaxPriceBookPrice(priceBookID).value;
    if (empty(price)) {
        price = product.priceModel.getPrice().value;
    }

    return price;
}

function hasValidPrice(product, listPriceBookID, salePriceBookID) {
    if (product.custom && product.custom.giftCard && product.custom.giftCard.value === 'EGIFT_CARD') {
        var eGiftCardMinAmount = 10;
        return eGiftCardMinAmount > 0;
    }

    var listPrice = product.priceModel.getPriceBookPrice(listPriceBookID).value;
    var salePrice = product.priceModel.getPriceBookPrice(salePriceBookID).value;

    return !empty(listPrice) && listPrice > 0 && !empty(salePrice) && salePrice > 0;
}

function getClassificationCategory(product) {
    var CatalogMgr = require('../../../mocks/dw/dw_catalog_CatalogMgr');

    var classificationCategory = product.getClassificationCategory();
    var currentSiteCatalogCategory = null;

    if (empty(classificationCategory)) {
        return null;
    }

    currentSiteCatalogCategory = CatalogMgr.getCategory(classificationCategory.ID);

    if (empty(currentSiteCatalogCategory)) {
        return null;
    }

    // Comparing object's UUID to identify that they are belong to the same catalog
    if (classificationCategory.UUID !== currentSiteCatalogCategory.UUID) {
        classificationCategory = null;
    }

    return classificationCategory;
}

function getProductCategory(product, primaryCategory) {
    var category = getClassificationCategory(product);

    if (!empty(category)) {
        return category;
    }

    category = primaryCategory;

    if (empty(category)) {
        var categories = product.getCategories();

        if (categories.size() > 0) {
            category = categories[0];
        }
    }

    return category;
}

function getCategoryPath(product, primaryCategory) {
    var catOutput = [];
    var cat = getProductCategory(product, primaryCategory);

    if (!empty(cat)) {
        while (cat.ID !== 'root') {
            catOutput.push(cat.displayName);
            cat = cat.parent;
            if (empty(cat)) {
                return '';
            }
        }

        return catOutput.reverse().join(' > ');
    }

    return '';
}

function getOnModelImage(product) {
    var prodImages = product.getImages('onmodelImage');
    var onmodelImageUrl = '';

    if (prodImages.length > 0) {
        onmodelImageUrl = encodeURI(prodImages[0].httpsURL.toString());
        onmodelImageUrl = onmodelImageUrl.replace(/,/g, '%2C');
    }
    return onmodelImageUrl;
}

function getVideoMaterials(product) {
    var videoURL = '';

    if (!product.master) {
        var videoMaterial = require('../../../mocks/core/dw/model/decorators/videoMaterial');

        var videoModel = {};
        videoMaterial(videoModel, product);
        //return videoModel.video360Material;
        videoURL = videoModel.video360Material && videoModel.video360Material.length > 0 &&
            videoModel.video360Material[0] && videoModel.video360Material[0].video_url_mp4 ?
            videoModel.video360Material[0].video_url_mp4 : '';
    }

    return videoURL;
}

function hideColorWay(inStock) {
    return typeof inStock === 'boolean' ? !inStock : null;
}

function getProductUrl(product) {
    var productUrl;
    if (product.isVariant()) {
        productUrl = '/s/US/en-us/p/' + product.getMasterProduct().ID + '.html';
    } else {
        productUrl = '/s/US/en-us/p/' + product.ID + '.html';
    }

    // remove site and locale data from url
    const siteId = 'US';
    const sitePattern = '/s/' + siteId;
    // eslint-disable-next-line no-undef
    const localePattern = '/' + 'en_US'.toLowerCase().replace('_', '-');
    return productUrl.replace(sitePattern, '').replace(localePattern, '');
}

function getProductId(product) {
    if (product.isVariant()) {
        if ('sku' in product.custom && !empty(product.custom.sku)) {
            return product.custom.sku;
        }
    }

    return product.ID;
}

function getPreorderMessages(product) {
    var preOrderObj = {};
    if ('preOrderPDPMessage' in product.custom && !empty(product.custom.preOrderPDPMessage)) {
        preOrderObj.pdpMessage = product.custom.preOrderPDPMessage;
    }
    if ('preOrderProductTileMessage' in product.custom && !empty(product.custom.preOrderProductTileMessage)) {
        preOrderObj.tileMessage = product.custom.preOrderProductTileMessage;
    }

    // return message
    if (Object.keys(preOrderObj).length > 0) {
        return JSON.stringify(preOrderObj);
    }

    return '';
}

function getDefaultColorwayId(product) {
    return 'defaultColorway' in product.custom && !empty(product.custom.defaultColorway) ? product.custom.defaultColorway : null;
}

function getSizeModelImages(product, imageCount) {
    // get fit model site pref
    var fitModelEnable = true;

    if (!empty(fitModelEnable) && fitModelEnable) {
        var sizeModelImages = [];

        if (!empty(product.custom.size)) {
            // get image view types
            var productHelpers = require('../../../../../mocks/scripts/helpers/productHelpers');
            var imageViewType = productHelpers.sizeModelImagesMapping(product.custom.size.toLowerCase());

            if (!empty(imageViewType)) {
                // get images
                sizeModelImages = product.getImages(imageViewType);

                if (!empty(sizeModelImages) && sizeModelImages.length) {
                    // add recipes
                    sizeModelImages = sizeModelImages.toArray();
                    sizeModelImages = productHelpers.addRecipeToSizeModelImage(sizeModelImages, imageCount);

                    if (!empty(sizeModelImages) && sizeModelImages.length) {
                        return sizeModelImages;
                    }
                }
            }
        }
    }

    return [];
}

function getLastTokenInURLPath(url) {
    const paths = url.split('/');
    var lastTokenAndParamsStr = paths[paths.length - 1];
    var lastTokenAndParamsArr = lastTokenAndParamsStr.split('?');
    return lastTokenAndParamsArr[0];
}

function isSizeModelImageFrontFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_FC') > 0;
}

function isSizeModelImageRearFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_BC') > 0;
}

function isImageFrontFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_LDF') > 0;
}

function isImageRearFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_LDB') > 0;
}

function countOccurrences(inputString, targetCharacter) {
    let count = 0;

    if (!empty(inputString)) {
        for (let i = 0; i < inputString.length; i++) {
            if (inputString[i] === targetCharacter) {
                count++;
            }
        }
    }

    return count;
}

function getAttributeValuesFromName(product, attributeID) {
    var attributeValue;

    // count occurrences of dots in the attribute id
    var dotCount = countOccurrences(attributeID, '.');
    if (dotCount > 0) {
        // custom attribute

        // get the location of the first dot
        var firstDot = attributeID.indexOf('.');

        if (firstDot >= 1) {
            // get the first nested object ID
            var firstObj = attributeID.substring(0, firstDot);

            if (!empty(firstObj) && firstObj in product && !empty(product[firstObj])) {
                // get the second nested object ID
                var secondObj = attributeID.substring((firstDot + 1), attributeID.length);

                if (!empty(secondObj) && secondObj in product[firstObj] && !empty(product[firstObj][secondObj])) {
                    if (dotCount === 1) {
                        // get attribute value
                        attributeValue = product[firstObj][secondObj];
                    }

                    if (dotCount === 2) {
                        // get the third nested object ID
                        var secondDot = attributeID.indexOf('.', firstDot + 1);
                        secondObj = attributeID.substring((firstDot + 1), secondDot);
                        var thirdObj = attributeID.substring((secondDot + 1), attributeID.length);

                        if (!empty(thirdObj) && thirdObj in product[firstObj][secondObj] && !empty(product[firstObj][secondObj][thirdObj])) {
                            // get attribute value
                            attributeValue = product[firstObj][secondObj][thirdObj];
                        }
                    }
                }
            }
        }
    } else {
        // standard attribute

        // get attribute value
        attributeValue = !empty(product[attributeID]) ? product[attributeID] : '';
    }

    return attributeValue;
}

function getColorwayPrimary(colorway) {
    if (!empty(colorway) && colorway.indexOf(' / ') > 0) {
        return colorway.split(' / ')[0];
    }

    return colorway;
}

function getIcons(product) {
    var icons = product.custom.icons;

    // copy display values to a separate array and return them
    return !empty(icons) && icons.length ? icons.map(obj => (obj.displayValue)) : null;
}

function isDefaultColorwayId(product) {
    if (!empty(product) && product.isVariant()) {
        // get default colorway id of master product
        var defaultMasterColorway = getDefaultColorwayId(product.masterProduct);

        // compare default colorway id of master product to passed variant
        return defaultMasterColorway === product.custom.color;
    }

    return false;
}

function pad(number) {
    return number < 10 ? '0' + number : number;
}

function getReleaseDate(product) {
    if (!empty(product) && 'releaseDate' in product.custom && !empty(product.custom.releaseDate)) {
        // convert UTC date/time to local server date/time
        var releaseDate = new Date();
        var offset = -((releaseDate.getTimezoneOffset() * 60) * 1000);
        releaseDate.setTime(product.custom.releaseDate.valueOf() + offset);

        // set minutes and seconds to zero
        releaseDate.setMinutes(0, 0, 0);

        // add one hour to round up to the next hour
        releaseDate.setHours(releaseDate.getHours() + 1);

        // format date
        var offsetSign = offset >= 0 ? '-' : '+';
        offset = offset < 0 ? offset * -1 : offset;
        var offsetHours = (((offset / 1000) / 60) / 60);

        return (
            releaseDate.getFullYear() +
            '-' + pad(releaseDate.getMonth() + 1) +
            '-' + pad(releaseDate.getDate()) +
            ' ' + pad(releaseDate.getHours()) +
            ':00:00.000' +
            offsetSign + pad(offsetHours) +
            ':00'
        );
    }

    return null;
}

function isSearchableIfUnavailable(product) {
    if (!product) {
        return false;
    }
    return !!product.searchableIfUnavailableFlag;
}

module.exports = {
    parseAttributeValue: parseAttributeValue,
    getAttributeValue: getAttributeValue,
    getVariationGroupOrNull: getVariationGroupOrNull,
    getInventoryAmount: getInventoryAmount,
    getCustomerGroupPricing: getCustomerGroupPricing,
    getDisplayValues: getDisplayValues,
    buildInventorySizeMap: buildInventorySizeMap,
    buildCustomerGroupPromoPriceMap: buildCustomerGroupPromoPriceMap,
    formatGroupPromoPricing: formatGroupPromoPricing,
    getVariantData: getVariantData,
    isEGiftCard: isEGiftCard,
    getMinPrice: getMinPrice,
    getMaxPrice: getMaxPrice,
    getClassificationCategory: getClassificationCategory,
    getProductCategory: getProductCategory,
    getCategoryPath: getCategoryPath,
    getOnModelImage: getOnModelImage,
    getVideoMaterials: getVideoMaterials,
    hideColorWay: hideColorWay,
    getProductUrl: getProductUrl,
    getProductId: getProductId,
    getPreorderMessages: getPreorderMessages,
    getDefaultColorwayId: getDefaultColorwayId,
    getSizeModelImages: getSizeModelImages,
    getLastTokenInURLPath: getLastTokenInURLPath,
    isSizeModelImageFrontFacing: isSizeModelImageFrontFacing,
    isSizeModelImageRearFacing: isSizeModelImageRearFacing,
    isImageFrontFacing: isImageFrontFacing,
    isImageRearFacing: isImageRearFacing,
    countOccurrences: countOccurrences,
    getAttributeValuesFromName: getAttributeValuesFromName,
    getColorwayPrimary: getColorwayPrimary,
    getIcons: getIcons,
    isDefaultColorwayId: isDefaultColorwayId,
    getReleaseDate: getReleaseDate,
    isSearchableIfUnavailable: isSearchableIfUnavailable,
    hasValidPrice: hasValidPrice
};
