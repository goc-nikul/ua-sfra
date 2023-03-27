'use strict'; /* eslint-disable prefer-const */

var collections = require('*/cartridge/scripts/util/collections');
var base = require('app_storefront_base/cartridge/scripts/helpers/productHelpers');

/**
 * @typedef SelectedOption
 * @type Object
 * @property {string} optionId - Product option ID
 * @property {string} productId - Product ID
 * @property {string} selectedValueId - Selected product option value ID
 */

/**
 * Provides a current option model by setting selected option values
 *
 * @param {dw.catalog.ProductOptionModel} optionModel - Product's option model
 * @param {SelectedOption[]} selectedOptions - Options selected in UI
 * @return {dw.catalog.ProductOptionModel} - Option model updated with selected options
 */
function getCurrentOptionModel(optionModel, selectedOptions) {
    var productOptions = optionModel.options;
    var selectedValue;
    var selectedValueId;

    if (selectedOptions && selectedOptions.length) {
        collections.forEach(productOptions, function (option) {
            selectedValueId = selectedOptions.filter(function (selectedOption) {
                return selectedOption.optionId === option.ID;
            })[0].selectedValueId;
            selectedValue = optionModel.getOptionValue(option, selectedValueId);
            optionModel.setSelectedOptionValue(option, selectedValue);
        });
    }

    return optionModel;
}

/**
 * Identify if MFO item
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @return {boolean} - If item is MFO
 */
function isMFOItem(product) {
    let Logger = require('dw/system/Logger');
    try {
        if (empty(product)) return false;

        let Site = require('dw/system/Site');
        let hideMFOItems = ('hideMFOItems' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hideMFOItems') == true; //eslint-disable-line
        let MFOItem = product.variant ? product.variationModel.master.custom.isMFOItem : product.custom.isMFOItem;
        return hideMFOItems && MFOItem;
    } catch (e) {
        Logger.error('productHelpers.js::isMFOItem() ' + e.message);
        return false;
    }
}

/**
 * Return type of the current product
 * @param  {dw.catalog.ProductVariationModel} product - Current product
 * @return {string} type of the current product
 */
function getProductType(product) {
    var result;
    if (product.master) {
        result = 'master';
    } else if (product.variant) {
        result = 'variant';
    } else if (product.variationGroup) {
        result = 'variationGroup';
    } else if (product.productSet) {
        result = 'set';
    } else if (product.bundle) {
        result = 'bundle';
    } else if (product.optionProduct) {
        result = 'optionProduct';
    } else {
        result = 'standard';
    }
    return result;
}

/**
 * Normalize product and return Product variation model
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @param  {Object} productVariables - variables passed in the query string to
 *                                     target product variation group
 * @return {dw.catalog.ProductVarationModel} Normalized variation model
 */
function getVariationModel(product, productVariables) {
    var variationModel = product.variationModel;
    if (!variationModel.master && !variationModel.selectedVariant) {
        variationModel = null;
    } else if (productVariables) {
        var variationAttrs = variationModel.productVariationAttributes;
        Object.keys(productVariables).forEach(function (attr) {
            if (attr && productVariables[attr].value) {
                var dwAttr = collections.find(variationAttrs,
                    function (item) { return item.ID === attr; });
                var dwAttrValue = collections.find(variationModel.getAllValues(dwAttr),
                    function (item) { return item.value === productVariables[attr].value; });
                if (dwAttr && dwAttrValue) {
                    variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                }
            }
        });
    }
    return variationModel;
}

/**
 * If a product is master and only have one variant for a given attribute - auto select it
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Object with selected parameters
 */
function normalizeSelectedAttributes(apiProduct, params) {
    if (!apiProduct.master && params.variables) {
        return params.variables;
    }

    var variables = params.variables || {};
    var productVariationAttributes = [];
    if (apiProduct.variationModel) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function (attribute) {
            var allValues = apiProduct.variationModel.getAllValues(attribute);
            productVariationAttributes.push(attribute.ID);
            if (allValues.length === 1 && attribute.ID === 'color' && variables[attribute.ID] !== undefined) {
                variables[attribute.ID] = {
                    id: apiProduct.ID,
                    value: allValues.get(0).ID
                };
            }
        });
        if (productVariationAttributes.length === 3 && (Object.keys(variables).length === 0 || Object.keys(variables).length >= 1)) {
            for (var i = 0; i < productVariationAttributes.length; i++) {
                var attr;
                if (params.variantColor && productVariationAttributes[i] === 'color') {
                    attr = params.variantColor;
                } else if (params.variantColor && productVariationAttributes[i] === 'length') {
                    attr = params.variantLength;
                }
                if (attr) {
                    variables[productVariationAttributes[i]] = {
                        id: apiProduct.ID,
                        value: attr
                    };
                }
            }
        }
    }

    return Object.keys(variables) ? variables : null;
}

/**
 * Get information for model creation
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Config object
 */
function getConfig(apiProduct, params) {
    var variables = normalizeSelectedAttributes(apiProduct, params);
    var variationModel = getVariationModel(apiProduct, variables);
    if (variationModel) {
        apiProduct = variationModel.selectedVariant || apiProduct; // eslint-disable-line
    }
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var optionsModel = getCurrentOptionModel(apiProduct.optionModel, params.options);
    var colorAttrSelection = {};
    colorAttrSelection.colorway = 'colorway' in params && params.colorway ? params.colorway : '';
    colorAttrSelection.color = 'variantColor' in params && params.variantColor ? params.variantColor : '';

    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: variables,
        apiProduct: apiProduct,
        productType: getProductType(apiProduct),
        colorAttrSelection: colorAttrSelection
    };

    return options;
}

/**
 * Function to set inventory record based on MAO Availability response.
 * @param {Object} MAOData - MAO Availability Response Object
 * @param {dw.catalog.Product} variantProduct - Variant Product Object
 * @returns {void}
 */
function setInventoryRecord(MAOData, variantProduct) {
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    let inventoryRecord = variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord ? variantProduct.availabilityModel.inventoryRecord : null;
    if (MAOData) {
        let MAOStockLevel = MAOData.TotalQuantity;
        let MAOOnHandQuantity = MAOData.OnHandQuantity;
        if (!MAOData.LocationId) {
            if (!empty(inventoryRecord) && inventoryRecord.getATS().getValue() !== MAOStockLevel) {
                Transaction.wrap(function () {
                    MAOStockLevel = typeof MAOOnHandQuantity !== undefined && !empty(MAOOnHandQuantity) && !isNaN(MAOOnHandQuantity) ? MAOOnHandQuantity : MAOStockLevel;
                    inventoryRecord.setAllocation(MAOStockLevel);
                    if (typeof MAOData.FutureQuantity !== undefined && !empty(MAOData.FutureQuantity) && !isNaN(MAOData.FutureQuantity)) {
                        if (MAOData.NextAvailabilityDate && !empty(MAOData.NextAvailabilityDate)) {
                            let inStockDate = new Date(MAOData.NextAvailabilityDate);
                            if (inStockDate.toString() !== 'Invalid Date') {
                                if (inStockDate > inventoryRecord.getInStockDate()) {
                                    inventoryRecord.setInStockDate(inStockDate);
                                }

                                let setOfPreOrderProducts = Site.current.getCustomPreferenceValue('preOrderStyles');
                                if (((setOfPreOrderProducts.indexOf(variantProduct.ID) > -1) || (setOfPreOrderProducts.indexOf(variantProduct.masterProduct ? variantProduct.masterProduct.ID : variantProduct.ID) > -1)) && variantProduct.custom && variantProduct.custom.isPreOrder && inventoryRecord.getInStockDate() > new Date()) {
                                    inventoryRecord.setPreorderable(true);
                                }
                            }
                        }
                        inventoryRecord.setPreorderBackorderAllocation(MAOData.FutureQuantity);
                    }
                });
            }
        }
    }
}

/**
 * Renders the Product Tiles at Gift Box section
 * @returns {Object} contain information needed to render the product page
 */
function showGiftBoxes() {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var categoryID = Site.getCurrent().getCustomPreferenceValue('giftBoxCategoryID') ? Site.getCurrent().getCustomPreferenceValue('giftBoxCategoryID') : 'gift-boxes';
    var productSearchModel = new ProductSearchModel();
    productSearchModel.setCategoryID(categoryID);
    productSearchModel.search();
    var productSearchHits = productSearchModel.getProductSearchHits().asList();
    var productIDs = [];
    if (!empty(productSearchHits)) {
        var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var currentBasket = BasketMgr.getCurrentBasket();
        var productLineItems = currentBasket ? currentBasket.allProductLineItems : null;
        var childProducts = null;
        var options = [];

        var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
        var maoAvailability = null;
        if (realTimeInventoryCallEnabled) {
            const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
            var isCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled('GiftOptions');
            if (isCheckPointEnabled) {
                var items = AvailabilityHelper.getGiftBoxSKUS(productSearchHits);
                if (!empty(items)) {
                    var Availability = require('int_mao/cartridge/scripts/availability/MAOAvailability');
                    maoAvailability = Availability.getMaoAvailability(items);
                }
            }
        }
        collections.forEach(productSearchHits, function (productSearchHit) {
            var product = productSearchHit.getProduct();
            var variantProduct = product.isMaster() ? product.getVariationModel().getDefaultVariant() : product;
            if (empty(variantProduct) || !(variantProduct.availabilityModel.orderable)) {
                variantProduct = productHelper.getOrderableVariant(product);
            }
            if (variantProduct) {
                var prodInfo = {};
                prodInfo.id = variantProduct.ID;
                if (realTimeInventoryCallEnabled && maoAvailability && variantProduct.custom && 'sku' in variantProduct.custom && variantProduct.custom.sku && maoAvailability[variantProduct.custom.sku]) {
                    try {
                        let MAOData = JSON.parse(maoAvailability[variantProduct.custom.sku]);
                        prodInfo.outOfStock = MAOData.Status === 'OUT_OF_STOCK';
                        setInventoryRecord(MAOData, variantProduct);
                    } catch (e) {
                        let Logger = require('dw/system/Logger');
                        Logger.error('Error while setting the inventory record :: ', e.message);
                    }
                } else {
                    prodInfo.outOfStock = variantProduct.availabilityModel && variantProduct.availabilityModel.inventoryRecord && variantProduct.availabilityModel.inventoryRecord.ATS.value > 0 ? false : true; // eslint-disable-line
                }
                if (productLineItems && cartHelper.getExistingProductLineItemInCart(variantProduct, variantProduct.ID, productLineItems, childProducts, options)) {
                    prodInfo.inBasket = true;
                } else {
                    prodInfo.inBasket = false;
                }
                productIDs.push(prodInfo);
            }
        });
    }

    return productIDs;
}

/**
 * Filters the color product swatches
 * @param {Object} sourceValues - original object for color variationattributes
 * @param {Object} product - Product model
 * @param {string} experienceType - type of product experience outlet|premium|null
 * @returns {Object} filtered object for color variationAttributes
 */
function filterColorSwatches(sourceValues, product, experienceType) {
    let retObj = [];
    let outletColors = product.raw.custom.outletColors;
    // Nothing to use for filter, return source (all) colors
    if (empty(outletColors)) return sourceValues;

    /* eslint-disable no-continue */
    for (let i = 0; i < sourceValues.length; i++) {
        let valueObj = sourceValues[i];
        if (experienceType === 'premium' && outletColors && outletColors.indexOf(valueObj.id) > -1) continue; // Premium experience enabled, skip outlet item
        else if (experienceType === 'outlet' && outletColors && outletColors.indexOf(valueObj.id) === -1) continue; // Outlet experience enabled, skip premium item
        else retObj.push(valueObj);
    }
    /* eslint-enable no-continue */
    return retObj;
}

/**
 * Reformats colorway names string.
 * @param {string} inputValue - string
 * @returns {string} String for color Names
 */
function fixProductColorNames(inputValue) {
    let retString = '';
    let colorBuckets = inputValue.split('/').map(function (item) {
        return item.trim();
    });
    if (colorBuckets.length > 1) {
        retString += colorBuckets[0];
        if (colorBuckets[1] !== '' && colorBuckets[0] !== colorBuckets[1]) {
            retString += ' / ' + colorBuckets[1];
        } else if (colorBuckets[2] && colorBuckets[2] !== '' && colorBuckets[2] !== colorBuckets[1]) {
            retString += ' / ' + colorBuckets[2];
        }
    }
    return retString;
}

/**
 * Creates the breadcrumbs object
 * @param {string} cgid - category ID from navigation and search
 * @param {string} pid - product ID
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {Array} an array of breadcrumb objects
 */
function getAllBreadcrumbs(cgid, pid, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var category;
    var product;
    if (pid) {
        product = ProductMgr.getProduct(pid);
        category = product.variant
            ? product.masterProduct.primaryCategory
            : product.primaryCategory;
    } else if (cgid) {
        category = CatalogMgr.getCategory(cgid);
    }

    if (category) {
        breadcrumbs.push({
            htmlValue: category.displayName,
            url: URLUtils.url('Search-Show', 'cgid', category.ID),
            hide: category.custom.hideFromBreadCrumbs
        });

        if (category.parent && category.parent.ID !== 'root') {
            return getAllBreadcrumbs(category.parent.ID, null, breadcrumbs);
        }
    }

    return breadcrumbs;
}

/**
 * Generates a map of string resources for the template
 *
 * @returns {ProductDetailPageResourceMap} - String resource map
 */
function getResources() {
    var Resource = require('dw/web/Resource');

    return {
        info_selectforstock: Resource.msg('info.selectforstock', 'product',
            'Select Styles for Availability'),
        assistiveSelectedText: Resource.msg('msg.assistive.selected.text', 'common', null)
    };
}

/**
 * Renders the Product Details Page
 * @param {Object} querystring - query string parameters
 * @param {Object} reqPageMetaData - request pageMetaData object
 * @returns {Object} contain information needed to render the product page
 */
function showProductPage(querystring, reqPageMetaData) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    var params = querystring;
    var product = ProductFactory.get(params);
    var mpid = product.custom.masterID;
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var canonicalUrl = URLUtils.http('Product-Show', 'pid', mpid);
    var breadcrumbs = getAllBreadcrumbs(null, product.id, []).reverse();
    var template = 'product/productDetails';

    if (product.productType === 'bundle' && !product.template) {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set' && !product.template) {
        template = 'product/setDetails';
    } else if (product.template) {
        template = product.template;
    }

    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);
    var schemaData = require('*/cartridge/scripts/helpers/structuredDataHelper').getProductSchema(product);

    return {
        template: template,
        product: product,
        addToCartUrl: addToCartUrl,
        resources: getResources(),
        breadcrumbs: breadcrumbs,
        canonicalUrl: canonicalUrl,
        schemaData: schemaData
    };
}

/**
 * Get Product variantion URL
 * @param {string} url - url of variation product
 * @return {string}  updatedUrl - updated url without size parameter
 */
function removeSizeParamFromUrl(url) {
    var regex = /^\b(\w*dwvar_\w*_size=\w*)\b/;
    var urlValues = url.split('&');
    var updatedUrl;
    urlValues.forEach(function (value) {
        if (value.match(regex) === null) {
            updatedUrl = updatedUrl ? updatedUrl + '&' + value : value;
        }
    });
    return updatedUrl;
}

/**
 * Get Product Image URL
 * @param {string} type - type of image
 * @return {string} - Image URL
 */
function getNoImageURL(type) {
    try {
        var Site = require('dw/system/Site');
        var noImageURLs = 'noImageURLs' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('noImageURLs') ? Site.current.getCustomPreferenceValue('noImageURLs') : null;
        var localeImageUrl;
        if (noImageURLs) {
            var parseImageJson = JSON.parse(noImageURLs);
            var Locale = require('dw/util/Locale');
            var currentLocale = Locale.getLocale(request.locale); // eslint-disable-line
            var currentLocaleID = currentLocale ? currentLocale.ID : 'default';
            localeImageUrl = parseImageJson[currentLocaleID] ? parseImageJson[currentLocaleID] : parseImageJson.default;
        }
        var noImageDISConfiguration = 'noImageDISConfiguration' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('noImageDISConfiguration') ? Site.current.getCustomPreferenceValue('noImageDISConfiguration') : null;
        if (noImageDISConfiguration) {
            noImageDISConfiguration = JSON.parse(noImageDISConfiguration);
        }
        var url = noImageDISConfiguration && localeImageUrl && noImageDISConfiguration[type] ? localeImageUrl + '' + noImageDISConfiguration[type] : null;
        return url;
    } catch (e) {
        return null;
    }
}

/**
 * Get Inclusion and Exclusion Promotions for the given product
 * @param {Object} promotions - List of active promotions
 * @param {dw.catalog.Product} product - Product Object
 * @return {Object} contain information needed to render the product page
 */
function getCallOutMessagePromotions(promotions, product) {
    var exclusionPromoList = [];
    var inclusionPromoList = promotions;
    var promotionWithRanks = [];
    var promoWithRanksForExclusion = [];
    var promoWithNoRanksForExclusion = [];
    var exclusionPromotions = [];
    var inclusionPromotions = [];
    var promotionPrice;
    var promoCampaignWithStartDate = [];
    var promoCampaignWithNoStartDate = [];
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var excludedPromoIDs = product.custom.excludedPromoIDs ? product.custom.excludedPromoIDs.split(',') : '';
    if (!empty(excludedPromoIDs) && excludedPromoIDs.length > 0) {
        for (var i = 0; i < excludedPromoIDs.length; i++) {
            var promo = PromotionMgr.getPromotion(excludedPromoIDs[i]);
            if (!empty(promo) && promo.isActive()) {
                promotionPrice = promo.getPromotionalPrice(product);
                if (!promotionPrice.available) {
                    exclusionPromoList.push(promo);
                }
            }
        }
    }
    // segregating inclusionPromoList based on Rank and storing in an Array
    if (!empty(inclusionPromoList) && inclusionPromoList.length > 1) {
        for (var m = 0; m < inclusionPromoList.length; m++) {
            if (!empty(inclusionPromoList[m].rank)) {
                promotionWithRanks.push(inclusionPromoList[m]);
            } else {
                var promotionCampaign = PromotionMgr.getCampaign(inclusionPromoList[m].campaign.id);
                if (!empty(promotionCampaign.startDate)) {
                    promoCampaignWithStartDate.push(inclusionPromoList[m]);
                } else {
                    promoCampaignWithNoStartDate.push(inclusionPromoList[m]);
                }
            }
        }
    }
    // segregating exclusionPromoList based on Rank and storing in an Array
    if (!empty(exclusionPromoList) && exclusionPromoList.length > 1) {
        for (var n = 0; n < exclusionPromoList.length; n++) {
            if (!empty(exclusionPromoList[n].rank)) {
                promoWithRanksForExclusion.push(exclusionPromoList[n]);
            } else {
                promoWithNoRanksForExclusion.push(exclusionPromoList[n]);
            }
        }
    }
    // Sorting promotionWithRanks
    if (!empty(promotionWithRanks) && promotionWithRanks.length > 0) {
        promotionWithRanks.sort(function (first, second) {
            return first.rank - second.rank;
        });
    }
    // Sorting promoWithRanksForExclusion
    if (!empty(promoWithRanksForExclusion) && promoWithRanksForExclusion.length > 0) {
        promoWithRanksForExclusion.sort(function (first, second) {
            return first.rank - second.rank;
        });
    }
    // sorting promotions based on campaign start date
    if (!empty(promoCampaignWithStartDate) && promoCampaignWithStartDate.length > 0) {
        promoCampaignWithStartDate.sort(function (first, second) {
            return PromotionMgr.getCampaign(first.campaign.id).startDate - PromotionMgr.getCampaign(second.campaign.id).startDate;
        });
    }
    if (!empty(inclusionPromoList) && inclusionPromoList.length > 0) {
        if (inclusionPromoList.length === 1) {
            inclusionPromotions.push(inclusionPromoList[0]);
        } else if (inclusionPromoList.length > 1) {
            if (promotionWithRanks.length > 0) {
                inclusionPromotions.push(promotionWithRanks[0]);
            } else if (promoCampaignWithStartDate.length > 0) {
                inclusionPromotions.push(promoCampaignWithStartDate[0]);
            } else if (promoCampaignWithNoStartDate.length > 0) {
                inclusionPromotions.push(promoCampaignWithNoStartDate[0]);
            }
        }
    }
    if (!empty(exclusionPromoList) && exclusionPromoList.length > 0) {
        if (exclusionPromoList.length === 1) {
            exclusionPromotions.push(exclusionPromoList[0]);
        } else if (exclusionPromoList.length > 1) {
            if (promoWithRanksForExclusion.length > 0) {
                exclusionPromotions.push(promoWithRanksForExclusion[0]);
            } else if (promoWithNoRanksForExclusion.length > 0) {
                exclusionPromotions.push(promoWithNoRanksForExclusion[0]);
            }
        }
    }
    return {
        inclusionPromotions: inclusionPromotions,
        exclusionPromotions: exclusionPromotions
    };
}

/**
 * Gets the upsell type
 * @param {Object} sourceValues - original object for color variationattributes
 * @param {Object} product - Product model
 * @param {string} experienceType - type of product experience outlet|premium|null
 * @param {string} page - type of page
 * @returns {string} type of product experience outlet|premium|mixed
 */
function getUpsellType(sourceValues, product, experienceType, page) {
    const attrValues = product.variationAttributes[0].values;
    if (page === 'tealium') {
        const outletColors = product.custom.outletColors;
        var count = 0;
        for (let i = 0; i < sourceValues.length; i++) {
            let valueObj = sourceValues[i];
            if (outletColors && outletColors.indexOf(valueObj.id) > -1) {
                count = count + 1; // eslint-disable-line
            }
        }
        if (count === attrValues.length) {
            return 'outlet';
        } else if (count === 0) {
            return 'premium';
        } else { // eslint-disable-line
            return 'mixed';
        }
    } else { // eslint-disable-line
        const productSwatches = filterColorSwatches(attrValues, product, experienceType);
        if (productSwatches.length === attrValues.length) {
            return experienceType;
        }
    }
    return 'mixed';
}

/**
 * Mapping BM Product Image view type with selected size model
 * @param {string} selectedSizeModel - selected size model
 * @return {string} - imageMapViewType - BM view Type
 */
function sizeModelImagesMapping(selectedSizeModel) {
    var imageMapViewType;
    switch (selectedSizeModel) {
        case 'xs':
            imageMapViewType = 'sizeModelXS';
            break;
        case 'sm':
            imageMapViewType = 'sizeModelSM';
            break;
        case 'md':
            imageMapViewType = 'sizeModelMD';
            break;
        case 'lg':
            imageMapViewType = 'sizeModelLG';
            break;
        case 'xl':
            imageMapViewType = 'sizeModelXL';
            break;
        case 'xxl':
            imageMapViewType = 'sizeModelXXL';
            break;
        default :
            imageMapViewType = null;
            break;
    }
    return imageMapViewType;
}

/**
 * constructing new URL for selected size model
 * @param {string} sizeModelImage - slected size image info
 * @param {number} viewTypeLength - loop count for tile image and tile swatch
 * @returns {Array} Array of sizeModelImages
 */
function addRecipeToSizeModelImage(sizeModelImage, viewTypeLength) {
    const recipeQueryString = '?rp=standard-0pad|gridTileDesktop&scl=1&fmt=jpg&qlt=50&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=512&hei=640&size=512,640';
    var sizeModelImages = [];
    var length = !empty(viewTypeLength) ? viewTypeLength : 2;
    for (var a = 0; a < length; a++) {
        if (!empty(sizeModelImage[a])) {
            sizeModelImages.push({
                alt: sizeModelImage[a].alt,
                URL: sizeModelImage[a].URL + '' + recipeQueryString,
                title: sizeModelImage[a].title,
                absURL: sizeModelImage[a].URL + '' + recipeQueryString,
                viewType: sizeModelImage[a].viewType
            });
        }
    }
    return sizeModelImages;
}

/**
 * Decide the recipe based on image view type of sizeModel image on PDP
 * @param {string} viewType - view Type for sizeModel images
 * @returns {string} return recipe based on viewType
 */
function recipeForPDPSizeModelImage(viewType) {
    var PDPrecipe;
    switch (viewType) {
        case 'pdpMainDesktop':
            PDPrecipe = '?rp=standard-0pad|pdpMainDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=566&hei=708&size=566,708';
            break;
        case 'pdpZoomDesktop':
            PDPrecipe = '?rp=standard-0pad|pdpZoomDesktop&scl=0.72&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=f0f0f0&wid=1836&hei=1950&size=1500,1500';
            break;
        default:
            PDPrecipe = '?rp=standard-0pad|pdpMainDesktop&scl=1&fmt=jpg&qlt=85&resMode=sharp2&cache=on,on&bgc=F0F0F0&wid=566&hei=708&size=566,708';
            break;
    }
    return PDPrecipe;
}

/**
 * fetch JSON values for size Model drop-down from content asset body
 * @returns {Object} return parse size model JSON object
 */
function fetchSizeModelJSON() {
    var ContentMgr = require('dw/content/ContentMgr');
    var sizeModelObject;
    var sizeModelContentAsset = ContentMgr.getContent('size-model');
    var sizeModelContent = sizeModelContentAsset && sizeModelContentAsset.online && !empty(sizeModelContentAsset.custom.body) ? sizeModelContentAsset.custom.body.markup : '';
    if (!empty(sizeModelContent)) {
        sizeModelObject = JSON.parse(sizeModelContent);
    }
    return sizeModelObject;
}

/**
 * Converts an HEX color value to RGB. Conversion formula
 * @param   {number}  hex       The hex color value
 * @return  {Array}           The RGB representation
 */
function hexToRgb(hex) {
    var hexValue = hex;
    hexValue = hexValue.length === 4 ? '#' + hexValue[1] + hexValue[1] + hexValue[2] + hexValue[2] + hexValue[3] + hexValue[3] : hexValue;
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexValue);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Converts an RGB color value to HSL. Conversion formula
 * returns h, s, and l in the set [0, 1].
 * @param   {number}  r       The red color value
 * @param   {number}  g       The green color value
 * @param   {number}  b       The blue color value
 * @return  {Array}           The HSL representation
 */
function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255; // eslint-disable-line
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2; // eslint-disable-line

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { // eslint-disable-line
            case r: h = (g - b) / d + (g < b ? 6 : 0); break; // eslint-disable-line
            case g: h = (b - r) / d + 2; break; // eslint-disable-line
            case b: h = (r - g) / d + 4; break; // eslint-disable-line
        }
        h /= 6;
    }

    return [h, s, l];
}

/**
 * Checks and return the color Lightness values
 * @param   {string}  color       The swatch color value
 * @return  {boolean}           HSL color or False
 */
function getLightnessValue(color) {
    if (color) {
        let RGBColor = hexToRgb(color);
        if (RGBColor) {
            let getHSLColor = rgbToHsl(RGBColor.r, RGBColor.g, RGBColor.b);
            return getHSLColor;
        }
    }
    return false;
}
/**
 * fetch model specification based on selected color
 * @param {dw.catalog.Product} product - product object
 * @return  {Object}     model specification
 */
function getSelectedModelSpecObj(product) {
    var modelSpecObj = {};
    var masterProduct = product instanceof dw.catalog.ProductVariationModel ? product.getMaster() : product;
    if ('shopTheLookDisable' in masterProduct.custom && !masterProduct.custom.shopTheLookDisable) {
        var selectedColorId = null;
        var productVariationModel = product instanceof dw.catalog.ProductVariationModel ? product : product.getVariationModel();
        if (productVariationModel.getProductVariationAttribute('color') && productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color'))) {
            selectedColorId = productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).getID();
        }
        if (!empty(selectedColorId)) {
            var shoptheLookJSON = 'shopTheLookJson' in masterProduct.custom && !empty(masterProduct.custom.shopTheLookJson) ? JSON.parse(masterProduct.custom.shopTheLookJson) : '';
            if (!empty(shoptheLookJSON)) {
                var ColorJSON = shoptheLookJSON[selectedColorId];
                if (!empty(ColorJSON)) {
                    modelSpecObj = ColorJSON;
                }
            }
        }
    }
    return modelSpecObj;
}
/**
 * return specific model specification based on  image file name
 * @param {Object} modelSpec - modelSpec object
 * @param {string} ImageURL - ImageURL
 * @return {Object} ImageModelSpec   -   specific model specification
 */
function getImageSpecificModelSpec(modelSpec, ImageURL) {
    var ImageModelSpec = {};
    if (!empty(ImageURL) && !empty(modelSpec)) {
        var result = ImageURL.split('?')[0]; // Remove query component
        var pathArr = result.split('/');
        var imageFileName = pathArr[pathArr.length - 1];
        if (imageFileName && !empty(modelSpec[imageFileName])) {
            ImageModelSpec = modelSpec[imageFileName];
            if (Object.prototype.hasOwnProperty.call(ImageModelSpec, 'modelHeightFtIn')) {
                var modelHeightFtIn = ImageModelSpec.modelHeightFtIn;
                if (!empty(modelHeightFtIn)) {
                    ImageModelSpec.modelHeightFtIn = Math.floor(modelHeightFtIn / 12) + "'" + (modelHeightFtIn % 12) + '"';
                }
            }
            if (Object.prototype.hasOwnProperty.call(ImageModelSpec, 'modelSize') && ImageModelSpec.modelSize === 'M') {
                ImageModelSpec.modelSize = 'MD';
            }
        }
    }
    return ImageModelSpec;
}

/**
 * Checks and return the color values
 * returns color values .
 * @param   {string} hex       The hex color value
 * @param   {string}  hexII       The hexII color value
 * @return  {Array}           The color values
 */
function changeSwatchBorder(hex, hexII) {
    var resultValues = [];
    let swatchColor = hex;
    let swatchColorII = hexII;
    if (swatchColor && swatchColorII && (swatchColor === swatchColorII)) {
        resultValues.push(getLightnessValue(swatchColor));
    } else if (swatchColor && swatchColorII) {
        resultValues.push(getLightnessValue(swatchColor));
        resultValues.push(getLightnessValue(swatchColorII));
    }
    return resultValues;
}

/**
 * create cookie for privacy policy update banner and return that cookie
 * returns return created cookie.
 * @return  {string}           created cookie
 */
function privacyBannerCookie() {
    var Site = require('dw/system/Site');
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var cookieName = !empty(Site.current.getCustomPreferenceValue('policyBannerCookieName')) ? Site.current.getCustomPreferenceValue('policyBannerCookieName') : '';
    var expirationDays = Site.getCurrent().getCustomPreferenceValue('policyCookieExpirationDays');
    var expirationInSecond = expirationDays * 24 * 60 * 60;
    if (!empty(cookieName) && !empty(expirationDays)) {
        cookieHelper.create(cookieName, expirationDays, expirationInSecond);
    }
    return cookieHelper.read(cookieName);
}
/**
 * Provides selected team filter value on PLP and search result page
 *
 * @param {string} teamfilter   - selected team filter value
 * @param {dw.catalog.Product} product - productsearch product object
 * @return {string} - return selected team filter value only if it matches with variation attribute
 */
function selectTeamFilter(teamfilter, product) {
    var myTeamFilter = '';
    if (!empty(teamfilter)) {
        var variants = product.productSearchHit.getProduct().getVariants();
        if ((variants !== null) || (variants.length > 0)) {
            collections.forEach(variants, function (variant) {
                if (variant.onlineFlag && variant.availabilityModel.orderable && !empty(variant.custom.team)) {
                    var teamValue = variant.custom.team;
                    if (teamValue.includes(teamfilter) || teamfilter.includes(teamValue)) {
                        myTeamFilter = teamValue;
                        return;
                    }
                }
            });
        }
    }
    return myTeamFilter;
}

/**
 * Provides selected team filter value on PLP and search result page
 *
 * @param {dw.catalog.Product} productObj -  product object
 * @param {string} colorId   - selected color id
 * @param {string} size   - selected size id
 * @return {Array} - return material codes based on selected color id for thier master product
 */
function getMaterialCode(productObj, colorId, size) {
    var materialCode;
    if (productObj && !empty(colorId) && !empty(size)) {
        var masterProd = productObj.isVariant() ? productObj.getMasterProduct() : productObj;
        var enableShopThisOutfitProd = 'disableShopthisOutfit' in masterProd.custom ? !masterProd.custom.disableShopthisOutfit : true;
        if (enableShopThisOutfitProd) {
            if (!empty(colorId)) {
                var shopTheLookJsonObj = 'shopTheLookJson' in masterProd.custom && !empty(masterProd.custom.shopTheLookJson) ? JSON.parse(masterProd.custom.shopTheLookJson) : '';
                if (!empty(shopTheLookJsonObj) && Object.keys(shopTheLookJsonObj).length > 0) {
                    var colorJsonObj = shopTheLookJsonObj[colorId];
                    if (!empty(colorJsonObj) && !empty(colorJsonObj.shopTheLookOutfit) && !empty(colorJsonObj.shopTheLookOutfit[size])) {
                        materialCode = colorJsonObj.shopTheLookOutfit[size].materialCodes;
                    }
                }
            }
        }
    }
    return materialCode;
}

/**
 * Provides check at least one model material codes product is available or not for shop this outfit CTA
 *
 * @param {dw.catalog.Product} productObject -  product object
 * @param {Object} images -  product images object
 * @return {boolean} - return boolean value for shop this out fit CTA
 */
function isShopThisOutFitCTAEnable(productObject, images) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var isShopThisOutfitCTAEnable = false;
    var selectedColorId = null;
    if (productObject) {
        var productVariationModel = productObject.getVariationModel();
        if (productVariationModel.getProductVariationAttribute('color') && productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color'))) {
            selectedColorId = productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).getID();
        }
        if (selectedColorId) {
            var image = images && images.pdpMainDesktop && images.pdpMainDesktop[0] ? images.pdpMainDesktop[0] : {};
            var size = image.modelSpec && image.modelSpec.modelSize ? image.modelSpec.modelSize.toLowerCase() : '';
            var materialCodes = getMaterialCode(productObject, selectedColorId, size);
            if (!empty(materialCodes) && materialCodes.length > 0) {
                var masterPDPProd = productObject.isVariant() ? productObject.getMasterProduct() : productObject;
                for (var i = 0; i < materialCodes.length; i++) {
                    var materialCode = materialCodes[i];
                    var modelProduct = ProductMgr.getProduct(materialCode.sku);
                    var modelMasterProd = modelProduct && modelProduct.isVariant() ? modelProduct.getMasterProduct() : modelProduct;
                    if (modelMasterProd && modelMasterProd.ID !== masterPDPProd.ID && modelMasterProd.availabilityModel.inStock) {
                        isShopThisOutfitCTAEnable = true;
                        return isShopThisOutfitCTAEnable;
                    }
                }
            }
        }
    }
    return isShopThisOutfitCTAEnable;
}

/**
 * Constructs image file names with sizes
 *
 * @param {string} fileName   - filename
 * @return {Array} - return image filenames for different sizes
 */
function getImageFileNames(fileName) {
    var fileNames = [];
    try {
        if (!empty(fileName)) {
            var partialFileName = fileName.split('_')[0];
            var suffix = fileName.split('_')[1];
            var sizes = ['XS', '', 'MD', 'LG', 'XL', 'XXL'];
            for (var i = 0; i < sizes.length; i++) {
                if (!empty(sizes[i])) {
                    fileNames.push(partialFileName + '_' + suffix + '_' + sizes[i]);
                } else {
                    fileNames.push(partialFileName + '_' + suffix);
                }
            }
        }
    } catch (e) {
        let Logger = require('dw/system/Logger');
        Logger.error('Error while executing getImageFileNames', e.message);
    }
    return fileNames;
}

/**
 * Provides fit model specifications of all sizes for a color swatch
 *
 * @param {Object} product   - product
 * @param {string} swatchValue - selected color swatch
 * @return {Object} - return model specifications
 */
function getFitModelSpecs(product, swatchValue) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Site = require('dw/system/Site');
    let enableFitModel = 'enableFitModels' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enableFitModels') : false;
    let enbaleModelSpec = 'enableModelSpec' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enableModelSpec') : false;
    var fitModelResults = {
        error: true
    };
    var options = [];
    var masterProduct = product;
    try {
        if (product.productType === 'variant') {
            var apiProduct = ProductMgr.getProduct(product.id);
            masterProduct = apiProduct.masterProduct;
        }
        let hasSizeModel = 'hasSizeModel' in masterProduct.custom && masterProduct.custom.hasSizeModel;
        let shopTheLookDisable = 'shopTheLookDisable' in masterProduct.custom && !masterProduct.custom.shopTheLookDisable;
        if (enableFitModel && hasSizeModel) {
            if (enbaleModelSpec && shopTheLookDisable && 'shopTheLookJson' in masterProduct.custom && !empty(masterProduct.custom.shopTheLookJson)) {
                var shoptheLookJSON = JSON.parse(masterProduct.custom.shopTheLookJson);
                var ColorJSON = shoptheLookJSON[swatchValue];
                if (product.images && product.images.pdpMainDesktop && product.images.pdpMainDesktop.length > 0) {
                    var absURL = product.images.pdpMainDesktop[0].absURL;
                    if (!empty(absURL)) {
                        let pathArr = absURL.split('?')[0].split('/');
                        let imageFileName = pathArr[pathArr.length - 1];
                        var sizeFileNames = getImageFileNames(imageFileName);
                        if (!empty(ColorJSON) && !empty(sizeFileNames)) {
                            options.push({ modelSize: 'default' });
                            for (var i = 0; i < sizeFileNames.length; i++) {
                                var sizeModel = ColorJSON[sizeFileNames[i]];
                                if (sizeModel && sizeModel.showModelInfo && !empty(sizeModel.modelSize) && !empty(sizeModel.modelHeightCm) && !empty(sizeModel.modelHeightFtIn)) {
                                    let modelHeightFtIn = Math.floor(sizeModel.modelHeightFtIn / 12) + "'" + (sizeModel.modelHeightFtIn % 12) + '"';
                                    options.push({ modelSize: sizeModel.modelSize.toLowerCase(), modelHeightFt: modelHeightFtIn, modelHeightCm: sizeModel.modelHeightCm });
                                } else {
                                    options.push({ modelSize: sizeFileNames[i].split('_') && sizeFileNames[i].split('_')[2] ? sizeFileNames[i].split('_')[2].toLowerCase() : 'sm' });
                                }
                            }
                        }
                    }
                }
                fitModelResults.error = false;
                fitModelResults.options = options;
            }
        }
    } catch (e) {
        let Logger = require('dw/system/Logger');
        Logger.error('Error while executing getFitModelSpecs', e.message);
    }
    return fitModelResults;
}

/**
 * constructs dropdown options for choose your size with model specifications
 *
 * @param {Object} sizeModelSpecs   - size model specification
 * @return {Array} - return choose your size dropdown values
 */
function getFitModelOptions(sizeModelSpecs) {
    var Locale = require('dw/util/Locale');
    var Resource = require('dw/web/Resource');
    let currentCountry = Locale.getLocale(request.locale).country; //eslint-disable-line
    var chooseYourSizeOptions = [];
    try {
        if (sizeModelSpecs && !sizeModelSpecs.error && !empty(sizeModelSpecs.options)) {
            for (var i = 0; i < sizeModelSpecs.options.length; i++) {
                var option = sizeModelSpecs.options[i];
                if (option.modelSize !== 'default' && !option.modelHeightFt) {
                    chooseYourSizeOptions.push({ id: option.modelSize, label: Resource.msgf('product.model.size.specification.dropdown', 'product', null, option.modelSize.toUpperCase()) });
                } else if (option.modelSize && option.modelHeightCm && option.modelHeightFt && currentCountry === 'CA') {
                    chooseYourSizeOptions.push({ id: option.modelSize, label: Resource.msgf('product.model.specification.dropdownCA', 'product', null, option.modelHeightCm, option.modelHeightFt, option.modelSize.toUpperCase()) });
                } else if (option.modelSize && option.modelHeightFt && currentCountry === 'US') {
                    chooseYourSizeOptions.push({ id: option.modelSize, label: Resource.msgf('product.model.specification.dropdown', 'product', null, option.modelHeightFt, option.modelSize.toUpperCase()) });
                }
            }
        } else {
            let options = fetchSizeModelJSON();
            for (var j = 0; j < options.length; j++) {
                if (options[j].id !== 'default') {
                    chooseYourSizeOptions.push({ id: options[j].id, label: options[j].label });
                }
            }
        }
    } catch (e) {
        let Logger = require('dw/system/Logger');
        Logger.error('Error while executing getFitModelOptions', e.message);
    }
    return chooseYourSizeOptions;
}

/**
 * Retrieves the Product Detail Page, if available in Page Designer
 * @param {Object} reqProduct - the product as determined from the request
 * @returns {Object} a lookup result with these fields:
 *  * page - the page that is configured for this product, if any
 *  * invisiblePage - the page that is configured for this product if we ignore visibility, if it is different from page
 *  * aspectAttributes - the aspect attributes that should be passed to the PageMgr, null if no page was found
*/
base.getPageDesignerProductPage = function (reqProduct) {
    if (reqProduct.template) {
       // this product uses an individual template, for backwards compatibility this has to be handled as a non-PD page
        return {
            page: null,
            invisiblePage: null,
            aspectAttributes: null
        };
    }

    var PageMgr = require('dw/experience/PageMgr');
    var HashMap = require('dw/util/HashMap');

    var product = reqProduct.raw;
    var category = product.variant
            ? product.masterProduct.primaryCategory
            : product.primaryCategory;
    if (!category) {
        category = product.variant
            ? product.masterProduct.classificationCategory
            : product.classificationCategory;
    }

    var page = PageMgr.getPageByCategory(category, true, 'pdp');
    var invisiblePage = PageMgr.getPageByCategory(category, false, 'pdp');
    if (page) {
        var aspectAttributes = new HashMap();
        aspectAttributes.category = category;
        aspectAttributes.product = product;

        return {
            page: page,
            invisiblePage: page.ID !== invisiblePage.ID ? invisiblePage : null,
            aspectAttributes: aspectAttributes
        };
    }

    return {
        page: null,
        invisiblePage: invisiblePage,
        aspectAttributes: null
    };
};

/**
 * Check if the product is not excluded to show the Free return and exchange PDP message
 *
 * @param {dw.catalog.Product} product - Product instance returned from the API
 * @return {boolean} - return boolean value for Free return and exchange PDP message
 */
function isPdpReturnExchangeMsgEnable(product) {
    let Logger = require('dw/system/Logger');
    try {
        if (empty(product)) return false;
        let Site = require('dw/system/Site');
        let sitePreferences = Site.current.getPreferences();
        let customPreferences = sitePreferences.getCustom();
        let pdpReturnExchangeMsgEnable = ('isPdpReturnExchangeEnable' in customPreferences) && customPreferences.isPdpReturnExchangeEnable;
        let isProductPdpReturnMsgExcluded = product.variant ? product.variationModel.master.custom.isPdpReturnMsgExcluded : product.custom.isPdpReturnMsgExcluded;
        return pdpReturnExchangeMsgEnable && !isProductPdpReturnMsgExcluded;
    } catch (e) {
        Logger.error('productHelpers.js::isPdpReturnExchangeMsgEnable() ' + e.message);
        return false;
    }
}

/* eslint-enable prefer-const */
module.exports = base;
module.exports.isMFOItem = isMFOItem;
module.exports.getConfig = getConfig;
module.exports.showGiftBoxes = showGiftBoxes;
module.exports.filterColorSwatches = filterColorSwatches;
module.exports.fixProductColorNames = fixProductColorNames;
module.exports.showProductPage = showProductPage;
module.exports.getAllBreadcrumbs = getAllBreadcrumbs;
module.exports.getResources = getResources;
module.exports.removeSizeParamFromUrl = removeSizeParamFromUrl;
module.exports.getNoImageURL = getNoImageURL;
module.exports.getCallOutMessagePromotions = getCallOutMessagePromotions;
module.exports.getUpsellType = getUpsellType;
module.exports.sizeModelImagesMapping = sizeModelImagesMapping;
module.exports.addRecipeToSizeModelImage = addRecipeToSizeModelImage;
module.exports.recipeForPDPSizeModelImage = recipeForPDPSizeModelImage;
module.exports.fetchSizeModelJSON = fetchSizeModelJSON;
module.exports.changeSwatchBorder = changeSwatchBorder;
module.exports.getSelectedModelSpecObj = getSelectedModelSpecObj;
module.exports.getImageSpecificModelSpec = getImageSpecificModelSpec;
module.exports.privacyBannerCookie = privacyBannerCookie;
module.exports.selectTeamFilter = selectTeamFilter;
module.exports.getMaterialCode = getMaterialCode;
module.exports.isShopThisOutFitCTAEnable = isShopThisOutFitCTAEnable;
module.exports.getFitModelSpecs = getFitModelSpecs;
module.exports.getFitModelOptions = getFitModelOptions;
module.exports.isPdpReturnExchangeMsgEnable = isPdpReturnExchangeMsgEnable;
