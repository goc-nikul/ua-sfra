var ProductMgr = require('dw/catalog/ProductMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var Status = require('dw/system/Status');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var dwutil = require('dw/util');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var productUtils = require('int_customfeeds/cartridge/scripts/util/ProductUtils');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');
var Logger = require('dw/system/Logger');
var productHookUtils = require('./productHookUtils');

const PRICEBOOK_TYPES = { SALE: 'sale', LIST: 'list' };

/**
* @param {string} currencyCode Three letter currency code
* @param {string} locale SFCC locale
* @param {string} type pricebook type: 'list' || 'sale'
* @returns {Object} - pricebook id
*/
function getPricebookID(currencyCode, locale, type) {
    if (empty(currencyCode) || empty(type)) return;

    var pricebook = PriceBookMgr.getPriceBook(currencyCode + '-' + type); // original method.

    /**
    * @returns {Array} - list and sale pricebook Ids
    */
    const getPricebookIdsFromPref = function () {
        let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        let countriesJSON = PreferencesUtil.getJsonValue('countriesJSON');

        if (countriesJSON) {
            for (let key in countriesJSON) { // eslint-disable-line
                let current = countriesJSON[key];
                let locales = !empty(current) && 'locales' in current ? current.locales : null;

                // search locale in preference
                if (locales && locales.indexOf(locale) !== -1) {
                    return current.priceBooks;
                }
            }
        }
        return [];
    };

    if (empty(pricebook) || pricebook == null) {
        let pricebookIds = getPricebookIdsFromPref();

        // get pricebook id by type
        let pricebookId = pricebookIds.filter(function (item) {
            return item.includes(type);
        });

        pricebook = PriceBookMgr.getPriceBook(pricebookId);
    }

    return pricebook ? pricebook.getID() : null; // eslint-disable-line
}

/**
* @param {Object} productItem The searchhit product (variant/masterProduct)
* @param {Object} Product The master product
* @returns {Object} - Pricing data
*/
function getSearchHitPricing(productItem, Product) {
    var currencyCode = session.getCurrency().getCurrencyCode();
    var locale = request.getLocale(); // eslint-disable-line
    var salePriceBookID = getPricebookID(currencyCode, locale, PRICEBOOK_TYPES.SALE);
    var listPriceBookID = getPricebookID(currencyCode, locale, PRICEBOOK_TYPES.LIST);
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(Product);
    var promotionPrice = priceHelper.getPromotionPrice(Product, promotions, null);
    var AllPriceRanges = productUtils.getAllPriceRanges(Product);
    if (promotionPrice && promotionPrice.value && !isNaN(promotionPrice.value) && AllPriceRanges.minSalePrice.value > promotionPrice.value) {
        AllPriceRanges.minSalePrice = promotionPrice;
        AllPriceRanges.maxSalePrice = promotionPrice;
    }
    var minPrice = Math.min(AllPriceRanges.minListPrice.value, AllPriceRanges.minSalePrice.value);
    var maxPrice = Math.max(AllPriceRanges.maxListPrice.value, AllPriceRanges.maxSalePrice.value);

    var prices = new dwutil.HashMap();

    var isPriceRange = minPrice !== maxPrice;
    if (Product.master && isPriceRange) {
        prices.put(listPriceBookID, AllPriceRanges.minListPrice.value);
        prices.put(salePriceBookID, AllPriceRanges.minSalePrice.value);
    } else {
        if (Product.master && !isPriceRange) {
            var firstVariant = (productItem && !empty(productItem) && !productItem.isMaster() && productItem.getMasterProduct().ID === Product.ID) ? productItem : productUtils.getFirstVariantForGrid(Product.variationModel);
            if (!empty(firstVariant)) {
                Product = firstVariant; // eslint-disable-line
                promotionPrice = priceHelper.getPromotionPrice(Product, promotions, null);
                if (promotionPrice && promotionPrice.value && !isNaN(promotionPrice.value) && AllPriceRanges.minSalePrice.value > promotionPrice.value) {
                    AllPriceRanges.minSalePrice = promotionPrice;
                    AllPriceRanges.maxSalePrice = promotionPrice;
                    minPrice = Math.min(AllPriceRanges.minListPrice.value, AllPriceRanges.minSalePrice.value);
                }
            }
        }

        var StandardPrice = productUtils.getPriceByPricebook(Product, currencyCode, 'list');
        var SalesPrice = productUtils.getPriceByPricebook(Product, currencyCode, 'sale');
        if (promotionPrice && promotionPrice.value && !isNaN(promotionPrice.value) && SalesPrice.value > promotionPrice.value) {
            SalesPrice = promotionPrice;
        }
        var ShowStandardPrice = !empty(StandardPrice) && !empty(SalesPrice) && StandardPrice.available && SalesPrice.available && StandardPrice.compareTo(SalesPrice) === 1;
        if (ShowStandardPrice) {
            prices.put(listPriceBookID, StandardPrice.value);
            prices.put(salePriceBookID, SalesPrice.value);
        }
    }

    prices.put(listPriceBookID + '-min', AllPriceRanges.minListPrice.value);
    prices.put(listPriceBookID + '-max', AllPriceRanges.maxListPrice.value);
    prices.put(salePriceBookID + '-min', AllPriceRanges.minSalePrice.value);
    prices.put(salePriceBookID + '-max', AllPriceRanges.maxSalePrice.value);

    return {
        minPrice: minPrice,
        maxPrice: maxPrice,
        prices: prices
    };
}

/**
* @param {Object} product The searchhit product (variant/masterProduct)
* @param {Object} masterProduct The master product
* @param {Object} experienceType 'premium' or 'outlet'
* @returns {Object} - Pricing based on experience type (outlet vs. premium pricing)
*/
function getExperienceTypePricing(product, masterProduct, experienceType) {
    // If experienceType is set and there are outlet colors to filter by
    if (!empty(experienceType) && !empty(product.custom.outletColors)) { //eslint-disable-line
        const currencyCode = session.getCurrency().getCurrencyCode();
        const locale = request.getLocale(); // eslint-disable-line
        const salePriceBookID = getPricebookID(currencyCode, locale, PRICEBOOK_TYPES.SALE);
        const listPriceBookID = getPricebookID(currencyCode, locale, PRICEBOOK_TYPES.LIST);

        // Only certain variants should be visible to the customer, use priceObj from LRA to render only relevant data
        try {
            const ProductUtils = require('*/cartridge/scripts/util/ProductUtils.ds');
            const LRAPriceObj = ((experienceType === 'premium') ? ProductUtils.getPremiumPricing(masterProduct) : ProductUtils.getOutletPricing(masterProduct));

            var AllPriceRanges = productUtils.getAllPriceRanges(masterProduct);
            var minPrice = Math.min(AllPriceRanges.minListPrice.value, AllPriceRanges.minSalePrice.value);
            var maxPrice = Math.max(AllPriceRanges.maxListPrice.value, AllPriceRanges.maxSalePrice.value);

            var prices = new dwutil.HashMap();
            prices.put(listPriceBookID + '-min', AllPriceRanges.minListPrice.value);
            prices.put(listPriceBookID + '-max', AllPriceRanges.maxListPrice.value);

            if (LRAPriceObj.showRangePrice) {
                prices.put(salePriceBookID + '-min', LRAPriceObj.saleLowest.value);
                prices.put(salePriceBookID + '-max', LRAPriceObj.saleHighest.value);
                prices.put(salePriceBookID, LRAPriceObj.saleLowest.value);
                minPrice = LRAPriceObj.saleLowest.value;
            } else {
                prices.put(salePriceBookID + '-min', LRAPriceObj.salesPrice.value);
                prices.put(salePriceBookID + '-max', LRAPriceObj.salesPrice.value);
                prices.put(salePriceBookID, LRAPriceObj.salesPrice.value);
                minPrice = LRAPriceObj.salesPrice.value;
            }

            return {
                minPrice: minPrice,
                maxPrice: maxPrice,
                prices: prices
            };
        } catch (e) {
            Logger.warn('Error generating LRAPriceObject, fallback to default searchhit pricing!: ' + e.message);
        }
    }

    return null;
}

/**
 * @param {Object} currentSearch OCAPI response object.
 * @returns {Array} - array of page meta tags
 */
function getPageMetaTags() {
    try {
        var ProductSearchModel = require('dw/catalog/ProductSearchModel');
        var apiProductSearch = new ProductSearchModel();
        var metaTags = apiProductSearch.pageMetaTags;
        const tagObjects = [];
        metaTags.forEach(function (tag) {
            tagObjects.push({
                ID: tag.ID,
                name: tag.name,
                property: tag.property,
                title: tag.title,
                content: tag.content
            });
        });
        return tagObjects;
    } catch (error) {
        Logger.warn(JSON.stringify(error));
    }
    return [];
}

/**
 * @param {Object} entry Product color info
 * @param {Array} arr Array of Product color info
 * @returns {boolean} - arr contains duplicate value of entry
 */
function isDuplicate(entry, arr) {
    return arr.some(x => (entry.color === x.color));
}

/**
* @param {Object} currentSearch OCAPI response object.
* @returns {Status} - Status
*/
exports.modifyGETResponse = function (currentSearch) {
    try {
        const pageMetaTagsPLP = getPageMetaTags();

        var ImageModel = require('*/cartridge/models/product/productImages');
        let category;
        const cgid = currentSearch.selected_refinements && currentSearch.selected_refinements.cgid ? currentSearch.selected_refinements.cgid : null;
        if (cgid) {
            category = CatalogMgr.getCategory(cgid);
        }
        const experienceType = category && category.custom && category.custom.experienceType ? category.custom.experienceType.value : null;

        Object.keys(currentSearch.hits).forEach(function (key) {
            var item = currentSearch.hits[key];
            var productItem = ProductMgr.getProduct(item.product_id);
            const outletColors = productItem.custom.outletColors ? productItem.custom.outletColors.split(',') : [];
            item.c_outletColors = productItem.custom.outletColors;
            if (experienceType === 'outlet') {
                const colorAttr = item.variationAttributes.toArray().find(attr => attr.id === 'color');

                if (!outletColors || !outletColors.length) {
                    colorAttr.values = new dwutil.ArrayList();
                } else if (colorAttr && 'values' in colorAttr) {
                    const colors = colorAttr.values.toArray().filter(color => outletColors.indexOf(color.value) > -1);
                    colorAttr.values = new dwutil.ArrayList(colors);
                }
            }

            if (productItem.isMaster()) {
                if (Object.prototype.hasOwnProperty.call(productItem, 'variants')) {
                    var productVariants = productItem.variants;
                    var cVariantColors = [];
                    for (var x = 0; x < productVariants.length; x++) {
                        var entry = {
                            color: productVariants[x].custom.color,
                            colorway: productVariants[x].custom.colorway,
                            hex: productVariants[x].custom.hexcolor,
                            secondaryHex: productVariants[x].custom.secondaryhexcolor,
                            team: productVariants[x].custom.team
                        };
                        if (!isDuplicate(entry, cVariantColors)) {
                            cVariantColors.push(entry);
                        }
                    }
                    item.c_variantColors = cVariantColors;
                }
            }

            if (productItem.isVariant() || productItem.isMaster()) {
                var Product = productItem.isVariant() ? productItem.getMasterProduct() : productItem;
                // Get all the gridTileDesktop images of the item and pass in the custom attribute c_image
                var config = { types: ['gridTileDesktop'], quantity: 'all' };
                var imagesList = new ImageModel(Product.variationModel, config);

                var imageArray = [];
                for (var i = 0; i < imagesList.gridTileDesktop.length; i++) {
                    var imageObject = {};
                    imageObject.alt = imagesList.gridTileDesktop[i].alt;
                    imageObject.link = imagesList.gridTileDesktop[i].url;
                    imageObject.title = imagesList.gridTileDesktop[i].title;
                    imageArray.push(imageObject);
                }

                item.c_image = imageArray;

                var productUrl = productHookUtils.getProductUrl(Product);
                var productTileBottomLeftBadge = Product.custom.productTileBottomLeftBadge;
                var productTileUpperLeftBadge = Product.custom.productTileUpperLeftBadge;
                var productTileUpperLeftFlameIconBadge = 'productTileUpperLeftFlameIconBadge' in Product.custom ? Product.custom.productTileUpperLeftFlameIconBadge : '';
                var productGiftCard = Product.custom.giftCard.displayValue;
                var defaultColorway = Product.custom.defaultColorway;
                if (productUrl) {
                    item.c_url = productUrl;
                }
                if (productTileBottomLeftBadge) {
                    item.c_productTileBottomLeftBadge = productTileBottomLeftBadge;
                }
                if (productTileUpperLeftBadge) {
                    item.c_productTileUpperLeftBadge = productTileUpperLeftBadge.value;
                    item.c_productTileUpperLeftBadgeDisplayValue = productTileUpperLeftBadge.displayValue;
                }
                if (productTileUpperLeftFlameIconBadge) {
                    item.c_productTileUpperLeftFlameIconBadge = productTileUpperLeftFlameIconBadge.value;
                    item.c_productTileUpperLeftFlameIconBadgeDisplayValue = productTileUpperLeftFlameIconBadge.displayValue;
                }
                if (Product.custom.giftCard.value) {
                    item.c_giftCard = productGiftCard;
                }
                if (defaultColorway) {
                    item.c_defaultColorway = defaultColorway;
                }

                const premiumFilter = currentSearch.selected_refinements && currentSearch.selected_refinements.c_premiumFilter ? currentSearch.selected_refinements.c_premiumFilter : null;
                const experienceTypePricing = getExperienceTypePricing(productItem, Product, premiumFilter);
                const pricing = experienceTypePricing || getSearchHitPricing(productItem, Product);
                item.price = pricing.minPrice;
                item.price_max = pricing.maxPrice;
                item.prices = pricing.prices;

                // add promotion details to response
                var productPromotions = [];
                var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(Product);
                for (var j = 0; j < promotions.length; j++) {
                    productPromotions.push({
                        _type: promotions[j].promotionClass.toLowerCase() + '_promotion', // product_promotion or order_promotion or shipping_promotion
                        callout_msg: !empty(promotions[j].calloutMsg) ? promotions[j].calloutMsg.markup : '',
                        promotion_id: promotions[j].ID,
                        tooltip: !empty(promotions[j].details) ? promotions[j].details.markup : ''
                    });
                }
                if (productPromotions) {
                    item.c_productPromotions = productPromotions;
                }

                item.c_outletColors = productItem.custom.outletColors;
                item.c_isOutletCategory = experienceType === 'outlet';
                item.c_pageMetaTags = pageMetaTagsPLP;
            }
        });
        return new Status(Status.OK);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e);
    }
};
