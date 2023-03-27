/* eslint-disable consistent-return */
'use strict';

var server = require('server');

var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
const TYPE_WISH_LIST = require('dw/customer/ProductList').TYPE_WISH_LIST;

/* Script Includes */
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var Template = require('dw/util/Template');

server.extend(module.superModule);

server.replace('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    try {
        var params = req.querystring;
        var productId = params.pid;
        var product = ProductMgr.getProduct(productId);
        var isAvailableForLocale = productHelper.isProductAvailableForLocale(product);
        if (!isAvailableForLocale) {
            var template;
            template = new Template('error/notFound');
            template.setStatusCode(404);
            return template.render().text;
        }
        let isMFOItem = productHelpers.isMFOItem(product);
        if (product && isMFOItem === false) {
            var viewData = res.getViewData();
            var variantProduct = product;
            var currentCustomer = req.currentCustomer.raw;
            var isEnablePdpIcons = Site.getCurrent().getCustomPreferenceValue('enablePDPIcons');
            var isPdpReturnExchangeMsgEnable = productHelpers.isPdpReturnExchangeMsgEnable(product);
            var isRVB = 'rvb_enabled' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('rvb_enabled') : false;
            var rvbExpireDate = 'rvb_expire' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('rvb_expire') : false;
            var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
            let experienceType = '';
            var isProductHasSizeModel = false;
            // Decide for which product view model drop-down will display
            var enableFitModel = 'enableFitModels' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enableFitModels') : false;
            if ('hasSizeModel' in product.custom) {
                isProductHasSizeModel = product.isMaster() ? product.custom.hasSizeModel : product.variant && product.variationModel.master.custom.hasSizeModel;
            }
            viewData.isProductHasSizeModel = isProductHasSizeModel;
            viewData.enableFitModel = enableFitModel;
            var sizeModelObject;
            if (enableFitModel && isProductHasSizeModel) {
                sizeModelObject = productHelpers.fetchSizeModelJSON();
            }
            viewData.sizeModelValues = sizeModelObject;
            // experienceType for Premium/Outlet Experience
            if (params.exp === 'o') experienceType = 'outlet';
            else if (params.exp === 'p') experienceType = 'premium';
            viewData.experienceType = experienceType;
            var availableVariant = false;
            if (product.isMaster() && product.custom.defaultColorway !== null && product.custom.defaultColorway.length > 0 && !request.httpParameters.containsKey('dwvar_' + product.ID + '_color')) { // eslint-disable-line no-undef
                var colors = product.custom.defaultColorway.split(',');
                for (var i = 0; i < colors.length; ++i) {
                    var variant = productHelper.getVariantForColor(product, colors[i]);
                    if (variant.isVariant() && variant.onlineFlag && variant.availabilityModel.availability !== 0 && variant.availabilityModel.orderable && variant.availabilityModel.inStock) {
                        variantProduct = variant;
                        availableVariant = true;
                        break;
                    }
                }
            }

            if (!availableVariant && product.isMaster() && !('variables' in params)) {
                variantProduct = productHelper.getOrderableVariant(product, experienceType);
            } else if (!availableVariant && product.isMaster() && ('color' in params.variables && !('size' in params.variables))) {
                variantProduct = productHelper.getVariantForColor(product, params.variables.color.value);
                if ('variables' in params && 'color' in params.variables && variantProduct.master) {
                    delete params.variables.color;
                    variantProduct = productHelper.getOrderableVariant(product, experienceType);
                }
            }

            if (variantProduct && variantProduct.variationModel && variantProduct.variationModel.productVariationAttributes && (variantProduct.variationModel.productVariationAttributes.length === 2 || variantProduct.variationModel.productVariationAttributes.length === 3)) {
                params.pid = variantProduct ? variantProduct.ID : params.pid;
            }
            // Adding condition to always load variation product for EGC
            if (variantProduct && variantProduct.custom.giftCard.value === 'EGIFT_CARD') {
                params.pid = variantProduct ? variantProduct.ID : params.pid;
            }
            params.variantColor = variantProduct.custom && variantProduct.custom.color ? variantProduct.custom.color : '';
            params.variantLength = variantProduct.custom && variantProduct.custom.length ? variantProduct.custom.length : '';
            params.variantSize = variantProduct.custom && variantProduct.custom.size ? variantProduct.custom.size : '';
            params.colorway = 'colorway' in variantProduct.custom && variantProduct.custom.colorway ? variantProduct.custom.colorway : '';
            // Start - PayPal related code,paypal not in scope for EMEA sites
            /* eslint-disable spellcheck/spell-checker */
            var paypalPayment = PaymentMgr.getPaymentMethod('PayPal');
            if (paypalPayment && paypalPayment.active) {
                if (!isVIP && !currentCustomer.isMemberOfCustomerGroup('CSR')) {
                    var paypalHelper = require('int_paypal_sfra/cartridge/scripts/paypal/paypalHelper');
                    var prefs = paypalHelper.getPrefs();
                    var buttonConfig;

                    buttonConfig = prefs.PP_Cart_Button_Config;
                    buttonConfig.env = prefs.environmentType;
                    buttonConfig.createPaymentUrl = URLUtils.https('Paypal-StartCheckoutFromCart', 'isAjax', 'true').toString();

                    res.setViewData({
                        paypal: {
                            prefs: prefs,
                            buttonConfig: buttonConfig
                        },
                        addressForm: server.forms.getForm('address')
                    });
                    // End - PayPal related code
                }
            }
            viewData.pageContext = {
                ns: 'product'
            };

            res.setViewData(viewData);
            /* Bazaarvoice Reviews and Ratings */
            var BV_SEO = require('bc_bazaarvoice/cartridge/scripts/lib/libCloudSEO.ds');
            var ratingPref = Site.current.getCustomPreferenceValue('bvEnableInlineRatings_C2013');
            var BVConstants = require('bc_bazaarvoice/cartridge/scripts/lib/libConstants').getConstants();
            var BVHelper = require('bc_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();

            if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
                viewData.bvScout = BVHelper.getBvLoaderUrl();
                var apiProduct = ProductMgr.getProduct(productId);
                var pid = (apiProduct.variant && !BVConstants.UseVariantID) ? apiProduct.variationModel.master.ID : apiProduct.ID;
                pid = BVHelper.replaceIllegalCharacters(pid);

                viewData.bvDisplay = {
                    rr: {
                        enabled: BVHelper.isRREnabled()
                    },
                    qa: {
                        enabled: BVHelper.isQAEnabled()
                    },
                    bvPid: pid,
                    showSummary: true
                };

                if (BVHelper.isSEOEnabled()) {
                    var seoData = BV_SEO.getBVSEO({ 'product_id': pid }); // eslint-disable-line
                    var seoReviews = seoData.reviews();
                    var seoQuestions = seoData.questions();
                    var fetchedContent = seoReviews.fetchReviewContent('getReview');

                    viewData.bvDisplay.rr.seo = {
                        aggregateRating: seoReviews.getAggregateRating(fetchedContent),
                        reviews: seoReviews.getReviews(fetchedContent)
                    };
                    viewData.bvDisplay.qa.seo = {
                        seo: {
                            content: seoQuestions.getContent()
                        }
                    };
                }

                if (ratingPref && ratingPref.value && ratingPref.value.equals('hosted')) {
                    viewData.bvDisplay.rating = {
                        enabled: true,
                        type: 'hosted'
                    };
                } else {
                    viewData.bvDisplay.rating = {
                        enabled: false,
                        type: 'none'
                    };
                }
                res.setViewData(viewData);
            }
            /* End - Bazaarvoice Reviews and Ratings */
            const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
            if (product.custom.giftCard.value === 'EGIFT_CARD') {
                res.setViewData({
                    eGiftCardEdit: params.eGiftCardEdit ? 'EGIFT_CARD' : '',
                    eGiftCardRange: giftcardHelper.getEGiftCardAmountRange()
                });
            }
            var currentBasket = BasketMgr.getCurrentOrNewBasket();
            var hasEGiftCards = false;
            if (!empty(currentBasket)) {
                hasEGiftCards = giftcardHelper.basketHasGiftCardItems(currentBasket).eGiftCards;
            }
            var start = req.querystring.start;
            var showProductPageHelperResult = productHelpers.showProductPage(params, req.pageMetaData);
            // For products that have variation attributes, only color should be selected on PDP load. (PHX-3587)
            var productPageAttributes = showProductPageHelperResult.product.variationAttributes || [];
            productPageAttributes.forEach(function (attr) {
                if (attr.id === 'size') {
                    attr.values.forEach(function (value) {
                        var attrValue = value;
                        attrValue.selected = false;
                    });
                }
            });
            var productType = showProductPageHelperResult.product.productType;
            var mastProduct = showProductPageHelperResult.product;
            if (productType === 'variant') {
                var varProduct = ProductMgr.getProduct(mastProduct.id);
                mastProduct = varProduct.masterProduct;
            }
            var productExperienceType;
            if (productType === 'variant') {
                var variantProductDetails = ProductMgr.getProduct(showProductPageHelperResult.product.id);
                var MasterProductDetails = variantProductDetails.masterProduct;
                productExperienceType = MasterProductDetails.custom && MasterProductDetails.custom.experienceType ? MasterProductDetails.custom.experienceType.value : '';
            } else {
                productExperienceType = mastProduct.custom && mastProduct.custom.experienceType ? mastProduct.custom.experienceType.value : '';
            }
            var ExperienceType = false;
            if (!empty(productExperienceType)) {
                if (productExperienceType === 'outlet' || productExperienceType === 'outletMerchOverride' || productExperienceType === 'both' || productExperienceType === 'allMerchOverride') {
                    ExperienceType = true;
                }
            }
            var variatAttrLength = variantProduct && variantProduct.variationModel && variantProduct.variationModel.productVariationAttributes && variantProduct.variationModel.productVariationAttributes.length;
            var isShopThisOutfitCTAEnable = false;
            if (Site.current.getCustomPreferenceValue('enableShopThisOutfit')) {
                isShopThisOutfitCTAEnable = productHelpers.isShopThisOutFitCTAEnable(ProductMgr.getProduct(showProductPageHelperResult.product.id), showProductPageHelperResult.product.images);
            }
            // Coremedia Parameters
            var coremediaParameters = {};
            coremediaParameters.ProductID = product.custom.style;
            if ('technologies' in mastProduct.custom && mastProduct.custom.technologies && Object.keys(mastProduct.custom.technologies).length > 0) {
                var technologies = [];
                mastProduct.custom.technologies.forEach(function (technology) {
                    technologies.push(technology.value);
                });
                coremediaParameters.technologies = technologies;
            }
            // To Display promotion level Negative Callout message for excluded product IDs on PDP.
            var promotions = showProductPageHelperResult.product.promotions;
            var CallOutMessagepromotions = productHelpers.getCallOutMessagePromotions(promotions, product);
            // To display model specifications on choose your size dropdown options.
            var selectedSwatch = showProductPageHelperResult.product.swatches && showProductPageHelperResult.product.swatches.values && showProductPageHelperResult.product.swatches.values.length > 0 && showProductPageHelperResult.product.swatches.values[0].value;
            var sizeModelSpecs;
            if (!empty(selectedSwatch)) {
                sizeModelSpecs = productHelpers.getFitModelSpecs(showProductPageHelperResult.product, selectedSwatch);
            }
            var enablePayPalCTAOnPDP = 'enablePDPPayPalCTA' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enablePDPPayPalCTA') : false;
            var isVIPOrder = false;
            if (Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience')) {
                var vipDataHelpers = require('*/cartridge/scripts/vipDataHelpers');
                isVIPOrder = vipDataHelpers.isVIPOrder(currentBasket);
            }
            if ((!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') || (isMFOItem === true)) {
                res.setStatusCode(410);
                res.render('error/notFound');
            } else {
                res.render(showProductPageHelperResult.template, {
                    product: showProductPageHelperResult.product,
                    addToCartUrl: showProductPageHelperResult.addToCartUrl,
                    cartPageUrl: URLUtils.url('Cart-Show'),
                    resources: showProductPageHelperResult.resources,
                    breadcrumbs: showProductPageHelperResult.breadcrumbs,
                    canonicalUrl: showProductPageHelperResult.canonicalUrl,
                    schemaData: showProductPageHelperResult.schemaData,
                    isVIP: isVIP,
                    isVIPOrder: isVIPOrder,
                    isRVB: isRVB,
                    rvbExpireDate: rvbExpireDate,
                    start: start,
                    breadCrumbLastPDP: req.querystring.breadCrumbLast,
                    recommendedLook: req.querystring.recommendedLook,
                    variantPid: variantProduct.ID,
                    exclusives: variantProduct.custom.exclusive,
                    coremediaParameters: Object.keys(coremediaParameters).length > 0 ? JSON.stringify(coremediaParameters) : '',
                    variatAttrLength: variatAttrLength,
                    masterProduct: mastProduct,
                    CallOutMessagepromotions: CallOutMessagepromotions,
                    variantHealthUrl: URLUtils.url('Product-VariantHealthCheck'),
                    exp: params.exp,
                    hasEGiftCards: hasEGiftCards,
                    isShopThisOutfitEnabled: isShopThisOutfitCTAEnable,
                    ExperienceType: ExperienceType,
                    sizeModelSpecs: sizeModelSpecs,
                    isEnablePdpIcons: isEnablePdpIcons,
                    enablePayPalCTAOnPDP: enablePayPalCTAOnPDP,
                    isPdpReturnExchangeMsgEnable: isPdpReturnExchangeMsgEnable
                });
            }
        } else {
            res.setStatusCode(410);
            res.render('error/notFound');
        }
    } catch (e) {
        Logger.error('Error while preparing product object: {0} {1}', e.message, e.stack);
        res.setStatusCode(410);
        res.render('error/notFound');
    }
    next();
}, pageMetaData.computedPageMetaData);

server.get('GetProductsSlides', function (req, res, next) {
    var pids = req.querystring.pids ? req.querystring.pids.split(',') : [];
    var listOfProducts = pids.map(function (pid) {
        var product = null;
        try {
            product = ProductFactory.get({ pid: pid, pview: 'tile' });
            if (product && product.id) {
                return product;
            }
        } catch (e) {
            Logger.error('error while preparing product object' + e.message);
        }
        return null;
    });

    res.render('product/productslides', {
        products: listOfProducts,
        swatches: req.querystring.swatches,
        ratings: req.querystring.ratings,
        source: req.querystring.source,
        quickview: req.querystring.quickview
    });

    next();
});

server.append('Variation', function (req, res, next) {
    var viewData = res.getViewData();
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var productContext = { product: viewData.product };
    var hasPreOrder = false;
    viewData.productCustomDescriptionHtml = renderTemplateHelper.getRenderedHtml(
        productContext,
        'product/components/productCustomDescription.isml'
    );

    if (viewData.product && viewData.product.id) {
        var productId = viewData.product.id;
        var product = ProductMgr.getProduct(productId);
        var masterProductID = !product.isMaster() && viewData.product.custom && viewData.product.custom.masterID ? viewData.product.custom.masterID : product.ID;
        var masterProduct = ProductMgr.getProduct(masterProductID);
        var variantProduct = product;
        var params = req.querystring;
        var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
        if (product.isMaster() && !('variables' in params)) {
            variantProduct = product.getVariationModel().getDefaultVariant();
            if (empty(variantProduct) || !(variantProduct.availabilityModel.orderable)) {
                variantProduct = productHelper.getOrderableVariant(product);
            }
        } else if (product.isMaster() && ('color' in params.variables && !('size' in params.variables))) {
            variantProduct = productHelper.getVariantForColor(product, params.variables.color.value);
        }
        if (variantProduct) {
            viewData.product.custom.colorway = 'colorway' in variantProduct.custom && variantProduct.custom.colorway ? variantProduct.custom.colorway : '';
            viewData.product.custom.color = 'color' in variantProduct.custom && variantProduct.custom.color ? variantProduct.custom.color : '';
        }

        var currentCustomer = req.currentCustomer.raw;
        var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
        viewData.isVIP = isVIP;
        // below code is to get model specs for the product color.
        var productObj = viewData.product;
        let selectedSwatch = productObj.swatches && productObj.swatches.values && productObj.swatches.values.length > 0 && productObj.swatches.values[0].value;
        var sizeModelSpecs;
        var chooseYourSizeOptions;
        if (!empty(selectedSwatch)) {
            sizeModelSpecs = productHelpers.getFitModelSpecs(productObj, selectedSwatch);
            chooseYourSizeOptions = productHelpers.getFitModelOptions(sizeModelSpecs);
        }
        let selectedModelSize = params.viewPreference;
        viewData.selectedModelSize = selectedModelSize && selectedModelSize.toLowerCase();
        viewData.chooseYourSizeOptions = chooseYourSizeOptions;

        var isShopThisOutfitCTAEnable = false;
        var shopThisOutfitSize;
        if (Site.current.getCustomPreferenceValue('enableShopThisOutfit')) {
            var images = viewData.product.images;
            isShopThisOutfitCTAEnable = productHelpers.isShopThisOutFitCTAEnable(product, images);
            var image = images && images.pdpMainDesktop && images.pdpMainDesktop[0] ? images.pdpMainDesktop[0] : {};
            shopThisOutfitSize = image.modelSpec && image.modelSpec.modelSize ? image.modelSpec.modelSize.toLowerCase() : '';
        }
        viewData.isShopThisOutfitEnabled = isShopThisOutfitCTAEnable;
        viewData.shopThisOutfitSize = shopThisOutfitSize;

        var pickUpInStoreEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled') && (product.custom.availableForInStorePickup !== false || variantProduct.custom.availableForInStorePickup !== false);
        var pickUpInStore = {
            actionUrl: URLUtils.url('Stores-InventorySearch', 'showMap', false, 'horizontalView', true, 'isForm', true).toString(),
            atsActionUrl: URLUtils.url('Stores-getAtsValue').toString(),
            enabled: pickUpInStoreEnabled && !isVIP
        };
        var pickUpInStoreContext = {};
        pickUpInStoreContext.pickUpInStore = pickUpInStore;
        viewData.pickUpInStoreHtml = renderTemplateHelper.getRenderedHtml(pickUpInStoreContext, 'inStorePickUp/pdpChoosePickUpInStore.isml');
        if (pickUpInStoreEnabled) {
            // get selectedStoreID
            var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
            var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
            if (preSelectedStoreCookie) {
                var storeData = JSON.parse(preSelectedStoreCookie);
                var storeID = storeData && storeData.ID;
                if (storeID) {
                    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
                    var selectedStore = storeHelpers.findStoreById(storeID);
                    var productList = [{ id: variantProduct.ID, quantity: 1 }];
                    var storeModel = { stores: [selectedStore] };
                    var storeAvailabilityObj = storeHelpers.getStoreAvailability(storeModel, productList);
                    var availabilityMessage = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] ? storeAvailabilityObj.stores[0].availabilityMessage : null;
                    pickUpInStore.productAvailability = availabilityMessage;
                    pickUpInStore.selectedStore = selectedStore;
                    pickUpInStoreContext.pickUpInStore = pickUpInStore;
                    viewData.pickUpInStoreHtml = renderTemplateHelper.getRenderedHtml(pickUpInStoreContext, 'inStorePickUp/pdpPickUpInStore.isml');
                    viewData.selectedStore = selectedStore;
                    var Resource = require('dw/web/Resource');
                    var bopisSelected = false;
                    var bopisStock = false;
                    if (storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] && 'productInStoreInventory' in storeAvailabilityObj.stores[0] && storeAvailabilityObj.stores[0].productInStoreInventory) {
                        bopisSelected = true;
                        bopisStock = true;
                    } else {
                        availabilityMessage = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
                    }
                    storeHelpers.updateSelectedStoreCookie(storeData, availabilityMessage, bopisSelected, bopisStock);
                }
            }
        }

        var list = productListHelper.getListNew(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
        var config = {
            qty: 1,
            req: req,
            type: TYPE_WISH_LIST
        };
        var isItemExistsInWishList = (list && !list.items.empty) ? productListHelper.itemExists(list, masterProductID, config) : false;
        viewData.isItemExistsInWishList = isItemExistsInWishList;
        var currentBasket = BasketMgr.getCurrentBasket();
        hasPreOrder = variantProduct.custom.isPreOrder || false;
        // Check if the product has preOrder item in basket
        if (cartHelper.hasPreOrderItems(currentBasket)) {
            hasPreOrder = true;
        }
        // check egift card in basket for paypal button enable or disable
        if (!empty(currentBasket)) {
            var giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
            var hasEGiftCards = giftcardHelper.basketHasGiftCardItems(currentBasket).eGiftCards;
            viewData.product.hasEGiftCards = hasEGiftCards;
        }

        // Identify if the varient has low inventory
        viewData.hasLowInventory = false;

        var mastCustom = masterProduct.custom;
        var isComingSoon = product.custom.exclusive.value === 'coming-soon';
        var isOOS = product.custom.exclusive.value === 'out-of-stock';
        var exceptionValue = Site.getCurrent().getCustomPreferenceValue('LowInventoryLineQtyLimitException');
        var lowInventoryLevel = Site.getCurrent().getCustomPreferenceValue('LowInventoryLevel');

        if (isComingSoon || isOOS || hasPreOrder) {
            viewData.hasLowInventory = false;
        } else if ('customerLineItemQtyLimit' in mastCustom || 'employeeLineItemQtyLimit' in mastCustom) {
            // Line Item Exception
            if ((mastCustom.customerLineItemQtyLimit === exceptionValue || mastCustom.employeeLineItemQtyLimit === exceptionValue) && viewData.product.quantities.length <= lowInventoryLevel) {
                viewData.hasLowInventory = true;
            }
        } else {
            viewData.hasLowInventory = viewData.product.quantities.length <= lowInventoryLevel;
        }
    }
    viewData.hasPreOrder = hasPreOrder;
    res.setViewData(viewData);
    next();
});

server.append('SizeChart', function (req, res, next) {
    var viewData = res.getViewData();
    var ContentMgr = require('dw/content/ContentMgr');
    var apiContent = ContentMgr.getContent(req.querystring.cid);
    viewData.sizechartTable = 'sizechartTable' in apiContent.custom ? apiContent.custom.sizechartTable : ''; // eslint-disable-line
    viewData.sizechartImageURL = 'sizechartImageURL' in apiContent.custom ? apiContent.custom.sizechartImageURL : ''; // eslint-disable-line
    viewData.sizechartFitGuide = 'sizechartFitGuide' in apiContent.custom ? apiContent.custom.sizechartFitGuide.markup : '';  // eslint-disable-line
    res.setViewData(viewData);
    next();
});

server.get('EmployeeNotification', function (req, res, next) {
    var viewData = res.getViewData();
    var showEmployeeTerms = req.querystring.showEmployeeTerms ? req.querystring.showEmployeeTerms : false;

    viewData.showEmployeeTerms = showEmployeeTerms;
    res.setViewData(viewData);

    res.render('/components/productemployeenotification');
    next();
});

server.get('ChoosePickUpInStore', function (req, res, next) {
    var viewData = res.getViewData();
    var productId = req.querystring.pid;
    var quickViewEnable = 'quickViewEnable' in req.querystring ? req.querystring.quickViewEnable : false;
    var product = ProductMgr.getProduct(productId);
    var pickUpInStoreEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled') && product.custom.availableForInStorePickup !== false;
    var currentCustomer = req.currentCustomer.raw;
    var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);

    viewData.pickUpInStore = {
        actionUrl: URLUtils.url('Stores-InventorySearch', 'showMap', false, 'horizontalView', true, 'isForm', true).toString(),
        atsActionUrl: URLUtils.url('Stores-getAtsValue').toString(),
        enabled: pickUpInStoreEnabled && !isVIP,
        quickViewEnable: quickViewEnable
    };
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
    var renderingTemplate = 'inStorePickUp/pdpChoosePickUpInStore';
    if (preSelectedStoreCookie) {
        var storeData = JSON.parse(preSelectedStoreCookie);
        var storeID = storeData && storeData.ID;
        if (storeID) {
            var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
            var selectedStore = storeHelpers.findStoreById(storeID);
            viewData.pickUpInStore.selectedStore = selectedStore;
            viewData.pickUpInStore.searchPostalCode = selectedStore && selectedStore.postalCode;
            viewData.pickUpInStore.searchRadius = storeHelpers.getDefaultRadius();

            // MAO availability check for product & store
            var productList = [{ id: product.ID, quantity: 1 }];
            var storeModel = { stores: [selectedStore] };
            var storeAvailabilityObj = storeHelpers.getStoreAvailability(storeModel, productList);
            var availabilityMessage = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] ? storeAvailabilityObj.stores[0].availabilityMessage : null;
            viewData.pickUpInStore.productAvailability = availabilityMessage;
            var Resource = require('dw/web/Resource');
            var bopisSelected = false;
            var bopisStock = false;
            if (storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] && 'productInStoreInventory' in storeAvailabilityObj.stores[0] && storeAvailabilityObj.stores[0].productInStoreInventory) {
                bopisSelected = true;
                bopisStock = true;
            } else {
                availabilityMessage = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
            }
            storeHelpers.updateSelectedStoreCookie(storeData, availabilityMessage, bopisSelected, bopisStock);
            renderingTemplate = 'inStorePickUp/pdpPickUpInStore';
        }
    }
    res.setViewData(viewData);
    res.render(renderingTemplate);
    next();
});

server.append('ShowQuickView', function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');

    var params = req.querystring;
    var product = ProductMgr.getProduct(params.pid);
    var productIDToRemove = params && params.pid ? params.pid : '';
    if (product) {
        var variantProduct = product;
        let experienceType = '';
        // experienceType for Premium/Outlet Experience
        if (params.exp === 'o') experienceType = 'outlet';
        else if (params.exp === 'p') experienceType = 'premium';

        var colorProduct = product;
        if (product.isMaster() && !('variables' in params)) {
            colorProduct = productHelper.getOrderableVariant(product, experienceType);
            variantProduct = colorProduct;
            params.variables = [];
            params.variables.color = { id: product.ID, value: colorProduct.custom.color };
        } else if (product.isMaster() && ('color' in params.variables && !('size' in params.variables))) {
            variantProduct = productHelper.getVariantForColor(product, params.variables.color.value);
        }
        if (variantProduct && variantProduct.variationModel && variantProduct.variationModel.productVariationAttributes && (variantProduct.variationModel.productVariationAttributes.length === 2 || variantProduct.variationModel.productVariationAttributes.length === 3)) {
            params.pid = variantProduct ? variantProduct.ID : params.pid;
        }
        params.variantColor = colorProduct.custom && colorProduct.custom.color ? colorProduct.custom.color : '';
        params.variantLength = variantProduct.custom && variantProduct.custom.length ? variantProduct.custom.length : '';
        params.variantSize = variantProduct.custom && variantProduct.custom.size ? variantProduct.custom.size : '';
        params.colorway = 'colorway' in colorProduct.custom && colorProduct.custom.colorway ? colorProduct.custom.colorway : '';
        product = ProductFactory.get(params);
        var viewData = res.getViewData();
        viewData.product = product;
        viewData.masterProduct = productIDToRemove;// Product ID to remove from saved section in cart page

        if (params.source && params.source === 'recommendation') {
            viewData.template = 'product/recQuickView.isml';
        }

        res.setViewData(viewData);
    }
    next();
});

server.get('LoadPaypalButton', function (req, res, next) {
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var viewData = res.getViewData();
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var currentCustomer = req.currentCustomer.raw;
    var isVIP = false;
    if (req.querystring.isVIP === 'true') {
        isVIP = true;
    }
    var params = { pid: req.querystring.pid };
    var product = ProductFactory.get(params);
    var hasPreOrder = product.custom.isPreOrder || false;
    var hasEGiftCards = false;
    // Check if the product has preOrder item in basket
    if (cartHelper.hasPreOrderItems(currentBasket)) {
        hasPreOrder = true;
    }

    // Start - PayPal related code
    /* eslint-disable spellcheck/spell-checker */
    if (!isVIP && !currentCustomer.isMemberOfCustomerGroup('CSR')) {
        var paypalHelper = require('int_paypal_sfra/cartridge/scripts/paypal/paypalHelper');
        var prefs = paypalHelper.getPrefs();
        var buttonConfig;

        buttonConfig = prefs.PP_Cart_Button_Config;
        buttonConfig.env = prefs.environmentType;
        buttonConfig.createPaymentUrl = URLUtils.https('Paypal-StartCheckoutFromCart', 'isAjax', 'true').toString();

        res.setViewData({
            paypal: {
                prefs: prefs,
                buttonConfig: buttonConfig
            },
            addressForm: server.forms.getForm('address')
        });
        // End - PayPal related code
    }
    // check egift card in basket for paypal button enable or disable
    if (!empty(currentBasket)) {
        var giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
        hasEGiftCards = giftcardHelper.basketHasGiftCardItems(currentBasket).eGiftCards;
    }

    res.setViewData(viewData);

    res.render('paypal/product/remoteIncludePaypalButton', {
        product: product,
        isVIP: isVIP,
        hasPreOrder: hasPreOrder,
        hasEGiftCards: hasEGiftCards
    });
    next();
});

server.post('DefaultSizePreferences', function (req, res, next) {
    var currentCustomer = req.currentCustomer.raw;
    var sizePreferences = null;
    if (!empty(currentCustomer.profile) && Object.prototype.hasOwnProperty.call(currentCustomer.profile.custom, 'customerSizePreferences')) {
        sizePreferences = currentCustomer.profile.custom.customerSizePreferences;
    }
    var sizePreferencesHelper = require('*/cartridge/scripts/helpers/sizePreferencesHelper');
    res.json({
        sizePreferences: sizePreferences ? sizePreferencesHelper.getSavedPrefs(req.form.pid, sizePreferences) : null
    });
    return next();
});

server.get('VariantHealthCheck', function (req, res, next) {
    var availabilityHealthHelpers = require('*/cartridge/scripts/util/availabilityHealthHelpers');
    var pid = req.querystring.pid;
    var availabilityHealth = availabilityHealthHelpers.getAvailabilityHealth(pid);
    res.json({ availabilityHealth: availabilityHealth });
    next();
});

server.get('RefreshVariationCache', function (req, res, next) {
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var params = req.querystring;
    var showProductPageHelperResult = productHelpers.showProductPage(params, req.pageMetaData);
    var product = ProductMgr.getProduct(params.pid);
    var division = product && product.custom.division ? product.custom.division : '';
    var experienceType = '';
    var variatAttrLength;

    if (product) {
        var variantProduct = product;
        // experienceType for Premium/Outlet Experience
        if (params.exp === 'o') experienceType = 'outlet';
        else if (params.exp === 'p') experienceType = 'premium';

        var availableVariant = false;
        if (product.isMaster() && product.custom.defaultColorway !== null && product.custom.defaultColorway.length > 0 && !request.httpParameters.containsKey('dwvar_' + product.ID + '_color')) { // eslint-disable-line no-undef
            var colors = product.custom.defaultColorway.split(',');
            for (var i = 0; i < colors.length; ++i) {
                var variant = productHelper.getVariantForColor(product, colors[i]);
                if (variant.isVariant() && variant.onlineFlag && variant.availabilityModel.availability !== 0 && variant.availabilityModel.orderable && variant.availabilityModel.inStock) {
                    variantProduct = variant;
                    availableVariant = true;
                    break;
                }
            }
        }

        if (!availableVariant && product.isMaster() && !('variables' in params)) {
            variantProduct = productHelper.getOrderableVariant(product, experienceType);
        } else if (!availableVariant && product.isMaster() && ('color' in params.variables && !('size' in params.variables))) {
            variantProduct = productHelper.getVariantForColor(product, params.variables.color.value);
        }

        if (variantProduct && variantProduct.variationModel && variantProduct.variationModel.productVariationAttributes && (variantProduct.variationModel.productVariationAttributes.length === 2 || variantProduct.variationModel.productVariationAttributes.length === 3)) {
            params.pid = variantProduct ? variantProduct.ID : params.pid;
        }
        params.variantColor = variantProduct.custom && variantProduct.custom.color ? variantProduct.custom.color : '';
        params.variantLength = variantProduct.custom && variantProduct.custom.length ? variantProduct.custom.length : '';
        params.variantSize = variantProduct.custom && variantProduct.custom.size ? variantProduct.custom.size : '';
        params.colorway = 'colorway' in variantProduct.custom && variantProduct.custom.colorway ? variantProduct.custom.colorway : '';
        variatAttrLength = variantProduct && variantProduct.variationModel && variantProduct.variationModel.productVariationAttributes && variantProduct.variationModel.productVariationAttributes.length;

        product = ProductFactory.get(params);
        showProductPageHelperResult = productHelpers.showProductPage(params, req.pageMetaData);
        var productPageAttributes = showProductPageHelperResult.product.variationAttributes || [];
        productPageAttributes.forEach(function (attr) {
            if (attr.id === 'size') {
                attr.values.forEach(function (value) {
                    var attrValue = value;
                    attrValue.selected = false;
                    if (attrValue.id === params.variantSize) {
                        attrValue.selected = true;
                    }
                });
            }
        });
        var viewData = res.getViewData();
        viewData.product = product;
        res.setViewData(viewData);
    }
    res.render('product/components/variationAttributeNoCache', {
        product: showProductPageHelperResult.product,
        variatAttrLength: variatAttrLength,
        experienceType: experienceType,
        division: division
    });
    next();
});

server.get('PriceOnHover', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var params = req.querystring;
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var showProductPageHelperResult = productHelpers.showProductPage(params, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;
    var mastProduct = showProductPageHelperResult.product;
    if (productType === 'variant') {
        var varProduct = ProductMgr.getProduct(mastProduct.id);
        mastProduct = varProduct.masterProduct;
    }
    var priceHelper = require('*/cartridge/scripts/helpers/pricing');
    var variationsPriceJSONArray = [];
    for (var k = 0; k < showProductPageHelperResult.product.variationAttributes.length; k++) {
        if (showProductPageHelperResult.product.variationAttributes[k].id === 'color') {
            var colorArray = showProductPageHelperResult.product.variationAttributes[k].values;
            for (var j = 0; j < colorArray.length; j++) {
                var variationProd = productHelper.getVariantForColor(mastProduct, colorArray[j].id);
                var variantionProduct = ProductFactory.get({ pid: variationProd.ID });
                var context = {
                    price: variantionProduct.price
                };
                var variantPrice = priceHelper.renderHtml(priceHelper.getHtmlContext(context));
                var variationPriceObj = productHelper.variationPriceColorJSON(variationProd, colorArray[j], variantPrice);
                variationsPriceJSONArray.push(variationPriceObj);
            }
        }
    }
    res.json({ variationsPrice: JSON.stringify(variationsPriceJSONArray) });
    next();
});

server.get('RecommendationTiles', function (req, res, next) {
    var productCollection = new dw.util.ArrayList();
    var currentBasketItems = BasketMgr.getCurrentBasket();
    var productLineItems = currentBasketItems ? currentBasketItems.getAllProductLineItems() : '';
    var productID = req.querystring.pid;
    var product = ProductMgr.getProduct(productID);
    productCollection.add(product);
    for (var j = 0; j < productLineItems.length; j++) {
        // Gather shopping bag products to pass to Einstein. Limit of 5 items.
        if (j >= 5) {
            break;
        }
        if (!empty(productLineItems[j].product)) {
            productCollection.add(productLineItems[j].product);
        }
    }
    res.render('product/components/confirmationModalRecTiles', {
        productCollection: productCollection
    });

    next();
});

server.get('ShopThisOutfit', function (req, res, next) {
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
    var productId = req.querystring.pid;
    var selectedColorId = req.querystring.selectedColor;
    var productObj = ProductMgr.getProduct(productId);
    var viewPreference = req.querystring.selectedSize ? req.querystring.selectedSize : 'sm';
    var materialCodes = productHelpers.getMaterialCode(productObj, selectedColorId, viewPreference);
    var modalSKUs = [];
    if (!empty(materialCodes) && materialCodes.length > 0) {
        var PdpMasterProd = productObj.isVariant() ? productObj.getMasterProduct() : productObj;
        materialCodes.forEach(function (materialCode) {
            var modelProduct = ProductMgr.getProduct(materialCode.sku);
            var modelMasterProd = modelProduct && modelProduct.isVariant() ? modelProduct.getMasterProduct() : modelProduct;
            if (modelMasterProd && modelMasterProd.ID !== PdpMasterProd.ID && modelMasterProd.availabilityModel.inStock) {
                var modelSKUColorObj = {};
                modelSKUColorObj.sku = materialCode.sku;
                modelSKUColorObj.color = materialCode.color;
                modalSKUs.push(modelSKUColorObj);
            }
        });
    }
    res.render('product/components/shopThisOutfitModal', {
        shopTheLookProducts: modalSKUs
    });
    return next();
});

module.exports = server.exports();
