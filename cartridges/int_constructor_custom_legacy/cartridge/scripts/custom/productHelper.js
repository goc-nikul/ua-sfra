/* eslint-disable no-param-reassign */
/* eslint-disable no-else-return */
/* eslint-disable no-lonely-if */

var Site = require('dw/system/Site');
var promotionMgr = require('dw/campaign/PromotionMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');

/**
 * Parses one attribute value.
 * @param {*} value The value.
 * @returns {*} The parsed value.
 */
function parseAttributeValue(value) {
    /**
     * If for some reason the value is falsy, we'll return null
     * to avoid breaking in the next checks.
     */
    if (!value) {
        return null;
    }

    /**
     * For markup text values, we'll want to extract the text content.
     */
    if (value.constructor.name === 'dw.content.MarkupText') {
        return value.markup;
    }

    /**
     * For enumerators, we just want to extract the value.
     */
    if (value.constructor.name === 'dw.value.EnumValue') {
        return value.value;
    }

    /**
     * Some custom values can be native string arrays in Java.
     * If so, the value will look like this upon inspecting: `"Ljava.lang.String;@3023900b`.
     * In those cases, we want to loop over the values to extract them.
     */
    if (value.constructor.name === 'Array') {
        var result = [];

        for (var i = 0; i < value.length; i += 1) {
            var innerValue = parseAttributeValue(value[i]);
            result.push(innerValue);
        }

        return result;
    }

    /**
     * Otherwise, we'll assume that the value is a normal string and we can
     * simply use its value or `null` in case it's falsy.
     */
    return value || null;
}

/**
 * Returns an attribute value for a given product.
 * @param {dw.catalog.Product} product The product.
 * @param {*} attributeID The attribute id.
 * @returns {*} The attribute value.
 */
function getAttributeValue(product, attributeID) {
    var value = product.custom[attributeID];

    return parseAttributeValue(value);
}

/**
 * Returns the matching variation group for a given product.
 * @param {dw.catalog.Product} product The product.
 * @returns {*} The variation group.
 */
function getVariationGroupOrNull(product) {
    if (!product.variationModel) {
        return null;
    }

    var variationGroups = product.variationModel.variationGroups.toArray();

    /**
     * Sometimes, when we're getting the variation group for a variant using
     * the `variationModel` prop, it'll give us the wrong matches for the
     * variation group.
     *
     * For example, if we have a product with the following variation groups:
     * - Color: Red
     * - Color: Blue
     *
     * And we're getting the variation group for a variant with the color "Red",
     * it'll return an array with both values, but "Blue" will be the first one.
     *
     * To fix this, we'll filter the variation groups by the color of the product
     * and return the first match. If there's no match, we'll return the first
     * variation group found in the variation model.
     */
    var sameColorVariationGroup = variationGroups.filter(function filter(variationGroup) {
        return variationGroup.custom.color === product.custom.color;
    })[0];

    return sameColorVariationGroup || variationGroups[0] || null;
}

/**
 * Returns inventory amount for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {number} The inventory amount
 */
function getInventoryAmount(product) {
    if (!empty(product)) {
        // if exclusive = out-of-stock, return 0
        if ('exclusive' in product.custom && !empty(product.custom.exclusive)) {
            if (product.custom.exclusive.value === 'out-of-stock') {
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

/**
 * Returns customer group pricing for the specified product and promos.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.util.Collection} productPromotions The promos for this product.
 * @param {boolean} changeKeys Use fancy keys in the return pricing object.
 * @returns {Array} The customer group pricing.
 */
function getCustomerGroupPricing(product, productPromotions, changeKeys) {
    var pricing = [];

    if (!empty(productPromotions) && productPromotions.length) {
        var promos = productPromotions.toArray();

        // get promotion pricing for the passed product
        promos.forEach(function (promo) { // eslint-disable-line array-callback-return
            // only use promos not based on coupons
            if (!promo.basedOnCoupons) {
                var promoPrice = promo.getPromotionalPrice(product);
                // verify the promo is applicable
                if (!empty(promoPrice) && promoPrice.isAvailable() && !empty(promo.customerGroups) && promo.customerGroups.length) {
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

/**
 * Returns display values for the specified product and attribute.
 * @param {dw.catalog.Product} product The product.
 * @param {string} attributeName The attribute name.
 * @returns {Array} The color display values.
 */
function getDisplayValues(product, attributeName) {
    var displayValues = [];

    // get product attribute and values
    var attribute = product.variationModel.getProductVariationAttribute(attributeName);
    if (!empty(attribute)) {
        var attributeValues = product.variationModel.getAllValues(attribute);

        if (!empty(attributeValues) && attributeValues.length) {
            attributeValues = attributeValues.toArray();

            // get display value for each attribute value
            attributeValues.forEach(function (value) {
                displayValues.push(value.displayValue);
            });
        }
    }

    return displayValues;
}

/**
 * Builds a map of variant inventory quantities by size(S, M, L, XL, etc).
 * @param {dw.catalog.Product} product The product.
 * @param {Map} sizeMap The list of inventory by size.
 * @returns {Map} The color display values.
 */
function buildInventorySizeMap(product, sizeMap) {
    // get size attribute for the passed product
    var sizeAttribute = product.variationModel.getProductVariationAttribute('size');
    if (!empty(sizeAttribute)) {
        // get size value for the passed product
        var sizeValue = product.variationModel.getVariationValue(product, sizeAttribute);
        if (!empty(sizeValue)) {
            // get inventory quantity for the passed product
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

/**
 * Builds a map for promo pricing by customer group for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @param {Array} variantPrices The list of promo prices by customer group.
 * @returns {Object} The customer group pricing.
 */
function buildCustomerGroupPromoPriceMap(product, variantPrices) {
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

/**
 * Formats the customer group promo pricing list.
 * @param {Array} originalPrices The raw list of promo prices by customer group.
 * @returns {Object} The formatted group pricing list.
 */
function formatGroupPromoPricing(originalPrices) {
    var prices = {};

    if (!empty(originalPrices) && originalPrices.length) {
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

/**
 * Returns data for online variants.
 * @param {dw.catalog.Product} product The product.
 * @param {Object} data Supplemental product data.
 * @returns {Object|string} The variation data.
 */
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
    if (!empty(colors) && colors.length) {
        variantData.colors = colors.join(',');
    }

    // list of variant sizes(S, M, L, XL, etc)
    sizes = getDisplayValues(product, 'size');
    if (!empty(sizes) && sizes.length) {
        variantData.sizes = sizes.join(',');
    }

    // get variant data NOT from shared variation attributes
    var skus = [];
    var upcs = [];
    var sizeMap = new Map();
    var variants = product.getVariants();
    var variantPrices = [];

    if (!empty(variants) && variants.length) {
        variants = variants.toArray();

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
    }

    // list of variant skus
    if (!empty(skus) && skus.length) {
        variantData.skus = JSON.stringify(skus);
    }

    // list of variant upcs(product ids)
    if (!empty(upcs) && upcs.length) {
        variantData.upcs = JSON.stringify(upcs);
    }

    // list of inventory quantities for each variant
    if (!empty(sizeMap) && sizeMap.size > 0) {
        var sizeArray = Array.from(sizeMap.values());
        variantData.qtys = sizeArray.join(',');
    }

    // list of min/max prices for each variant by customer group(if they have at least one active promo)
    if (data.promoPricingEnabled && !empty(variantPrices) && variantPrices.length) {
        variantData.customerGroupPricing = JSON.stringify(formatGroupPromoPricing(Array.from(variantPrices)));
    }

    return variantData;
}

/**
 * Determines if a product is an e-gift card.
 * @param {dw.catalog.Product} product The product.
 * @returns {boolean} true if product is an e-gift card. false if not.
 */
function isEGiftCard(product) {
    return 'giftCard' in product.custom && !empty(product.custom.giftCard) && product.custom.giftCard.value === 'EGIFT_CARD';
}

/**
 * Returns the lowest price for a product in the specified price book.
 * @param {dw.catalog.Product} product The product.
 * @param {string} priceBookID price book id.
 * @returns {number|null} The price.
 */
function getMinPrice(product, priceBookID) {
    // Return set minimum if product is an e-gift card
    if (isEGiftCard(product)) {
        return Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin');
    }

    var priceModel = product.priceModel;
    var price = priceModel.getMinPriceBookPrice(priceBookID).value;
    if (empty(price)) {
        price = priceModel.getPrice().value;
    }

    return price;
}

/**
 * Returns the highest price for a product in the specified price book.
 * @param {dw.catalog.Product} product The product.
 * @param {string} priceBookID price book id.
 * @returns {number|null} The price.
 */
function getMaxPrice(product, priceBookID) {
    // Return set maximum if product is an e-gift card
    if (isEGiftCard(product)) {
        return Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMax');
    }

    var priceModel = product.priceModel;
    var price = priceModel.getMaxPriceBookPrice(priceBookID).value;
    if (empty(price)) {
        price = priceModel.getPrice().value;
    }

    return price;
}

/**
 * Checks if a product has a valid price greater than 0. If the product is an e-gift card, it checks against
 * the minimum e-gift card amount. For other products, it verifies the standard price is greater than 0.
 *
 * @param {dw.catalog.Product} product The product to check the price for.
 * @param {string} listPriceBookID list pricebook id.
 * @param {string} salePriceBookID sale pricebook id.
 * @returns {boolean} true if the product has a valid price greater than 0, false otherwise.
 */
function hasValidPrice(product, listPriceBookID, salePriceBookID) {
    // Return set minimum if product is an e-gift card
    if (isEGiftCard(product)) {
        return Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin') > 0;
    }

    var listPrice = product.priceModel.getPriceBookPrice(listPriceBookID).value;
    var salePrice = product.priceModel.getPriceBookPrice(salePriceBookID).value;

    return !empty(listPrice) && listPrice > 0 && !empty(salePrice) && salePrice > 0;
}

/**
 * Returns the currency code for the product and price model.
 * @param {dw.catalog.ProductPriceModel} priceModel price model.
 * @returns {string} The currency code.
 */
function getPriceCurrency(priceModel) {
    var currencyCode = '';
    if (priceModel.isPriceRange()) {
        currencyCode = priceModel.getMaxPrice().getCurrencyCode();
    } else {
        currencyCode = priceModel.getPrice().getCurrencyCode();
    }
    if (currencyCode === 'N/A' && !priceModel.getPrice().available) {
        currencyCode = priceModel.getMaxPrice().getCurrencyCode();
    }

    return currencyCode;
}

/**
 * Returns classification category of a product if the classification category
 * is from current storefront catalog.
 * @param {dw.catalog.Product} product Product instance to get category from
 * @returns {(dw.catalog.Category|null)} classification category of the product
 */
function getClassificationCategory(product) {
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

/**
 * Returns category of a product from current storefront catalog.
 * @param {dw.catalog.Product} product Product instance to get category from
 * @param {dw.catalog.Category|null} primaryCategory category
 * @returns {(dw.catalog.Category|null)} Category of the product
 */
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

/**
 * Returns the path for the specified category.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.catalog.Category} primaryCategory category.
 * @returns {string} The category path.
 */
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

/**
 * Returns the color for the specified product variant.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.catalog.ProductVariationAttribute} colorAttr color attributes for this product.
 * @returns {string} color attribute display value.
 */
function getColorValue(product, colorAttr) {
    if (product.master) {
        return '';
    }

    var color = product.custom.color;

    if (!empty(color) && !empty(colorAttr)) {
        var pvv = product.variationModel.getVariationValue(product, colorAttr);
        return !empty(pvv) && 'displayValue' in pvv && pvv.displayValue ? pvv.displayValue : '';
    }

    return '';
}

/**
 * Returns the model image url for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} model image url.
 */
function getOnModelImage(product) {
    var prodImages = product.getImages('onmodelImage');
    var onmodelImageUrl = '';

    if (prodImages.size() > 0) {
        onmodelImageUrl = encodeURI(prodImages[0].httpsURL.toString());
        onmodelImageUrl = onmodelImageUrl.replace(/,/g, '%2C');
    }
    return onmodelImageUrl;
}

/**
 * Returns the default color for the specified product variant.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.catalog.ProductVariationAttribute} colorAttr color attributes for this product.
 * @returns {string} default color attribute display value.
 */
function getDefaultColor(product, colorAttr) {
    if (product.master) {
        return '';
    }

    var defaultColor = '';

    if (!empty(product.custom.color)) {
        var defaultVariant = product.variationModel.getDefaultVariant();
        if (!empty(defaultVariant) && !empty(colorAttr)) {
            var color = product.variationModel.getVariationValue(defaultVariant, colorAttr);
            defaultColor = !empty(color) && 'displayValue' in color && color.displayValue ? color.displayValue : '';
        }
    }

    return defaultColor;
}

/**
 * Returns the care instructions for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the care instructions.
 */
function getFitCare(product) {
    var fitCareDes = 'fitCare' in product.custom ? product.custom.fitCare : null;
    var fitCareResult = '';

    if (fitCareDes) {
        fitCareDes.forEach(function (fitCare) {
            fitCareResult += fitCare + '|';
        });
    }

    fitCareResult = !empty(fitCareResult) && fitCareResult ? fitCareResult.substring(0, fitCareResult.length - 1) : fitCareResult;
    return fitCareResult;
}

/**
 * Returns the primary category id for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the category id.
 */
function getCategoryID(product) {
    var category = product.getPrimaryCategory();
    return !empty(category) ? category.ID : '';
}

/**
 * Returns the video url for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the video url.
 */
function getVideoMaterials(product) {
    var videoURL = '';

    if (!product.master) {
        var videoMaterial = require('*/cartridge/models/product/decorators/videoMaterial');

        var videoModel = {};
        videoMaterial(videoModel, product);
        videoURL = videoModel.video360Material && videoModel.video360Material.length &&
            videoModel.video360Material[0] && videoModel.video360Material[0].video_url_mp4 ?
            videoModel.video360Material[0].video_url_mp4 : '';
    }

    return videoURL;
}

/**
 * Returns the image url for the PLP hover image for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @param {Array} sizeModelImages List of image urls for the specified product.
 * @returns {string} the image url.
 */
function getGridTileHoverImage(product, sizeModelImages) {
    if (!empty(sizeModelImages) && sizeModelImages.length) {
        return sizeModelImages[1].URL.replace(/http:/g, 'https:');
    } else if (empty(sizeModelImages) || !('length' in sizeModelImages) || ('length' in sizeModelImages && sizeModelImages.length === 0)) {
        // if fit models are NOT enabled for this site, get the grid tile hover image
        var images = product.getImages('gridTileDesktop');
        if (!empty(images) && images.length > 1) {
            return images[1].getURL().https().toString();
        }
    }

    return '';
}

/**
 * Returns the active promotions for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string|null} the JSON list of promotions.
 */
function getPromotions(product) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');

    if (!empty(product) && product) {
        // get active promos for the passed product
        var productPromotions = PromotionMgr.getActivePromotions().getProductPromotions(product);

        var promos = [];
        if (!empty(productPromotions) && productPromotions.length) {
            // convert promo collection to array
            productPromotions = productPromotions.toArray();

            for (var i = 0; i < productPromotions.length; i++) {
                if (!productPromotions[i].basedOnCoupons) {
                    var promo = {};

                    // get promo id
                    promo.id = productPromotions[i].ID;

                    // get promo messages
                    if (!empty(productPromotions[i].calloutMsg) && productPromotions[i].calloutMsg) {
                        promo.callOut = productPromotions[i].calloutMsg.source;
                    }
                    if (!empty(productPromotions[i].details) && productPromotions[i].details) {
                        promo.toolTipText = productPromotions[i].details.source;
                    }

                    // get promo dates
                    if (!empty(productPromotions[i].startDate) && productPromotions[i].startDate) {
                        promo.startDate = productPromotions[i].startDate;
                    }
                    if (!empty(productPromotions[i].endDate) && productPromotions[i].endDate) {
                        promo.endDate = productPromotions[i].endDate;
                    }

                    // get promo rank
                    if (!empty(productPromotions[i].rank) && productPromotions[i].rank) {
                        promo.rank = productPromotions[i].rank;
                    }

                    // get customer groups promo applies to
                    var customerGroups = productPromotions[i].getCustomerGroups();
                    if (!empty(customerGroups) && customerGroups.length) {
                        customerGroups = customerGroups.toArray();

                        // initialize promo.customerGroups and fill it with the ids in customerGroups
                        promo.customerGroups = customerGroups.map(function (obj) {
                            return obj.ID;
                        }, []);
                    }

                    promos.push(promo);
                }
            }
        }

        if (!empty(promos) && promos.length) {
            return JSON.stringify(promos);
        }
    }

    return null;
}

/**
 * Returns the count of color chips for the specified product.
 * @param {string} id The product id.
 * @returns {number} the count of color chips.
 */
function getSwatchCount(id) {
    if (!empty(id)) {
        var ProductFactory = require('*/cartridge/scripts/factories/product');

        var params = { pid: id, swatches: true };
        var factoryProduct = ProductFactory.get(params);
        var swatches = !empty(factoryProduct) && 'swatches' in factoryProduct && !empty(factoryProduct.swatches) ? factoryProduct.swatches : '';

        if (!empty(swatches) && 'count' in swatches && !empty(swatches.count)) {
            return swatches.count;
        }
    }

    return 0;
}

/**
 * Returns image data for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {Object|string} the image data.
 */
function getImage(product) {
    let imageData = {};
    imageData.viewType = 'gridTileDesktop';

    // get image
    let image = product.getImage(imageData.viewType);
    if (empty(image) || !image) return null;

    // get image file name
    imageData.url = image.getURL().toString();
    let lastSlash = imageData.url.lastIndexOf('/');
    imageData.fileName = imageData.url.substring(lastSlash + 1, imageData.url.indexOf('?', lastSlash));

    // other image data
    imageData.title = image.getTitle();
    let recipeStart = '?rp=';

    // extract url params
    let urlValues = imageData.url.split('&');

    // get image recipe code
    urlValues.forEach(function (value) {
        let recipeLocation = value.indexOf(recipeStart);
        if (recipeLocation >= 0) {
            let urlParam = value.substring((recipeLocation + recipeStart.length), value.length);
            let pipeLocation = urlParam.indexOf('|');
            imageData.recipe = urlParam.substring(0, pipeLocation);
            return;
        }
    });

    return imageData;
}

/**
 * Returns secondary hex color for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the secondary hex color.
 */
function getSecondaryHexColor(product) {
    if ('secondaryhexcolor' in product.custom && !empty(product.custom.secondaryhexcolor)) {
        return JSON.stringify(product.custom.secondaryhexcolor.replace(/#/g, ''));
    }

    return '';
}

/**
 * Returns primary hex color for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the primary hex color.
 */
function getHexColor(product) {
    if ('hexcolor' in product.custom && !empty(product.custom.hexcolor)) {
        return JSON.stringify(product.custom.hexcolor.replace(/#/g, ''));
    }

    return '';
}

/**
 * Returns whether or not the color chips should be shown.
 * @param {boolean} inStock Whether or not the product is in stock.
 * @returns {boolean} should color chips be shown?
 */
function hideColorWay(inStock) {
    return typeof inStock === 'boolean' ? !inStock : null;
}

/**
 * Returns url for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The product url
 */
function getProductUrl(product) {
    var productUrl;
    if (product.isVariant()) {
        productUrl = dw.web.URLUtils.url('Product-Show', 'pid', product.getMasterProduct().ID).toString();
    } else {
        productUrl = dw.web.URLUtils.url('Product-Show', 'pid', product.ID).toString();
    }

    // remove site and locale data from url
    const siteId = Site.getCurrent().getID();
    const sitePattern = '/s/' + siteId;
    // eslint-disable-next-line no-undef
    const localePattern = '/' + request.locale.toLowerCase().replace('_', '-');
    return productUrl.replace(sitePattern, '').replace(localePattern, '');
}

/**
 * Returns sku for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The product sku
 */
function getProductId(product) {
    if (product.isVariant()) {
        if ('sku' in product.custom && !empty(product.custom.sku)) {
            return product.custom.sku;
        }
    }

    return product.ID;
}

/**
 * Returns exclusivity type for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The exclusivity type in snake case
 */
function getExclusiveType(product) {
    if ('exclusive' in product.custom && !empty(product.custom.exclusive)) {
        return product.custom.exclusive.value.replace(/-/g, '_');
    }

    return '';
}

/**
 * Returns flame icon badge shown in the upper left corner of the image for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The flame icon badge
 */
function getTileUpperLeftFlameIconBadge(product) {
    if ('productTileUpperLeftFlameIconBadge' in product.custom && !empty(product.custom.productTileUpperLeftFlameIconBadge)) {
        return product.custom.productTileUpperLeftFlameIconBadge.toString();
    }

    return '';
}

/**
 * Returns pre-order messages for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {Object|string} The pre-order messages
 */
function getPreorderMessages(product) {
    var preOrderObj = {};
    if ('preOrderPDPMessage' in product.custom && !empty(product.custom.preOrderPDPMessage)) {
        preOrderObj.pdpMessage = product.custom.preOrderPDPMessage;
    }
    if ('preOrderProductTileMessage' in product.custom && !empty(product.custom.preOrderProductTileMessage)) {
        preOrderObj.tileMessage = product.custom.preOrderProductTileMessage;
    }

    // return message
    if (Object.keys(preOrderObj).length) {
        return JSON.stringify(preOrderObj);
    }

    return '';
}

/**
 * Returns color way ID for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} The color way ID
 */
function getColorWayId(product) {
    return 'color' in product.custom && !empty(product.custom.color) ? JSON.stringify({ color: product.custom.color }) : '';
}

/**
 * Returns default color way ID for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string|null} The default color way ID
 */
function getDefaultColorwayId(product) {
    return 'defaultColorway' in product.custom && !empty(product.custom.defaultColorway) ? product.custom.defaultColorway : null;
}

/**
 * Returns size model images for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @param {number} imageCount The number of images to be returned.
 * @returns {Array} The size model images.
 */
function getSizeModelImages(product, imageCount) {
    // get fit model site pref
    var fitModelEnable = 'enableFitModels' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enableFitModels') : false;

    if (!empty(fitModelEnable) && fitModelEnable) {
        var sizeModelImages = [];

        if (!empty(product.custom.size)) {
            // get image view types
            var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
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

/**
 * Returns last part of the url path.
 * @param {string} url The url.
 * @returns {string} The last part of the url path.
 */
function getLastTokenInURLPath(url) {
    const paths = url.split('/');
    var lastTokenAndParamsStr = paths[paths.length - 1];
    var lastTokenAndParamsArr = lastTokenAndParamsStr.split('?');
    return lastTokenAndParamsArr[0];
}

/**
 * Returns if the size model image is front facing.
 * @param {string} url The image url.
 * @returns {boolean} Whether or not the size model image is front facing.
 */
function isSizeModelImageFrontFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_FC') > 0;
}

/**
 * Returns if the size model image is rear facing.
 * @param {string} url The image url.
 * @returns {boolean} Whether or not the size model image is rear facing.
 */
function isSizeModelImageRearFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_BC') > 0;
}

/**
 * Returns if the image is front facing.
 * @param {string} url The image url.
 * @returns {boolean} Whether or not the image is front facing.
 */
function isImageFrontFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_LDF') > 0;
}

/**
 * Returns if the image is rear facing.
 * @param {string} url The image url.
 * @returns {boolean} Whether or not the image is rear facing.
 */
function isImageRearFacing(url) {
    return getLastTokenInURLPath(url).indexOf('_LDB') > 0;
}

/**
 * Returns size model image urls.
 * @param {Object} data The image data.
 * @returns {string} The size model image urls.
 */
function getSizeModelImageURLs(data) {
    if (!empty(data) && 'sizeModelImages' in data && !empty(data.sizeModelImages) && data.sizeModelImages.length) {
        var imageObj = { frontImage: '', backImage: '' };
        var secondaryImageObj = {};
        var hasFront = false;
        var hasBack = false;

        for (var i = 0; i < data.sizeModelImages.length; ++i) {
            if (!hasFront || !hasBack) {
                var startIndex = data.sizeModelImages[i].URL.lastIndexOf('/') + 1;
                var endIndex = data.sizeModelImages[i].URL.indexOf('?', startIndex);
                var fileName = data.sizeModelImages[i].URL.substring(startIndex, endIndex);

                // if front-facing image for the size model, get the url
                if (!hasFront && isSizeModelImageFrontFacing(data.sizeModelImages[i].URL)) {
                    imageObj.frontImage = fileName;
                    hasFront = true;
                }

                // if rear-facing image for the size model, get the url
                if (!hasBack && isSizeModelImageRearFacing(data.sizeModelImages[i].URL)) {
                    imageObj.backImage = fileName;
                    hasBack = true;
                }

                // if front-facing image, get the url just in case we don't have the size model images
                if (!hasFront && isImageFrontFacing(data.sizeModelImages[i].URL)) {
                    secondaryImageObj.frontImage = fileName;
                    hasFront = true;
                }

                // if rear-facing image, get the url just in case we don't have the size model images
                if (!hasBack && isImageRearFacing(data.sizeModelImages[i].URL)) {
                    secondaryImageObj.backImage = fileName;
                    hasBack = true;
                }
            } else {
                break;
            }
        }

        // if no front and/or rear image available of the size model, get the front and/or rear image of the product
        if (empty(imageObj.frontImage) && 'frontImage' in secondaryImageObj) {
            imageObj.frontImage = secondaryImageObj.frontImage;
        }

        if (empty(imageObj.backImage) && 'backImage' in secondaryImageObj) {
            imageObj.backImage = secondaryImageObj.backImage;
        }

        // if image list is not empty, stringify and return it
        if (Object.keys(imageObj).length) {
            return JSON.stringify(imageObj);
        }
    }

    return '';
}

/**
 * Dynamically gets the value, display value or both of
 * the passed attribute name. Assumes the attribute param
 * is the custom object of a record from the ConstructorIOFeedData
 * custom object.
 *
 * @param {*} product The product.
 * @param {string} attributeID The product attribute
 * @returns {Object|null} The attribute value/display value
 */
function getAttributeValuesFromName(product, attributeID) {
    var attributeValue = null;

    if (!empty(product) && product && !empty(attributeID) && attributeID) {
        var attributes = attributeID.split('.');
        if (attributes.length === 1) {
            attributeValue = !empty(product[attributes[0]]) ? product[attributes[0]] : null;
        } else if (attributes.length === 2) {
            attributeValue = !empty(product[attributes[0]]) && !empty(product[attributes[0]][attributes[1]]) ? product[attributes[0]][attributes[1]] : null;
        } else if (attributes.length === 3) {
            attributeValue = !empty(product[attributes[0]]) && !empty(product[attributes[0]][attributes[1]]) && !empty(product[attributes[0]][attributes[1]][attributes[2]]) ? product[attributes[0]][attributes[1]][attributes[2]] : null;
        }
    }

    return attributeValue;
}

/**
 * Returns whether or not a product is assigned to a gifts
 * category in the site catalog.
 *
 * @param {*} product The product.
 * @param {Array} giftsCategories The list of gifts categories.
 * @returns {boolean} Whether or not a product is assigned to a gifts category
 */
function inGiftsCategory(product, giftsCategories) {
    // since only master products can be assigned to categories,
    // get the master product if a variant was passed
    if (product.isVariant()) {
        product = product.getMasterProduct();
    }

    if (!empty(product.onlineCategories) && product.onlineCategories.length) {
        var productCategories = product.onlineCategories.toArray();

        for (var category of giftsCategories) {
            // if the category contains the gift by price search refinement, return true
            if (productCategories.find(item => (item.ID === category))) { // eslint-disable-line no-loop-func
                return true;
            }
        }
    }

    return false;
}

/**
 * Returns the first color in the colorway string
 *
 * @param {string} colorway The product colorway.
 * @returns {string} The first color in the colorway string.
 */
function getColorwayPrimary(colorway) {
    if (!empty(colorway) && colorway.indexOf(' / ') > 0) {
        return colorway.split(' / ')[0];
    }

    return colorway;
}

/**
 * Returns the list of product icons
 *
 * @param {*} product The product.
 * @returns {Object} the list of product icons
 */
function getIcons(product) {
    if (!empty(product) && !empty(product.custom)) {
        var icons = product.custom.icons;

        // copy display values to a separate array and return them
        return !empty(icons) && icons.length ? icons.map(obj => (obj.displayValue)) : null;
    }

    return null;
}

/**
 * Returns whether or not the colorway id for the passed variant product matches the default colorway id on the master product.
 * @param {dw.catalog.Product} product The product.
 * @returns {boolean} whether or not the colorway ids match.
 */
function isDefaultColorwayId(product) {
    if (!empty(product) && product.isVariant()) {
        // get default colorway id of master product
        var defaultMasterColorway = getDefaultColorwayId(product.masterProduct);

        // compare default colorway id of master product to passed variant
        return defaultMasterColorway === product.custom.color;
    }

    return false;
}

/**
 * Returns the number padded with a 0 if number < 10
 *
 * @param {*} number The number.
 * @returns {Object} the padded number
 */
function pad(number) {
    return number < 10 ? '0' + number : number;
}

/**
 * Returns the date/time product is to be released(displayed) on the front-end clients
 *
 * @param {*} product The product.
 * @returns {Object} the release date/time
 */
function getReleaseDate(product) {
    if (!empty(product) && 'releaseDate' in product.custom && !empty(product.custom.releaseDate)) {
        // convert UTC date/time to local server date/time
        var releaseDate = new Date();
        var offset = dw.system.Site.getCurrent().timezoneOffset;
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

/**
 * Checks if the product should be searchable even if unavailable based on a custom flag.
 * @param {*} product The product to check.
 * @returns {boolean} True if the product should be online and searchable even if unavailable; otherwise, false.
 */
function isSearchableIfUnavailable(product) {
    return product && product.searchableIfUnavailableFlag;
}

/**
 * @param {number} data The product discount data.
 * @returns {string} The parsed description, or null if not found.
 */
function setDiscountPercentageRange(data) {
    const discountRange = [
        { rstart: 1, rend: 20, label: 20 },
        { rstart: 21, rend: 30, label: 30 },
        { rstart: 31, rend: 40, label: 40 },
        { rstart: 41, rend: 50, label: 50 },
        { rstart: 51, rend: 60, label: 51 }
    ];

    const matchedRange = discountRange.find((range) => {
        return data >= range.rstart && data <= range.rend;
    });

    return matchedRange ? matchedRange.label : null;
}

/**
 * Checks if is not in OOS and have apply any promtion or price level discount.
 * @param {*} product The product to check.
 * @returns {Object|null}  discount percantage number otherwise, null.
 */
function getDiscountPercentage(product) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var priceFactory = require('*/cartridge/scripts/factories/price');

    if (product.isMaster()) return null;

    if (!product.availabilityModel.orderable && !product.availabilityModel.inStock) {
        return null;
    }

    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(product);
    var priceObj = priceFactory.getPrice(product, null, true, promotions, null);
    if (!priceObj || !priceObj.list || !priceObj.sales || !priceObj.list.value || !priceObj.sales.value) {
        return null;
    }

    var amountDiff = priceObj.list.value - priceObj.sales.value;
    var discountPercentage = Number(Math.floor((amountDiff / priceObj.list.value) * 100)).toFixed(0);

    return Number(setDiscountPercentageRange(discountPercentage)).toFixed(0);
}

module.exports = {
    getAttributeValue: getAttributeValue,
    getVariationGroupOrNull: getVariationGroupOrNull,
    getCategoryPath: getCategoryPath,
    getMinPrice: getMinPrice,
    getMaxPrice: getMaxPrice,
    hasValidPrice: hasValidPrice,
    getColorValue: getColorValue,
    getOnModelImage: getOnModelImage,
    getDefaultColor: getDefaultColor,
    getFitCare: getFitCare,
    getCategoryID: getCategoryID,
    getVariantData: getVariantData,
    getVideoMaterials: getVideoMaterials,
    getPriceCurrency: getPriceCurrency,
    getGridTileHoverImage: getGridTileHoverImage,
    getPromotions: getPromotions,
    getSwatchCount: getSwatchCount,
    getImage: getImage,
    getSecondaryHexColor: getSecondaryHexColor,
    getHexColor: getHexColor,
    hideColorWay: hideColorWay,
    getProductUrl: getProductUrl,
    getProductId: getProductId,
    getExclusiveType: getExclusiveType,
    getTileUpperLeftFlameIconBadge: getTileUpperLeftFlameIconBadge,
    getPreorderMessages: getPreorderMessages,
    getInventoryAmount: getInventoryAmount,
    getColorWayId: getColorWayId,
    getDefaultColorwayId: getDefaultColorwayId,
    getSizeModelImages: getSizeModelImages,
    getSizeModelImageURLs: getSizeModelImageURLs,
    getCustomerGroupPricing: getCustomerGroupPricing,
    getAttributeValuesFromName: getAttributeValuesFromName,
    inGiftsCategory: inGiftsCategory,
    getColorwayPrimary: getColorwayPrimary,
    getProductCategory: getProductCategory,
    getIcons: getIcons,
    isDefaultColorwayId: isDefaultColorwayId,
    getReleaseDate: getReleaseDate,
    isSearchableIfUnavailable: isSearchableIfUnavailable,
    getDiscountPercentage: getDiscountPercentage,
    setDiscountPercentageRange: setDiscountPercentageRange
};
