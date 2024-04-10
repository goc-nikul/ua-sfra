/**
 * products.js
 *
 * Handles GET calls to product. This hook is used to add in the range pricing
 */

var Status = require('dw/system/Status');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var dwutil = require('dw/util');
var productUtils = require('int_customfeeds/cartridge/scripts/util/ProductUtils');
var priceHelper = require('*/cartridge/scripts/helpers/pricing');
var ContentMgr = require('dw/content/ContentMgr');
var productHookUtils = require('./productHookUtils');
var Currency = require('dw/util/Currency');

exports.modifyGETResponse = function (Product, productResponse) {
    /**
     * Changes Related to Features/Benefits Icons Values Display
     */
    var productIcons = ('icons' in Product.custom) ? Product.custom.icons : [];
    if (productIcons.length > 0) {
        productResponse.c_icons = productHookUtils.beautifySelectedFeatureAndBenifits(Product); // eslint-disable-line
    }

    var currencyCode = session.getCurrency().getCurrencyCode();
    const Site = require('dw/system/Site');
    var getCurrencyFromCoreMediaProdHookReq = 'processCurrencyBasedOnCurrencyParam' in Site.current.preferences.custom && Site.current.preferences.custom.processCurrencyBasedOnCurrencyParam;
    if (getCurrencyFromCoreMediaProdHookReq) {
        // eslint-disable-next-line no-undef
        var params = request.getHttpParameters();
        if (params.get('currency')) {
            currencyCode = params.get('currency')[0];
            session.setCurrency(Currency.getCurrency(currencyCode));
        }
    }
    var priceBooks = productUtils.getPriceBooks(currencyCode);
    var listPriceBookID = priceBooks.listPriceBookID;
    var salePriceBookID = priceBooks.salePriceBookID;
    // If this is fetching a variation and not a master product, price customization is not necessary
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(Product);
    var promotionPrice = priceHelper.getPromotionPrice(Product, promotions, null);
    var prices = new dwutil.HashMap();

    var productUrl = productHookUtils.getProductUrl(Product);
    if (productUrl) {
        productResponse.c_url = productUrl; // eslint-disable-line
    }

    var contentAssetId = productResponse.c_sizeCalloutAssetID;
    if (contentAssetId) {
        var content = ContentMgr.getContent(contentAssetId);
        if (content && content.online && content.custom && content.custom.appBody) {
            productResponse.c_sizeCalloutAssetDisplayValue = content.custom.appBody; // eslint-disable-line
        }
    }

    var productTileUpperLeftBadge = Product.custom.productTileUpperLeftBadge;
    if (productTileUpperLeftBadge) {
        productResponse.c_productTileUpperLeftBadge = productTileUpperLeftBadge.value; // eslint-disable-line
        productResponse.c_productTileUpperLeftBadgeDisplayValue = productTileUpperLeftBadge.displayValue; // eslint-disable-line
    }

    var productTileUpperLeftFlameIconBadge = 'productTileUpperLeftFlameIconBadge' in Product.custom ? Product.custom.productTileUpperLeftFlameIconBadge : '';
    if (productTileUpperLeftFlameIconBadge) {
        productResponse.c_productTileUpperLeftFlameIconBadge = productTileUpperLeftFlameIconBadge.value; // eslint-disable-line
        productResponse.c_productTileUpperLeftFlameIconBadgeDisplayValue = productTileUpperLeftFlameIconBadge.displayValue; // eslint-disable-line
    }

    if (promotions) {
        var productPromotions = productHookUtils.mapProductPromotions(promotions);
        productResponse.c_productPromotions = productPromotions; // eslint-disable-line
    }

    // TODO: need to look into why this block returns early as it seems to prevent future code from being run
    if (productResponse && productResponse.type && !productResponse.type.master && productResponse.type.variant) {
        if (promotionPrice && promotionPrice.value && !isNaN(promotionPrice.value) && productResponse.price > promotionPrice.value) {
            var listPrice = productUtils.getPriceByPricebook(Product, currencyCode, 'list');
            if (listPrice && !empty(listPrice)) {
                prices.put(listPriceBookID, listPrice.value);
            }
            prices.put(salePriceBookID, promotionPrice.decimalValue);
            productResponse.price = promotionPrice.decimalValue; // eslint-disable-line
            productResponse.prices = prices; // eslint-disable-line
            return new Status(Status.OK);
        }
    }
    var productItem = Product;
    var AllPriceRanges = productUtils.getAllPriceRanges(productItem);
    if (promotionPrice && promotionPrice.value && !isNaN(promotionPrice.value) && AllPriceRanges.minSalePrice.value > promotionPrice.value) {
        AllPriceRanges.minSalePrice = promotionPrice;
        AllPriceRanges.maxSalePrice = promotionPrice;
    }

    // grab product pageMetaTags regardless of product type, will loop through variants as well
    if (!empty(productItem) && productItem.pageMetaTags && productItem.pageMetaTags.length > 0) {
        productResponse.c_pageMetaTags = productHookUtils.mapAndFormatTags(productItem.pageMetaTags); // eslint-disable-line
    }

    if (Product.master && Product.priceModel.isPriceRange()) {
        prices.put(listPriceBookID, AllPriceRanges.minListPrice.value);
        prices.put(salePriceBookID, AllPriceRanges.minSalePrice.value);

        if (AllPriceRanges.maxListPrice.compareTo(Product.priceModel.maxPrice) !== 0) {
            var maxRangePricesString = '{"' + listPriceBookID + '": ' + AllPriceRanges.maxListPrice.decimalValue + ', "' + salePriceBookID + '": ' + AllPriceRanges.maxSalePrice.decimalValue + '}';
            productResponse.c_prices_max = JSON.parse(maxRangePricesString); // eslint-disable-line
        }
    } else {
        if (Product.master && !Product.priceModel.isPriceRange()) {
            var firstVariant = (productItem && !empty(productItem) && !productItem.isMaster() && productItem.getMasterProduct().ID === Product.ID) ? productItem : productUtils.getFirstVariantForGrid(Product.variationModel);

            if (!empty(firstVariant)) {
                Product = firstVariant; // eslint-disable-line
                promotionPrice = priceHelper.getPromotionPrice(Product, promotions, null);
                if (promotionPrice && promotionPrice.value && !isNaN(promotionPrice.value) && AllPriceRanges.minSalePrice.value > promotionPrice.value) {
                    AllPriceRanges.minSalePrice = promotionPrice;
                    AllPriceRanges.maxSalePrice = promotionPrice;
                }
            }
        }

        if (!productItem.isMaster()) {
            const category = productItem.getMasterProduct().getPrimaryCategory();
            productResponse.c_masterCategoryId = category ? category.ID : null; // eslint-disable-line
            productResponse.c_masterCategoryExperienceType = category && category.custom && category.custom.experienceType ? category.custom.experienceType.value : null; // eslint-disable-line
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

    if (productItem && !empty(productItem) && productItem.isMaster() && productItem.variants && productItem.variants.length > 0) {
        productResponse.c_variantColors = productHookUtils.mapVariantColors(productItem.variants); // eslint-disable-line
    }

    if (promotionPrice && promotionPrice.value && !isNaN(promotionPrice.value) && Product.priceModel.minPrice.value > promotionPrice.value) {
        productResponse.price = promotionPrice.decimalValue; // eslint-disable-line
    } else {
        productResponse.price = Product.priceModel.minPrice.value; // eslint-disable-line
    }
    productResponse.price_max = Product.priceModel.maxPrice.value;// eslint-disable-line
    prices.put(listPriceBookID + '-min', AllPriceRanges.minListPrice.value);
    prices.put(listPriceBookID + '-max', AllPriceRanges.maxListPrice.value);
    prices.put(salePriceBookID + '-min', AllPriceRanges.minSalePrice.value);
    prices.put(salePriceBookID + '-max', AllPriceRanges.maxSalePrice.value);

    productResponse.prices = prices; // eslint-disable-line

    return new Status(Status.OK);
};
