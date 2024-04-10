'use strict';

var PromotionMgr = require('dw/campaign/PromotionMgr');
var ArrayList = require('dw/util/ArrayList');
var pricingHelper = require('*/cartridge/scripts/helpers/pricing');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var DefaultPrice = require('*/cartridge/models/price/default');
var RangePrice = require('*/cartridge/models/price/range');
var Logger = require('dw/system/Logger');
var tileImageHelper = require('*/cartridge/models/product/decorators/tileImages');
const Money = require('dw/value/Money');
const Site = require('dw/system/Site');

/**
 * Retrieve promotions that apply to current product
 * @param {dw.catalog.ProductSearchHit} searchHit - current product returned by Search API.
 * @param {Array<string>} activePromotions - array of ids of currently active promotions
 * @return {Array<Promotion>} - Array of promotions for current product
 */
function getPromotions(searchHit, activePromotions) {
    var productPromotionIds = searchHit.discountedPromotionIDs;

    var promotions = new ArrayList();
    activePromotions.forEach(function (promoId) {
        var index = productPromotionIds.indexOf(promoId);
        if (index > -1) {
            promotions.add(PromotionMgr.getPromotion(productPromotionIds[index]));
        }
    });

    return promotions;
}

/**
 * Get list price for a given product
 * @param {dw.catalog.ProductSearchHit} hit - current product returned by Search API.
 * @param {function} getSearchHit - function to find a product using Search API.
 * @param {dw.catalog.Product} selectedProductVariant - color variant
 * @param {Array<Promotion>} promotions - Array of promotions for current product
 *
 * @returns {Object} - price for a product
 */
function getListPrices(hit, getSearchHit, selectedProductVariant, promotions) {
    var priceModel = hit.firstRepresentedProduct.getPriceModel();
    if (!priceModel.priceInfo) {
        return {};
    }
    var rootPriceBook = pricingHelper.getRootPriceBook(priceModel.priceInfo.priceBook);
    if ((rootPriceBook.ID === priceModel.priceInfo.priceBook.ID) && promotions.getLength() < 1) {
        return { minPrice: hit.minPrice, maxPrice: hit.maxPrice };
    }
    var searchHit;
    var currentApplicablePriceBooks = PriceBookMgr.getApplicablePriceBooks();
    try {
        PriceBookMgr.setApplicablePriceBooks(rootPriceBook);
        if (promotions.getLength() > 0 && selectedProductVariant) {
            searchHit = getSearchHit(selectedProductVariant);
        } else {
            searchHit = getSearchHit(hit.product);
        }
    } catch (e) {
        searchHit = hit;
    } finally {
        // Clears price book ID's stored to the session.
        // When switching locales, there is nothing that clears the price book ids stored in the
        // session, so subsequent searches will continue to use the ids from the originally set
        // price books which have the wrong currency.
        if (currentApplicablePriceBooks && currentApplicablePriceBooks.length) {
            PriceBookMgr.setApplicablePriceBooks(currentApplicablePriceBooks.toArray());
        } else {
            PriceBookMgr.setApplicablePriceBooks();
        }
    }

    if (searchHit) {
        if (searchHit.minPrice.available && searchHit.maxPrice.available) {
            return {
                minPrice: searchHit.minPrice,
                maxPrice: searchHit.maxPrice
            };
        }

        return {
            minPrice: hit.minPrice,
            maxPrice: hit.maxPrice
        };
    }

    return {};
}

module.exports = function (object, searchHit, activePromotions, getSearchHit, experienceType, getSelectedProductVariant, apiProduct, sizeModeViewPref) {
    Object.defineProperty(object, 'price', {
        enumerable: true,
        writable: true,
        value: (function () {
            const productAPI = searchHit.getProduct();
            var promotions = getPromotions(searchHit, activePromotions);

            // If experienceType is set and there are outlet colors to filter by
            // EPMD-10529 : adding this condition productAPI && !(productAPI.variant) to bypass variation products to display price range when slicing is enabled & category experience type is selecetd
            if (productAPI && !(productAPI.variant) && (object.id === searchHit.productID) && !empty(experienceType) && experienceType !== 'allMerchOverride' && !empty(productAPI.custom.outletColors) && promotions.getLength() < 1) { //eslint-disable-line
                // Only certain variants should be visible to the customer, use priceObj from LRA to render only relevant data
                try {
                    const ProductUtils = require('*/cartridge/scripts/util/ProductUtils.ds');
                    var LRAPriceObj = ((experienceType === 'premium' || experienceType === 'premiumMerchOverride') ? ProductUtils.getPremiumPricing(searchHit.getProduct(), apiProduct) : ProductUtils.getOutletPricing(searchHit.getProduct()));
                    if (experienceType === 'both' && LRAPriceObj.standardPrice === undefined) {
                        LRAPriceObj = ProductUtils.getPremiumPricing(searchHit.getProduct(), apiProduct);
                    }
                    // Range Scenario
                    if (LRAPriceObj.showRangePrice) return new RangePrice(LRAPriceObj.saleLowest, LRAPriceObj.saleHighest);
                    // Strikethrough Scenario
                    else if (LRAPriceObj.showStandardPrice) return new DefaultPrice(LRAPriceObj.salesPrice, LRAPriceObj.standardPrice);
                    // Single Price Scenario
                    return new DefaultPrice(LRAPriceObj.salesPrice);
                } catch (e) {
                    Logger.error('Error generating LRAPriceObject, fallback to searchHit rendering!: ' + e.message);
                }
            }
            var salePrice = { minPrice: searchHit.minPrice, maxPrice: searchHit.maxPrice };
            // Display price range for e-gift card
            if (!empty(productAPI.custom.giftCard) && productAPI.custom.giftCard.value === 'EGIFT_CARD') {
                var minAmount = Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin') || 0;
                var maxAmount = Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMax') || 0;
                var currency = Site.current.getDefaultCurrency();
                salePrice = { minPrice: new Money(minAmount, currency), maxPrice: new Money(maxAmount, currency) };
            }
            var selectedProductVariant;
            var promotionalPrice;
            var colorSelected = '';
            try {
                if (promotions.getLength() > 0 && !empty(apiProduct)) {
                    var imageObject = {};
                    tileImageHelper(imageObject, apiProduct, searchHit, sizeModeViewPref, experienceType);
                    colorSelected = !empty(imageObject.images) && !empty(imageObject.images.selectedColor) && imageObject.images.selectedColor.color ? imageObject.images.selectedColor.color : '';

                    if (colorSelected !== '') {
                        selectedProductVariant = getSelectedProductVariant(apiProduct, colorSelected);
                    }
                }
            } catch (e) {
                Logger.error('exception in getting selectedProductVariant' + e.message);
            }
            if (promotions.getLength() > 0 && selectedProductVariant) {
                promotionalPrice = pricingHelper.getPromotionPrice(selectedProductVariant, promotions);
                if (promotionalPrice && promotionalPrice.available) {
                    salePrice = { minPrice: promotionalPrice, maxPrice: promotionalPrice };
                }
            } else if (promotions.getLength() > 0) {
                promotionalPrice = pricingHelper.getPromotionPrice(searchHit.firstRepresentedProduct, promotions);
                if (promotionalPrice && promotionalPrice.available) {
                    salePrice = { minPrice: promotionalPrice, maxPrice: promotionalPrice };
                }
            }
            var listPrice = getListPrices(searchHit, getSearchHit, selectedProductVariant, promotions);

            if (salePrice.minPrice.value !== salePrice.maxPrice.value) {
                // range price
                return new RangePrice(salePrice.minPrice, salePrice.maxPrice);
            }

            if (listPrice.minPrice && listPrice.minPrice.valueOrNull !== null) {
                if (listPrice.minPrice.value !== salePrice.minPrice.value) {
                    return new DefaultPrice(salePrice.minPrice, listPrice.minPrice);
                }
            }
            return new DefaultPrice(salePrice.minPrice);
        }())
    });
};
