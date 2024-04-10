'use strict';
/* eslint-disable block-scoped-var  */

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site');
const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
var URLUtils = require('dw/web/URLUtils');
const TYPE_WISH_LIST = require('dw/customer/ProductList').TYPE_WISH_LIST;
const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
const eGiftCard = 'EGIFT_CARD';
var bopisEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
const promotionHelper = require('*/cartridge/scripts/util/promotionHelper');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.extend(module.superModule);

server.replace(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var CartModel = require('*/cartridge/models/cart');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
        var BVHelper = require('*/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
        var ContentMgr = require('dw/content/ContentMgr');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

        var currentBasket = BasketMgr.getCurrentBasket();
        var basketHasGiftCardItems = giftcardHelper.basketHasGiftCardItems(currentBasket);
        var reportingURLs;
        var currentCustomer = req.currentCustomer.raw;
        var shopRunnerSignedIn = null;

        var isEmployee = !empty(currentCustomer.profile) && 'isEmployee' in currentCustomer.profile.custom && currentCustomer.profile.custom.isEmployee;
        var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
        var hasPreOrder = false;
        // delete session value for back button scenario
        delete session.custom.internalnavigation;
        // Check if the product has preOrder item in basket
        if (cartHelper.hasPreOrderItems(currentBasket)) {
            hasPreOrder = true;
        }

        res.setViewData({
            orderContainsPreorder: hasPreOrder,
            basketHasGiftCardItems: basketHasGiftCardItems
        });

        // if Bopis cookie does not have store details then remove bopis shipment and set default shipment
        var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
        var preSelectedStoreCookie = storeHelpers.getPreSelectedStoreCookie();
        var noStoreAvailableInCookie = empty(preSelectedStoreCookie) || (preSelectedStoreCookie && preSelectedStoreCookie.noStoreAvailable);
        // if user is a borderfree user then moving items from bopis shipment to default shipment
        var isBorderFreeUser = cartHelper.isBorderFreeUser(req);

        if (currentBasket) {
            if (bopisEnabled && !noStoreAvailableInCookie && !isBorderFreeUser) {
                var changeAllItemsStore = req.querystring.changeAllItemsStore;
                var cartProdPid = req.querystring.cartProdPid;
                var cartProdUUID = req.querystring.cartProdUUID;
                cartHelper.ensureShippingAddressforStore(currentBasket);
                cartHelper.ensureBOPISShipment(currentBasket);
                cartHelper.defaultShipToAddressIfAny(currentBasket);
                cartHelper.mergeLineItems(currentBasket);
                var storeObj = cartHelper.bopisLineItemInventory(currentBasket, changeAllItemsStore, cartProdPid, cartProdUUID);
            } else {
                var hasBOPISshipment = cartHelper.basketHasBOPISShipmet(currentBasket);
                if (hasBOPISshipment) {
                    // If BOPIS is disabled then merging the shipments to default
                    var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
                    instorePickupStoreHelpers.updateToShipToAddressShipment(currentBasket, req);
                }
            }
            var basketHasOnlyBopis = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers').basketHasOnlyBOPISProducts(currentBasket.shipments);
            res.setViewData({
                basketHasOnlyBopis: basketHasOnlyBopis
            });
            COHelpers.copyCustomerAddressToBasket(currentBasket, currentCustomer);
            var PaymentMgr = require('dw/order/PaymentMgr');
            Transaction.wrap(function () {
                if (currentBasket.currencyCode !== req.session.currency.currencyCode) {
                    currentBasket.updateCurrency();
                }
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                if (basketHasGiftCardItems && basketHasGiftCardItems.onlyEGiftCards) {
                    giftcardHelper.updateGiftCardShipments(currentBasket);
                    giftcardHelper.removeEmptyShipments(currentBasket);
                }
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
            // Adding required code to display PayPal buttons on cart page.
            // Start - PayPal related code paypal not in scope for EMEA sites
            /* eslint-disable spellcheck/spell-checker */
            var paypalPayment = PaymentMgr.getPaymentMethod('PayPal');
            if (paypalPayment && paypalPayment.active && !isVIP) {
                var paypalHelper = require('int_paypal_sfra/cartridge/scripts/paypal/paypalHelper');
                var prefs = paypalHelper.getPrefs();
                var customerBillingAgreement = paypalHelper.getCustomerBillingAgreement(currentBasket.getCurrencyCode());
                var isAddressExistForBillingAgreementCheckout = !!customerBillingAgreement.getDefaultShippingAddress();
                // In this case no need shipping address
                if (currentBasket.getDefaultShipment().productLineItems.length <= 0) {
                    isAddressExistForBillingAgreementCheckout = true;
                }
                var buttonConfig;
                if (customerBillingAgreement.hasAnyBillingAgreement && prefs.PP_BillingAgreementState !== 'DoNotCreate') {
                    buttonConfig = prefs.PP_Cart_Button_Config;
                    buttonConfig.env = prefs.environmentType;
                    buttonConfig.billingAgreementFlow = {
                        startBillingAgreementCheckoutUrl: URLUtils.https('Paypal-StartBillingAgreementCheckout').toString(),
                        isShippingAddressExist: isAddressExistForBillingAgreementCheckout
                    };
                } else {
                    buttonConfig = prefs.PP_Cart_Button_Config;
                    buttonConfig.env = prefs.environmentType;
                    buttonConfig.createPaymentUrl = URLUtils.https('Paypal-StartCheckoutFromCart', 'isAjax', 'true').toString();
                }
                res.setViewData({
                    paypal: {
                        prefs: prefs,
                        buttonConfig: buttonConfig
                    },
                    addressForm: server.forms.getForm('address'),
                    paypalCalculatedCost: currentBasket.totalGrossPrice,
                    canonicalUrl: URLUtils.abs('Cart-Show')
                });
                // End - PayPal related code
            }
            var shopRunnerEnabled = Site.getCurrent().getCustomPreferenceValue('sr_enabled');
            if (shopRunnerEnabled) {
                let shopRunnerToken = session.custom.srtoken;
                // eslint-disable-next-line
                shopRunnerSignedIn = shopRunnerToken ? true : false;
            }
            if (Site.getCurrent().getCustomPreferenceValue('isUrgentMessageEnabled') && currentBasket.productLineItems.length) {
                cartHelper.getATSvalue(currentBasket.productLineItems);
            }
        }
        if (currentBasket && currentBasket.allLineItems.length) {
            reportingURLs = reportingUrlsHelper.getBasketOpenReportingURLs(currentBasket);
        }
        // Get the wishlist products
        var list = productListHelper.getListNew(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
        var WishlistModel = require('*/cartridge/models/productList');
        var wishlistModel = new WishlistModel(
            list,
            {
                type: 'wishlist',
                publicView: req.querystring.publicView || false,
                pageSize: list ? list.items.length : 0,
                pageNumber: req.querystring.pageNumber || 1,
                sortRule: 'NewestAdded',
                pageType: 'cart'
            }
        ).productList;
        // Copy eGift Card details from list to Wishlist
        if (!empty(list)) {
            giftcardHelper.copyeGiftCardFromListToWishlist(list, wishlistModel);
        }
        res.setViewData({
            reportingURLs: reportingURLs,
            pageContext: {
                ns: 'cart'
            },
            isEmployee: isEmployee,
            isVIP: isVIP,
            hasPreOrder: hasPreOrder,
            shopRunnerSignedIn: shopRunnerSignedIn,
            wishlistItemArray: wishlistModel ? cartHelper.getLimitedWishlistItems(wishlistModel.items, 10) : null
        });
        var basketModel;
        if (currentBasket) {
            var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'CartView');
            var validatedBopisProducts = validationHelpers.validateBOPISProductsInventory(currentBasket, 'BOPIS');
            basketModel = new CartModel(currentBasket);

            if (!empty(basketModel.freeShippingBar) && basketModel.freeShippingBar.isFreeShippingBarEnabled) {
                var discounts = basketModel.totals.discounts;
                var promoShip = discounts.find(function (discount) {
                    if (discount.promotionClass === 'SHIPPING') {
                        return true;
                    }

                    return false;
                });

                basketModel.freeShippingBar.promoShip = promoShip;
            }

            if (validatedProducts && validatedProducts.availabilityError) {
                availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, basketModel);
                availabilityHelper.getInvalidItems(basketModel, validatedProducts);
            } else if (validatedProducts) {
                availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, basketModel);
            }
            if (validatedBopisProducts && !validatedBopisProducts.availabilityError) {
                availabilityHelper.updateLineItemQuantityOption(validatedBopisProducts.lineItemQtyList, basketModel);
            }
            var productCollection = new dw.util.ArrayList();
            var productLineItems = currentBasket.getAllProductLineItems();
            for (var i = 0; i < productLineItems.length; i++) {
                // Gather shopping bag products to pass to Einstein. Limit of 5 items.
                if (i >= 5) {
                    break;
                }
                if (!empty(productLineItems[i].product)) {
                    productCollection.add(productLineItems[i].product);
                }
            }
            res.setViewData({
                productCollection: productCollection
            });
        }
        var hasGiftCards = basketHasGiftCardItems.giftCards;
        if (isVIP && hasGiftCards) {
            basketModel.valid.error = true;
            basketModel.valid.message = Resource.msg('error.vip.items', 'cart', null);
        }
        var viewData = res.getViewData();

        if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
            viewData.bvScout = BVHelper.getBvLoaderUrl();
        }
        var contentObj = ContentMgr.getContent('cart-page-meta');
        if (contentObj) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
        }
        res.setViewData({
            cartRoute: 'hideBanner'
        });
        if (bopisEnabled && currentBasket) {
            cartHelper.defaultShipToAddressIfAny(currentBasket);
            var PropertyComparator = require('dw/util/PropertyComparator');
            var shipmentsSorted = new dw.util.ArrayList(currentBasket.shipments);
            var comparatorRule = new PropertyComparator('custom.fromStoreId', null);
            shipmentsSorted.sort(comparatorRule);
            res.setViewData({
                bopisShipments: shipmentsSorted,
                shipmentsLength: currentBasket.shipments.length,
                storeName: req.querystring.storeName,
                storeObj: storeObj,
                isBorderFreeUser: isBorderFreeUser
            });
        }
        res.render('cart/cart', basketModel);
        next();
    }, pageMetaData.computedPageMetaData);

server.append('RemoveProductLineItem', function (req, res, next) {
    var viewData = res.getViewData();
    var Resource = require('dw/web/Resource');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var hasGiftCards = giftcardHelper.basketHasGiftCardItems(currentBasket).giftCards;
    var currentCustomer = req.currentCustomer.raw;
    var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(currentCustomer.profile) && 'vipAccountId' in currentCustomer.profile.custom && !empty(currentCustomer.profile.custom.vipAccountId);
    viewData.isVIP = isVIP;
    if (!empty(viewData.basket) && viewData.basket.numItems === 0) {
        var emptyCartContentAsset = dw.content.ContentMgr.getContent('cart-no-items-asset');
        viewData.emptyCartMsg = Resource.msg('empty.cart.msg', 'cart', null);
        viewData.emptyCartContent = (emptyCartContentAsset && emptyCartContentAsset.online && !empty(emptyCartContentAsset.custom.body)) ? emptyCartContentAsset.custom.body.markup : '';
    }
    if (isVIP && hasGiftCards) {
        viewData.basket.valid.error = true;
        viewData.basket.valid.message = Resource.msg('error.vip.items', 'cart', null);
    }
    res.setViewData(viewData);
    next();
});

// eslint-disable-next-line consistent-return
server.get('ShowCartValidationPopUp', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var result = {};
    var currentBasket = BasketMgr.getCurrentBasket();
    var executeType;
    var allProductLineItems;
    var template;
    var renderedTemplate;
    try {
        if (currentBasket) {
            if (currentBasket.getAllProductLineItems().getLength() > 0) {
                executeType = 'bfBeforeSendBF';
                allProductLineItems = currentBasket.getAllProductLineItems();
                COHelpers.bfOrdersMissingProductDetails(allProductLineItems, executeType);
            }
            var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'CartView');
            if (validatedProducts && validatedProducts.availabilityError) {
                // eslint-disable-next-line
                var hasPartiallyRemoved = validatedProducts.partiallyRemoved && validatedProducts.partiallyRemoved.length > 0 ? true : false;
                // eslint-disable-next-line
                var hasFullyRemoved = validatedProducts.fullyRemoved && validatedProducts.fullyRemoved.length > 0 ? true : false;
                var fullyRemoveItems = [];
                for (var i = 0; i < validatedProducts.fullyRemoved.length; i++) {
                    var fullyRemoveItem = validatedProducts.fullyRemoved[i];
                    var itemData = {
                        lineItemUUID: fullyRemoveItem.lineItem.UUID,
                        pid: fullyRemoveItem.id
                    };
                    fullyRemoveItems.push(itemData);
                }
                result = {
                    hasPartiallyRemoved: hasPartiallyRemoved,
                    availabilityError: validatedProducts.availabilityError,
                    hasFullyRemoved: hasFullyRemoved,
                    fullyRemoveItems: fullyRemoveItems
                };

                template = 'checkout/cart/availabilityModal.isml';
                renderedTemplate = renderTemplateHelper.getRenderedHtml(result, template);
                res.json({
                    error: true,
                    renderedTemplate: renderedTemplate,
                    modalId: 'cartAvailabilityModal'
                });
                return next();
            }

            if (currentBasket.getTotalGrossPrice().getValue() === 0) {
                template = 'checkout/cart/noChargeOrderModal.isml';
                renderedTemplate = renderTemplateHelper.getRenderedHtml({}, template);
                res.json({
                    error: true,
                    renderedTemplate: renderedTemplate,
                    modalId: 'noChargeOrderModal'
                });
                return next();
            }

            res.json({
                error: false,
                redirectURL: URLUtils.url('Checkout-Begin').toString()
            });
        } else {
            res.json({
                error: false,
                redirectURL: URLUtils.url('Cart-Show').toString()
            });
        }
    } catch (e) {
        res.json({
            error: true,
            redirectURL: URLUtils.url('Checkout-Begin').toString()
        });
    }
    next();
});

server.get('RemoveProductLineItems', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    try {
        if (currentBasket) {
            var queryString = req.querystring && req.querystring.fullyRemoveItems ? req.querystring.fullyRemoveItems : '';
            var fullyRemoveItems = JSON.parse(queryString);
            for (var i = 0; i < fullyRemoveItems.length; i++) {
                var fullyRemoveItem = fullyRemoveItems[i];
                var existinglineitems = currentBasket.getProductLineItems(fullyRemoveItem.pid);
                if (existinglineitems.length > 0) {
                    // eslint-disable-next-line
                    collections.forEach(existinglineitems, function (existinglineitem) {
                        if (existinglineitem.UUID === fullyRemoveItem.lineItemUUID) {
                            Transaction.wrap(function () {
                                currentBasket.removeProductLineItem(existinglineitem);
                            });
                        }
                    });
                }
            }
        }
        res.json({
            error: false,
            redirectURL: URLUtils.url('Cart-Show').toString()
        });
    } catch (e) {
        res.json({
            error: true,
            redirectURL: URLUtils.url('Checkout-Begin').toString()
        });
    }
    next();
});

server.get('SaveAllForLater', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    try {
        if (currentBasket) {
            var queryString = req.querystring && req.querystring.fullyRemoveItems ? req.querystring.fullyRemoveItems : '';
            var fullyRemoveItems = JSON.parse(queryString);
            var productList = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
            for (var i = 0; i < fullyRemoveItems.length; i++) {
                var fullyRemoveItem = fullyRemoveItems[i];
                var existinglineitems = currentBasket.getProductLineItems(fullyRemoveItem.pid);
                if (existinglineitems.length > 0) {
                    // eslint-disable-next-line
                    Transaction.wrap(function () {
                        collections.forEach(existinglineitems, function (productLineItem) {
                            if (productLineItem.UUID === fullyRemoveItem.lineItemUUID) {
                                var listItem = productList.createProductItem(productLineItem.product);
                                if (!empty(listItem) && listItem.product.custom.giftCard.value === 'EGIFT_CARD') {
                                    listItem.custom.gcRecipientName = productLineItem.custom.gcRecipientName;
                                    listItem.custom.gcRecipientEmail = productLineItem.custom.gcRecipientEmail;
                                    listItem.custom.gcFrom = productLineItem.custom.gcFrom;
                                    listItem.custom.gcDeliveryDate = productLineItem.custom.gcDeliveryDate;
                                    listItem.custom.gcMessage = productLineItem.custom.gcMessage;
                                    listItem.custom.gcAmount = productLineItem.priceValue;
                                }
                                currentBasket.removeProductLineItem(productLineItem);
                            }
                        });
                    });
                }
            }
        }
        res.json({
            error: false,
            redirectURL: URLUtils.url('Cart-Show').toString()
        });
    } catch (e) {
        res.json({
            error: true,
            redirectURL: URLUtils.url('Checkout-Begin').toString()
        });
    }
    next();
});

// eslint-disable-next-line consistent-return
server.get('SaveForLater', function (req, res, next) {
    var pidToRemove = req.querystring.pid;
    var uuidToRemove = req.querystring.uuid;
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var productLineItems = currentBasket ? currentBasket.getProductLineItems(pidToRemove) : null;
    var productList = productListHelper.getCurrentOrNewList(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
    Transaction.wrap(function () {
        for (var i = 0; i < productLineItems.length; i++) {
            var productLineItem = productLineItems[i];
            if (productLineItem.UUID === uuidToRemove) {
                var listItem = productList.createProductItem(productLineItem.product);
                if (!empty(listItem)) {
                    listItem.custom.wishlistedFromCart = true;
                    if (listItem.product.custom.giftCard.value === 'EGIFT_CARD') {
                        listItem.custom.gcRecipientName = productLineItem.custom.gcRecipientName;
                        listItem.custom.gcRecipientEmail = productLineItem.custom.gcRecipientEmail;
                        listItem.custom.gcFrom = productLineItem.custom.gcFrom;
                        listItem.custom.gcDeliveryDate = productLineItem.custom.gcDeliveryDate;
                        listItem.custom.gcMessage = productLineItem.custom.gcMessage;
                        listItem.custom.gcAmount = productLineItem.priceValue;
                    }
                }
            }
        }
        // bonusProductsUUIDs = cartHelper.removePLItem(req, currentBasket, bonusProductsUUIDs);
    });

    var WishlistModel = require('*/cartridge/models/productList');
    var wishlistModel = new WishlistModel(
        productList, {
            type: 'wishlist',
            publicView: req.querystring.publicView || false,
            pageSize: productList.items.length,
            pageNumber: req.querystring.pageNumber || 1,
            sortRule: 'NewestAdded',
            pageType: 'cart'
        }
    ).productList;
    // Copy eGift Card details from list to Wishlist
    if (!empty(productList)) {
        giftcardHelper.copyeGiftCardFromListToWishlist(productList, wishlistModel);
    }
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var context = {
        wishlistItemArray: cartHelper.getLimitedWishlistItems(wishlistModel.items, 10),
        error: false,
        template: 'cart/saveForLater.isml'
    };

    res.setViewData(context);
    var viewData = res.getViewData();
    res.json({
        renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template)
    });
    next();
});

server.get('RemoveFromSaved', function (req, res, next) {
    var pidToRemove = req.querystring.pid;
    var uuidToRemove = req.querystring.uuid;
    var Transaction = require('dw/system/Transaction');
    var wishlist = productListHelper.getList(req.currentCustomer.raw, {
        type: TYPE_WISH_LIST
    });
    Transaction.wrap(function () {
        if (wishlist != null) {
            var wishlistItems = wishlist.getItems();
            collections.forEach(wishlistItems, function (wishlistItem) {
                if (wishlistItem.productID === pidToRemove || wishlistItem.UUID === uuidToRemove) {
                    customer.getProductLists(TYPE_WISH_LIST)[0].removeItem(wishlistItem);
                }
            });
        }
    });

    wishlist = productListHelper.getList(req.currentCustomer.raw, {
        type: TYPE_WISH_LIST
    });
    // Get the wishlist products
    var WishlistModel = require('*/cartridge/models/productList');
    var wishlistModel = new WishlistModel(
        wishlist,
        {
            type: 'wishlist',
            publicView: req.querystring.publicView || false,
            pageSize: wishlist ? wishlist.items.length : 0,
            pageNumber: req.querystring.pageNumber || 1,
            sortRule: 'NewestAdded',
            pageType: 'cart'
        }).productList;
    // Copy eGift Card details from list to Wishlist
    if (!empty(wishlist)) {
        giftcardHelper.copyeGiftCardFromListToWishlist(wishlist, wishlistModel);
    }
    var listIsEmpty = wishlist ? wishlist.items.empty : false;
    if (listIsEmpty && !req.currentCustomer.raw.authenticated && !req.currentCustomer.raw.registered) {
        productListHelper.removeList(req.currentCustomer.raw, wishlist, null);
    }
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var isWishListItem;
    if (currentBasket) {
        wishlist = productListHelper.getList(req.currentCustomer.raw, {
            type: TYPE_WISH_LIST
        });
        isWishListItem = wishlist ? cartHelper.isListItemExistInBasket(currentBasket, [wishlist]) : false; // returns a boolean whether item exists in whislist or not
        var basketModel = new CartModel(currentBasket);
        var hasOnlyItem = basketModel.numItems === 1;
        var hasPreOrder = false;
        if (cartHelper.hasPreOrderItems(currentBasket)) {
            hasPreOrder = true;
        }
        // update additional availability attributes
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
        var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'CartView');
        if (validatedProducts && validatedProducts.availabilityError) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, basketModel);
            availabilityHelper.getInvalidItems(basketModel, validatedProducts);
        } else if (validatedProducts) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, basketModel);
        }

        var context = {
            error: false,
            basket: basketModel,
            hasPreOrder: hasPreOrder,
            cartQuantity: currentBasket.productQuantityTotal,
            actionUrls: basketModel.actionUrls,
            lineItems: basketModel.items,
            hasOnlyItem: hasOnlyItem,
            isWishListItem: isWishListItem,
            CurrentCustomer: req.currentCustomer.raw,
            saveLaterAddToCartTemplate: 'cart/productCard/saveLaterAddToCart.isml',
            saveForLaterTemplate: 'cart/saveForLater.isml',
            isBopisEnabled: bopisEnabled
        };
        var saveForLaterContext = {
            wishlistItemArray: wishlistModel ? cartHelper.getLimitedWishlistItems(wishlistModel.items, 10) : null
        };

        res.setViewData(context);
        var viewData = res.getViewData();
        res.json({
            renderedTemplate: renderTemplateHelper.getRenderedHtml(saveForLaterContext, viewData.saveForLaterTemplate),
            cartItemsRenderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.saveLaterAddToCartTemplate)
        });
    }
    next();
});

server.append('MiniCartShow', function (req, res, next) {
    var viewData = res.getViewData();
    var BasketMgr = require('dw/order/BasketMgr');
    var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    if (viewData) {
        var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'MiniCart');
        if (validatedProducts && validatedProducts.availabilityError) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, viewData);
            availabilityHelper.getInvalidItems(viewData, validatedProducts);
        } else if (validatedProducts) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, viewData);
        }
    }
    // Read items from viewData and reverse if length is greater than 1.
    if ('items' in viewData && viewData.items.length > 1) {
        var lineItems = viewData.items;
        var pliList = new dw.util.ArrayList(lineItems);
        // order of items is reverse in case of mini cart display
        pliList.reverse();
        viewData.items = pliList;
        res.setViewData(viewData);
    }
    next();
});

server.append('RemoveCouponLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderModel = require('*/cartridge/models/order');
    var AccountModel = require('*/cartridge/models/account');
    var Locale = require('dw/util/Locale');
    var currentBasket = BasketMgr.getCurrentBasket();
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );
    res.json({
        order: basketModel,
        customer: new AccountModel(req.currentCustomer)
    });
    next();
});

/**
 * Cart-AddCoupon : The Cart-AddCoupon endpoint is responsible for adding a coupon to a basket
 * @name Base/Cart-AddCoupon
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {middleware} - csrfProtection.validateAjaxRequest
 * @param {querystringparameter} - couponCode - the coupon code to be applied
 * @param {querystringparameter} - csrf_token - hidden input field csrf token
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.replace(
    'AddCoupon',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Resource = require('dw/web/Resource');
        var Locale = require('dw/util/Locale');
        var secureEncoder = require('dw/util/SecureEncoder');
        var Transaction = require('dw/system/Transaction');
        var CartModel = require('*/cartridge/models/cart');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                errorMessage: Resource.msg('error.add.coupon', 'cart', null)
            });
            return next();
        }

        var error = false;
        var errorMessage;

        var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();

        try {
            Transaction.wrap(function () {
                return currentBasket.createCouponLineItem(
                    req.querystring.couponCode,
                    true
                );
            });
        } catch (e) {
            error = true;
            var errorCodes = {
                COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
                COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
                COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon',
                COUPON_DISABLED: 'error.unable.to.add.coupon',
                REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED:
                    'error.unable.to.add.coupon',
                NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon',
                default: 'error.unable.to.add.coupon'
            };

            var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
            var currentLocale = Locale.getLocale(req.locale.id);

            if (currentLocale.country === 'MX') {
                errorMessage = Resource.msgf(errorMessageKey, 'cart', null, secureEncoder.forHtmlContent(req.querystring.couponCode));
            } else {
                errorMessage = Resource.msg(errorMessageKey, 'cart', null);
            }
        }

        if (error) {
            res.json({
                error: error,
                errorMessage: errorMessage
            });
            return next();
        }

        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var allLineItems = currentBasket.allProductLineItems;
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

        var urlObject = {
            url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
            configureProductstUrl: URLUtils.url(
                'Product-ShowBonusProducts'
            ).toString(),
            addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
        };

        collections.forEach(allLineItems, function (pli) {
            var newBonusDiscountLineItem = cartHelper.getNewBonusDiscountLineItem(
                currentBasket,
                previousBonusDiscountLineItems,
                urlObject,
                pli.UUID
            );

            if (newBonusDiscountLineItem) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });

        var basketModel = new CartModel(currentBasket);

        res.json(basketModel);
        return next();
    }
);

server.append('AddCoupon', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderModel = require('*/cartridge/models/order');
    var AccountModel = require('*/cartridge/models/account');
    var Locale = require('dw/util/Locale');
    const viewData = res.getViewData();
    const couponCode = req.querystring.couponCode;
    const analytics = {
        couponCode: couponCode,
        errorMessage: viewData.errorMessage
    };
    if (!viewData.error) {
        const promotions = promotionHelper.getBasketPromotionsByCouponCode(couponCode);
        analytics.promotions = (promotions && promotions.length)
            ? promotions.map(function (p) {
                return {
                    ID: p.ID,
                    name: p.name,
                    promotionClass: p.promotionClass,
                    coupons: [{
                        ID: p.coupons[0] && p.coupons[0].ID
                    }]
                };
            })
            : [];
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );
    var gcObj = giftcardHelper.orderTotalGCCouponAmount(currentBasket);
    var giftCardFormData = giftcardHelper.giftCardFormData(res.viewData.csrf);
    var couponLineItem = currentBasket.getCouponLineItem(couponCode);
    var couponApplied = couponLineItem ? couponLineItem.applied : false;
    res.json({
        order: basketModel,
        customer: new AccountModel(req.currentCustomer),
        analytics: analytics,
        nonGCPaymentRemainingBalance: gcObj.nonGCPaymentRemainingBalance,
        orderTotalRedeemed: gcObj.orderTotalRedeemed,
        gcAmount: gcObj.gcAmount,
        gcUUID: gcObj.gcUUID,
        gcResults: giftCardFormData.gcResults,
        renderedTemplate: giftCardFormData.templateContent,
        couponApplied: couponApplied
    });
    next();
});

server.append('RemoveCouponLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var gcObj = giftcardHelper.orderTotalGCCouponAmount(currentBasket);
    var giftCardFormData = giftcardHelper.giftCardFormData(res.viewData.csrf);
    res.json({
        nonGCPaymentRemainingBalance: gcObj.nonGCPaymentRemainingBalance,
        orderTotalRedeemed: gcObj.orderTotalRedeemed,
        gcAmount: gcObj.gcAmount,
        gcUUID: gcObj.gcUUID,
        gcResults: giftCardFormData.gcResults,
        renderedTemplate: giftCardFormData.templateContent
    });
    next();
});

server.replace('UpdateQuantity', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var changeAllItemsStore = false;

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var productId = req.querystring.pid;
    var updateQuantity = parseInt(req.querystring.quantity, 10);
    var uuid = req.querystring.uuid;
    var productLineItems = currentBasket.productLineItems;
    var matchingLineItem = collections.find(productLineItems, function (item) {
        return item.productID === productId && item.UUID === uuid;
    });
    var availableToSell = 0;

    var totalQtyRequested = 0;
    var qtyAlreadyInCart = 0;
    var minOrderQuantity = 0;
    var perpetual = false;
    var canBeUpdated = false;
    var bundleItems;
    var bonusDiscountLineItemCount = currentBasket.bonusDiscountLineItems.length;
    var storeId = null;
    var result = [];
    var maoAvaialability = null;
    var maoBOPISAvailability = null;
    // MAO Real-Time Inventory
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
    if (isMAOEnabled && currentBasket) {
        var Availability = require('int_mao/cartridge/scripts/availability/MAOAvailability');
        const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
        var isCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled('EditCart');
        if (realTimeInventoryCallEnabled && isCheckPointEnabled) {
            var items = AvailabilityHelper.getSKUS(currentBasket);
            if (!empty(items)) {
                maoAvaialability = Availability.getMaoAvailability(items);
            }

            var itemsBOPIS = AvailabilityHelper.getInstorePickUpSKUS(currentBasket);
            if (!empty(itemsBOPIS && itemsBOPIS.items && itemsBOPIS.locations) && itemsBOPIS.items.length > 0) {
                maoBOPISAvailability = Availability.getMaoAvailability(itemsBOPIS.items, itemsBOPIS.locations);
            }
        }
    }

    // Availability check
    if (matchingLineItem) {
        if (matchingLineItem.product.bundle) {
            bundleItems = matchingLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                var quantityToUpdate = updateQuantity *
                    matchingLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell || perpetual) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            if (matchingLineItem.shipment.custom && matchingLineItem.shipment.custom.fromStoreId) {
                storeId = matchingLineItem.shipment.custom.fromStoreId;
                var StoreMgr = require('dw/catalog/StoreMgr');
                var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
                var store = StoreMgr.getStore(storeId);
                var inventoryListId = store && ('inventoryListId' in store.custom) ? store.custom.inventoryListId : null;
                if (inventoryListId) {
                    var storeInventory = ProductInventoryMgr.getInventoryList(inventoryListId);
                    if (storeInventory && storeInventory.getRecord(productId)) {
                        availableToSell = validationHelpers.getLineItemInventory(matchingLineItem.product, true, maoBOPISAvailability, matchingLineItem.shipment.custom.fromStoreId);
                        perpetual = storeInventory.getRecord(productId).perpetual;
                    }
                }
            } else {
                availableToSell = validationHelpers.getLineItemInventory(matchingLineItem.product, true, maoAvaialability, null);
                perpetual = matchingLineItem.product.availabilityModel.inventoryRecord ? matchingLineItem.product.availabilityModel.inventoryRecord.perpetual : null;
            }
            qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                matchingLineItem.UUID,
                storeId
            );
            if (bopisEnabled) {
                totalQtyRequested = updateQuantity;
            } else {
                totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            }
            minOrderQuantity = matchingLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell || perpetual) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    if (canBeUpdated || bopisEnabled) {
        Transaction.wrap(function () {
            if (matchingLineItem) {
                matchingLineItem.setQuantityValue(updateQuantity);
            }

            var previousBounsDiscountLineItems = collections.map(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                return bonusDiscountLineItem.UUID;
            });

            basketCalculationHelpers.calculateTotals(currentBasket);
            if (currentBasket.bonusDiscountLineItems.length > bonusDiscountLineItemCount) {
                var prevItems = JSON.stringify(previousBounsDiscountLineItems);

                collections.forEach(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                    if (prevItems.indexOf(bonusDiscountLineItem.UUID) < 0) {
                        bonusDiscountLineItem.custom.bonusProductLineItemUUID = matchingLineItem ? matchingLineItem.UUID : null; // eslint-disable-line no-param-reassign

                        if (matchingLineItem) {
                            matchingLineItem.custom.bonusProductLineItemUUID = 'bonus';
                            matchingLineItem.custom.preOrderUUID = matchingLineItem.UUID;
                        }
                    }
                });
            }
        });
    }

    var hasInventoryError = false;
    // This statement will set the ATS value of the product, so in app_storefront_base UpdateQuantity route will evaluates availability
    collections.forEach(currentBasket.getProductLineItems(), function (lineItem) {
        var productAvailableToSell = 0;
        if (lineItem.shipment.custom.fromStoreId) {
            productAvailableToSell = validationHelpers.getLineItemInventory(lineItem.product, true, maoBOPISAvailability, lineItem.shipment.custom.fromStoreId);
        } else {
            productAvailableToSell = validationHelpers.getLineItemInventory(lineItem.product, true, maoAvaialability, null);
        }
        var requestQuantity = (lineItem.UUID === matchingLineItem.UUID) ? totalQtyRequested : lineItem.quantity;
        var message = cartHelper.getCartInventoryMessages(productAvailableToSell, lineItem.UUID, requestQuantity);
        if (!hasInventoryError && message.error) {
            hasInventoryError = message.error;
        }
        result.push(message);
    });

    // In the app_storefront_base UpdateQuantity route set status as 500 if the inventory is not available, this error messages will be used in client side JS
    res.setViewData({ inventoryError: result });
    var basketModel = new CartModel(currentBasket);
    if (bopisEnabled) {
        res.setViewData({ redirectUrl: URLUtils.url('Cart-Show', 'changeAllItemsStore', changeAllItemsStore, 'cartProdPid', productId).toString() });
        if (matchingLineItem && canBeUpdated && !hasInventoryError) {
            res.json({
                basketModel: basketModel,
                error: false
            });
        } else {
            res.setStatusCode(500);
            res.json({
                errorMessage: Resource.msg('error.cannot.update.product.quantity', 'cart', null),
                error: true,
                redirectUrl: URLUtils.url('Cart-Show', 'changeAllItemsStore', changeAllItemsStore, 'cartProdPid', productId, 'cartProdUUID', uuid).toString()
            });
        }
    } else if (matchingLineItem && canBeUpdated && !hasInventoryError) {
        res.json(basketModel);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product.quantity', 'cart', null)
        });
    }
    return next();
});

server.replace('EditProductLineItem', function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};
    const AvailabilityHelper = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper') : {};
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var Resource = require('dw/web/Resource');
    var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
    var params = req.form;
    var prod = ProductFactory.get(params);
    var productQuantitties = prod.quantities;
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if ('earlyAccess' in prod.custom && ((prod.custom.earlyAccess.isEarlyAccessProduct && !prod.custom.earlyAccess.isEarlyAccessCustomer) || prod.custom.earlyAccess.hideProduct)) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Product-Show', 'pid', prod.id).toString()
        });
        return next();
    }

    var uuid = req.form.uuid;
    var maoAvaialability = null;
    var productLineItems = currentBasket.allProductLineItems;
    var productId = req.form.pid;
    var selectedOptionValueId = req.form.selectedOptionValueId;
    var updateQuantity = parseInt(req.form.quantity, 10);
    var requestLineItem = collections.find(productLineItems, function (item) {
        return item.UUID === uuid;
    });
    var availableToSell = 0;
    var masterQtyLimitError = false;
    var product = (requestLineItem.productID === productId) ? (requestLineItem.product) : ProductMgr.getProduct(productId);
    if (requestLineItem) {
        if (isMAOEnabled) {
            var isCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled('EditCart');
            if (realTimeInventoryCallEnabled && isCheckPointEnabled && product.custom.giftCard.value !== eGiftCard) {
                var items = null;
                if (Object.prototype.hasOwnProperty.call(product.custom, 'sku') && product.custom.sku) {
                    items = [product.custom.sku];
                } else {
                    Logger.getLogger('mao_availability').info('MAOEmptySKU (Cart.js) : Product {0} has empty sku', product.ID);
                }
                if (!empty(items)) {
                    if (requestLineItem.shipment.custom.fromStoreId) {
                        var location = [requestLineItem.shipment.custom.fromStoreId];
                        maoAvaialability = Availability.getMaoAvailability(items, location);
                    } else {
                        maoAvaialability = Availability.getMaoAvailability(items);
                    }
                }
            }
        }
        // This statement will set the ATS value of the product, so in app_storefront_base EditProductLineItem route will evaluates availability
        availableToSell = validationHelpers.getLineItemInventory(product, true, maoAvaialability, requestLineItem.shipment.custom.fromStoreId);
    }

    // In the app_storefront_base EditProductLineItem route set status as 500 if the inventory is not available, this error messages will be used in client side JS
    var result = cartHelper.getInventoryMessages(availableToSell, uuid);
    if (requestLineItem.shipment.custom.fromStoreId) {
        result.error = false;
    }
    res.setViewData(result);
    if (!result.error) {
        // Base code
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var arrayHelper = require('*/cartridge/scripts/util/array');
        var Transaction = require('dw/system/Transaction');
        var CartModel = require('*/cartridge/models/cart');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var uuidToBeDeleted = null;
        var pliToBeDeleted;
        var hasBOPISshipment = cartHelper.basketHasBOPISShipmet(currentBasket);
        var newPidAlreadyExist = collections.find(productLineItems, function (item) {
            if (item.productID === productId && item.UUID !== uuid && !hasBOPISshipment) {
                var personalizationName = 'personalizationName' in req.form && req.form.personalizationName ? req.form.personalizationName.toUpperCase() : null;
                var personalizationNumber = 'personalizationNumber' in req.form && req.form.personalizationNumber ? req.form.personalizationNumber.toUpperCase() : null;
                var personalizationSponsors = 'personalizationSponsors' in req.form && req.form.personalizationSponsors ? req.form.personalizationSponsors.toUpperCase() : null;

                if (('jerseyNameText' in item.custom && personalizationName) || ('jerseyNumberText' in item.custom && personalizationNumber) || ('sponsors' in item.custom && personalizationSponsors)) {
                    var isSameLineItem = (personalizationName === item.custom.jerseyNameText) && (personalizationNumber === item.custom.jerseyNumberText) && ((personalizationSponsors || 'No') === item.custom.sponsors);
                    if (!isSameLineItem) return false;
                }

                uuidToBeDeleted = item.UUID;
                pliToBeDeleted = item;
                updateQuantity += parseInt(item.quantity, 10);
                return true;
            }
            return false;
        });

        var totalQtyRequested = 0;
        var qtyAlreadyInCart = 0;
        var masterQtyInCart = 0;
        var minOrderQuantity = 0;
        var masterQtyLimit = product.custom.masterQtyLimit ? product.custom.masterQtyLimit : null;
        var canBeUpdated = false;
        var perpetual = false;
        var bundleItems;

        if (requestLineItem) {
            if (product.bundle) {
                bundleItems = requestLineItem.bundledProductLineItems;
                canBeUpdated = collections.every(bundleItems, function (item) {
                    var quantityToUpdate = updateQuantity *
                        requestLineItem.product.getBundledProductQuantity(item.product).value;
                    qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                        item.productID,
                        productLineItems,
                        item.UUID
                    );
                    totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                    availableToSell = item.product.availabilityModel.inventoryRecord ? item.product.availabilityModel.inventoryRecord.ATS.value : null;
                    perpetual = item.product.availabilityModel.inventoryRecord.perpetual;
                    minOrderQuantity = item.product.minOrderQuantity.value;
                    return (totalQtyRequested <= availableToSell || perpetual) &&
                        (quantityToUpdate >= minOrderQuantity);
                });
            } else if (masterQtyLimit) {
                masterQtyInCart = cartHelper.getQtyAlreadyInCartWithSameMaster(
                    product,
                    productLineItems
                );

                if (updateQuantity < requestLineItem.quantityValue) {
                    totalQtyRequested = masterQtyInCart - updateQuantity;
                } else {
                    totalQtyRequested = (updateQuantity - requestLineItem.quantityValue) + masterQtyInCart;
                }

                minOrderQuantity = product.minOrderQuantity.value;
                canBeUpdated = (updateQuantity <= availableToSell && totalQtyRequested <= masterQtyLimit) &&
                (updateQuantity >= minOrderQuantity);
                if (!canBeUpdated) {
                    masterQtyLimitError = totalQtyRequested > masterQtyLimit;
                    res.setStatusCode(401);
                    res.json({
                        error: true,
                        masterQtyLimitError: masterQtyLimitError,
                        errorMessage: Resource.msgf('error.alert.master.quantity.limit.reached', 'product', null, product.custom.masterQtyLimit)
                    });
                    return next();
                }
            } else {
                availableToSell = product.availabilityModel.inventoryRecord.ATS.value;
                perpetual = product.availabilityModel.inventoryRecord.perpetual;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    productId,
                    productLineItems,
                    requestLineItem.UUID
                );
                minOrderQuantity = product.minOrderQuantity.value;
                canBeUpdated = (updateQuantity <= availableToSell || perpetual) &&
                    (updateQuantity >= minOrderQuantity);
            }
        }
        var error = false;
        if (canBeUpdated || requestLineItem.shipment.custom.fromStoreId) {
            try {
                Transaction.wrap(function () {
                    if (newPidAlreadyExist && !hasBOPISshipment) {
                        var shipmentToRemove = pliToBeDeleted.shipment;
                        currentBasket.removeProductLineItem(pliToBeDeleted);
                        if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                            currentBasket.removeShipment(shipmentToRemove);
                        }
                    }

                    if (!requestLineItem.product.bundle) {
                        requestLineItem.replaceProduct(product);
                    }

                    // If the product has options
                    var optionModel = product.getOptionModel();
                    if (optionModel && optionModel.options && optionModel.options.length) {
                        var productOption = optionModel.options.iterator().next();
                        var productOptionValue = optionModel.getOptionValue(productOption, selectedOptionValueId);
                        var optionProductLineItems = requestLineItem.getOptionProductLineItems();
                        var optionProductLineItem = optionProductLineItems.iterator().next();
                        optionProductLineItem.updateOptionValue(productOptionValue);
                    }

                    requestLineItem.setQuantityValue(updateQuantity);
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });
            } catch (e) {
                error = true;
            }
        }
    }
    if ((!result.error && !error && requestLineItem && canBeUpdated) || requestLineItem.shipment.custom.fromStoreId) {
        var cartModel = new CartModel(currentBasket);

        // update additional availability attributes
        var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
        var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'CartView');
        if (validatedProducts && validatedProducts.availabilityError) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, cartModel);
            availabilityHelper.getInvalidItems(cartModel, validatedProducts);
        } else if (validatedProducts) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, cartModel);
        }

        var responseObject = {
            cartModel: cartModel,
            newProductId: productId
        };

        if (uuidToBeDeleted && !requestLineItem.shipment.custom.fromStoreId) {
            responseObject.uuidToBeDeleted = uuidToBeDeleted;
        }

        var cartItem = arrayHelper.find(cartModel.items, function (item) {
            return item.UUID === uuid;
        });
        cartItem.quantities = productQuantitties;
        var productCardContext = {
            lineItem: cartItem,
            actionUrls: cartModel.actionUrls
        };
        var productCardTemplate = 'cart/productCard/cartProductCardServer.isml';

        responseObject.renderedTemplate = renderTemplateHelper.getRenderedHtml(
            productCardContext,
            productCardTemplate
        );

        res.json(responseObject);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product', 'cart', null)
        });
    }
    return next();
});

server.replace('GetProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');

    var requestUuid = req.querystring.uuid;

    var currentBasket = BasketMgr.getCurrentBasket();
    var requestPLI;
    if (currentBasket) {
        requestPLI = collections.find(currentBasket.allProductLineItems, function (item) {
            return item.UUID === requestUuid;
        });
    }

    var requestQuantity = requestPLI ? requestPLI.quantityValue.toString() : null;

    // If the product has options
    var optionProductLineItems = requestPLI.getOptionProductLineItems();
    var selectedOptions = null;
    var selectedOptionValueId = null;
    if (optionProductLineItems && optionProductLineItems.length) {
        var optionProductLineItem = optionProductLineItems.iterator().next();
        selectedOptionValueId = optionProductLineItem.optionValueID;
        selectedOptions = [{ optionId: optionProductLineItem.optionID, selectedValueId: optionProductLineItem.optionValueID, productId: requestPLI.productID }];
    }

    var pliProduct = {
        pid: requestPLI.productID,
        quantity: requestQuantity,
        options: selectedOptions
    };

    var product = ProductFactory.get(pliProduct);
    var CallOutMessagepromotions = productHelpers.getCallOutMessagePromotions(product.promotions, product);

    var context = {
        product: product,
        selectedQuantity: requestQuantity,
        selectedOptionValueId: selectedOptionValueId,
        uuid: requestUuid,
        updateCartUrl: URLUtils.url('Cart-EditProductLineItem'),
        closeButtonText: Resource.msg('link.editProduct.close', 'cart', null),
        enterDialogMessage: Resource.msg('msg.enter.edit.product', 'cart', null),
        CallOutMessagepromotions: CallOutMessagepromotions,
        template: 'product/quickView.isml'
    };

    res.setViewData(context);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();

        res.json({
            renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template)
        });
    });

    next();
});


server.append('GetProduct', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var viewData = res.getViewData();
    if (viewData && viewData.product && viewData.product.productTileBottomLeftBadge) {
        var assetID = viewData.product.productTileBottomLeftBadge;
        var content = ContentMgr.getContent(assetID);
        if (content && content.online && content.custom && content.custom.body && content.custom.body.markup) {
            viewData.badgesMarkup = content.custom.body.markup;
        }
    }

    // check if user is a border free user or not
    var isBorderFreeUser = req.querystring.isBorderFreeUser ? req.querystring.isBorderFreeUser : 'false';
    viewData.isBorderFreeUser = isBorderFreeUser;

    res.setViewData(viewData);
    var product = ProductMgr.getProduct(viewData.product.id);
    var BVConstants = require('bm_bazaarvoice/cartridge/scripts/lib/libConstants').getConstants();
    var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
    var ratingPref = Site.getCurrent().getCustomPreferenceValue('bvEnableInlineRatings');
    var quickviewPref = Site.getCurrent().getCustomPreferenceValue('bvQuickViewRatingsType');

    if (quickviewPref && quickviewPref.value && !quickviewPref.value.equals('none')) {
        viewData.bvScout = BVHelper.getBvLoaderUrl();
        var apiProduct = product;
        var pid = (apiProduct.variant && !BVConstants.UseVariantID) ? apiProduct.variationModel.master.ID : apiProduct.ID;
        pid = BVHelper.replaceIllegalCharacters(pid);

        viewData.bvDisplay = {
            bvPid: pid,
            qvType: quickviewPref.value,
            productUrl: URLUtils.url('Product-Show', 'pid', pid)
        };

        if (quickviewPref.value.equals('inlineratings')) {
            if (ratingPref && ratingPref.value && ratingPref.value.equals('native')) {
                var masterProduct = (apiProduct.variant) ? apiProduct.variationModel.master : apiProduct;
                var bvAvgRating = masterProduct.custom.bvAverageRating;
                var bvRatingRange = masterProduct.custom.bvRatingRange;
                var bvReviewCount = masterProduct.custom.bvReviewCount;
                var bvAvgRatingNum = Number(bvAvgRating);
                var bvRatingRangeNum = Number(bvRatingRange);
                var bvReviewCountNum = Number(bvReviewCount);

                var starsFile = null;
                if (isFinite(bvAvgRatingNum) && bvAvgRating && isFinite(bvRatingRangeNum) && bvRatingRange && isFinite(bvReviewCountNum) && bvReviewCount) {
                    starsFile = 'rating-' + bvAvgRatingNum.toFixed(1).toString().replace('.', '_') + '.gif';
                } else {
                    starsFile = 'rating-0_0.gif';
                }
                viewData.bvDisplay.rating = {
                    enabled: true,
                    type: 'native',
                    rating: bvAvgRatingNum.toFixed(1),
                    range: bvRatingRangeNum.toFixed(0),
                    count: bvReviewCountNum.toFixed(0),
                    stars: URLUtils.absStatic('/images/stars/' + starsFile).toString()
                };
            } else if (ratingPref && ratingPref.value && ratingPref.value.equals('hosted')) {
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
        } else if (quickviewPref.value.equals('pdpsummary')) {
            viewData.bvDisplay.rr = {
                enabled: BVHelper.isRREnabled()
            };
            viewData.bvDisplay.showSummary = true;
        }
        res.setViewData(viewData);
    }

    if (product.custom.giftCard.value === eGiftCard) {
        var BasketMgr = require('dw/order/BasketMgr');
        var lineItem = null;
        var uuid = viewData.uuid;
        var eGiftCardsForm = session.forms.giftcards;
        if (typeof uuid !== undefined && !empty(uuid)) {
            var currentBasket = BasketMgr.getCurrentBasket();
            var productLineItems = currentBasket ? currentBasket.getProductLineItems() : [];

            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                if (item.UUID === uuid) {
                    lineItem = item;
                    break;
                }
            }
        }

        if (!empty(lineItem) && !empty(eGiftCardsForm)) {
            eGiftCardsForm.egiftcard.gcRecipientName.setValue(lineItem.custom.gcRecipientName);
            eGiftCardsForm.egiftcard.gcRecipientEmail.setValue(lineItem.custom.gcRecipientEmail);
            eGiftCardsForm.egiftcard.gcFrom.setValue(lineItem.custom.gcFrom);
            eGiftCardsForm.egiftcard.gcDeliveryDate.setValue(new Date(lineItem.custom.gcDeliveryDate));
            eGiftCardsForm.egiftcard.gcMessage.setValue(lineItem.custom.gcMessage);
            eGiftCardsForm.egiftcard.gcAmount.setValue(parseFloat(lineItem.price.value || 0).toFixed(2));
        } else {
            eGiftCardsForm.clear();
        }
        res.setViewData({
            eGiftCardsForm: server.forms.getForm('giftcards'),
            updateCartUrl: URLUtils.url('Cart-UpdateEGiftCardLineItem'),
            lineItemDate: lineItem && lineItem.custom ? lineItem.custom.gcDeliveryDate : null,
            template: 'product/giftCardQuickView.isml',
            eGiftCardRange: giftcardHelper.getEGiftCardAmountRange(),
            eGiftCardMinAmount: Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin'),
            eGiftCardMaxAmount: Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMax'),
            eGiftCardDeliveryTimeLine: Site.getCurrent().getCustomPreferenceValue('eGiftCardDelivery')
        });
    }
    next();
});

server.prepend('AddProduct', function (req, res, next) {
    if (customer.registered && !customer.authenticated) {
        const Logger = require('dw/system/Logger');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        CustomerMgr.logoutCustomer(req.session.privacyCache.get('remember_me') || false);
        Logger.error('Cleared session for customer ID : {0}', customer.ID);
    }
    var viewData = res.getViewData();
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Resource = require('dw/web/Resource');
    var renderTemplateHelperForSavedItem = require('*/cartridge/scripts/renderTemplateHelper');
    var SavedItemErrorTemplate = 'cart/productCard/cartProductSavedItemAvailability.isml';
    var renderedSavedItemErrorTemplate = renderTemplateHelperForSavedItem.getRenderedHtml(viewData, SavedItemErrorTemplate);
    var savedProduct = ProductMgr.getProduct(req.form.pid);
    var isfromSaveForLater = req.querystring.isfromSaveForLater;
    viewData.isPickupItem = req.form.isPickupItem;
    viewData.isQuickAdd = req.form.isQuickAdd;

    if (isfromSaveForLater && !savedProduct.isOnline()) {
        var responseJSON = {
            savedItemAvailabilityError: true,
            renderedSavedItemErrorTemplate: renderedSavedItemErrorTemplate,
            savedItemAvailabilityMsg: Resource.msg('label.not.available.items.unavailable', 'common', null)
        };
        res.json(responseJSON);
        this.emit('route:Complete', req, res);
        return;
     // eslint-disable-next-line
    } else {
        next();
    }
});

server.append('AddProduct', function (req, res, next) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var Resource = require('dw/web/Resource');
    var currentBasket = BasketMgr.getCurrentBasket();
    var eGiftCardFormData = req.form.eGiftCardData;
    var viewData = res.getViewData();

    if (typeof eGiftCardFormData !== 'undefined' && !empty(eGiftCardFormData)) {
        var productId = req.form.pid;
        // Below method called to update eGiftCard specific ProductLineItem level custom attributes
        giftcardHelper.updateEGiftCardData(productId, viewData.pliUUID, eGiftCardFormData);
    }

    // Below line of code will split the single shipment into multiple shipment if the basket has the e-gift card item.
    Transaction.wrap(function () {
        giftcardHelper.updateGiftCardShipments(currentBasket);
        giftcardHelper.removeEmptyShipments(currentBasket);
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    if (currentBasket) {
        var basketModel = new CartModel(currentBasket);
        // update additional availability attributes
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var availabilityHelper = require('*/cartridge/scripts/helpers/availabilityHelpers');
        var validatedProducts = validationHelpers.validateProductsInventory(currentBasket, 'CartView');
        if (validatedProducts && validatedProducts.availabilityError) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, basketModel);
            availabilityHelper.getInvalidItems(basketModel, validatedProducts);
        } else if (validatedProducts) {
            availabilityHelper.updateLineItemQuantityOption(validatedProducts.lineItemQtyList, basketModel);
        }
        var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
        var context = {
            cartQuantity: currentBasket.productQuantityTotal,
            actionUrls: basketModel.actionUrls,
            lineItems: basketModel.items,
            numItems: basketModel.numItems,
            CurrentCustomer: req.currentCustomer.raw,
            template: 'cart/cartItems.isml',
            minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, currentBasket.productQuantityTotal)
        };
        res.setViewData(context);
        viewData = res.getViewData();
        res.json({
            renderedTemplate: renderTemplateHelper.getRenderedHtml(viewData, viewData.template)
        });
    }

    // Update Default size selection
    var sViewData = res.viewData;
    if (!sViewData.error) {
        var sizePreferencesHelper = require('*/cartridge/scripts/helpers/sizePreferencesHelper');
        var sizePreferences = req.session.privacyCache.get('sizePreferences');
        var sizePreferencesobj = sizePreferencesHelper.createSizePrefJson(req.form.pid, sizePreferences, req.currentCustomer.raw.authenticated ? req.currentCustomer.raw.profile.email : null);
        if (sizePreferencesobj) {
            req.session.privacyCache.set('sizePreferences', sizePreferencesobj);
        }
    }

    next();
});

server.get(
    'AddToCartFromSaveLater',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var CartModel = require('*/cartridge/models/cart');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var currentBasket = BasketMgr.getCurrentBasket();
        var uuid = req.querystring.pliUUID;
        var wishlists = customer.getProductLists(TYPE_WISH_LIST); // Retrieving wish list items from customer
        var isWishListItem;
        if (currentBasket) {
            isWishListItem = cartHelper.isListItemExistInBasket(currentBasket, wishlists); // returns a boolean whether item exists in whislist or not
            var basketModel = new CartModel(currentBasket);
            var hasOnlyItem = basketModel.numItems === 1;
            var hasPreOrder = false;
            if (cartHelper.hasPreOrderItems(currentBasket)) {
                hasPreOrder = true;
            }
            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
            var template = 'cart/productCard/saveLaterAddToCart.isml';
            var renderedTemplate = renderTemplateHelper.getRenderedHtml({ cartQuantity: currentBasket.productQuantityTotal, actionUrls: basketModel.actionUrls, lineItems: basketModel.items, hasOnlyItem: hasOnlyItem, isWishListItem: isWishListItem, CurrentCustomer: req.currentCustomer.raw }, template);
            res.json({
                error: false,
                basket: basketModel,
                uuid: uuid,
                renderedTemplate: renderedTemplate,
                hasPreOrder: hasPreOrder,
                hasOnlyItem: hasOnlyItem
            });
        }
        next();
    });

server.post('UpdateEGiftCardLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var uuid = req.form.uuid;
    var productId = req.form.pid;

    var error = false;
    try {
        var eGiftCardFormData = req.form.eGiftCardData;
        if (typeof eGiftCardFormData !== undefined && !empty(eGiftCardFormData)) {
            Transaction.wrap(function () {
                // Below method called to update eGiftCard specific ProductLineItem level custom attributes
                giftcardHelper.updateEGiftCardData(productId, uuid, eGiftCardFormData);
            });
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        }
    } catch (e) {
        error = true;
    }

    if (!error) {
        var cartModel = new CartModel(currentBasket);
        var responseObject = {
            cartModel: cartModel,
            newProductId: productId
        };

        res.json(responseObject);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product', 'cart', null)
        });
    }
    return next();
});

server.get(
    'IsWishListItem',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var currentBasket = BasketMgr.getCurrentBasket();
        var uuid = req.querystring.uuid;
        var wishlists = customer.getProductLists(TYPE_WISH_LIST); // Retrieving wish list items from customer
        var isWishListItem;
        if (currentBasket) {
            isWishListItem = cartHelper.isListItemExistInBasket(currentBasket, wishlists); // returns a boolean whether item exists in whislist or not
        }
        res.json({
            error: false,
            isWishListItem: isWishListItem[uuid],
            uuid: uuid
        });
        next();
    });

server.get('EditFromSavedeGift', function (req, res, next) {
    var pidToRemove = req.querystring.pid;
    var uuidToRemove = req.querystring.uuid;
    var pidType = req.querystring.eGCedit;
    var Transaction = require('dw/system/Transaction');
    var wishlist = customer.getProductLists(TYPE_WISH_LIST);
    var eGiftCardsForm = session.forms.giftcards;
    Transaction.wrap(function () {
        if (wishlist != null && wishlist.length > 0) {
            var wishlistItems = wishlist[0].getItems();
            collections.forEach(wishlistItems, function (wishlistItem) {
                if (wishlistItem.productID === pidToRemove || wishlistItem.UUID === uuidToRemove) {
                    if (pidType && 'giftCard' in wishlistItem.product.custom && wishlistItem.product.custom.giftCard.value === 'EGIFT_CARD') {
                        giftcardHelper.eGCDataToeGiftForm(wishlistItem, eGiftCardsForm);
                    }
                    customer.getProductLists(TYPE_WISH_LIST)[0].removeItem(wishlistItem);
                }
            });
        }
    });

    // Get the wishlist products
    var list = productListHelper.getList(req.currentCustomer.raw, { type: TYPE_WISH_LIST }); // eslint-disable-next-line
    var listIsEmpty = list ? list.items.empty : false;
    if (listIsEmpty && !req.currentCustomer.raw.authenticated && !req.currentCustomer.raw.registered) {
        productListHelper.removeList(req.currentCustomer.raw, list, null);
    }
    var eGiftCardsFormData = server.forms.getForm('giftcards');
    res.setViewData({
        eGiftCardsForm: eGiftCardsFormData
    });
    res.json({
        error: false,
        redirectUrl: URLUtils.url('Product-Show', 'pid', pidToRemove, 'gcRecipientName', eGiftCardsFormData.egiftcard.gcRecipientName.value, 'gcRecipientEmail', eGiftCardsFormData.egiftcard.gcRecipientEmail, 'gcFrom', eGiftCardsFormData.egiftcard.gcFrom, 'gcDeliveryDate', eGiftCardsFormData.egiftcard.gcDeliveryDate, 'gcMessage', eGiftCardsFormData.egiftcard.gcMessage, 'gcAmount', eGiftCardsFormData.egiftcard.gcAmount, 'eGiftCardEdit', true).toString()
    });
    next();
});

/**
 * Cart-cartAddedConfirmationModal : The Cart-cartAddedConfirmationModal is responsible for getting Product Added to cart popup Whenever user clicks on AddToCart Button
 * @name Base/Cart-cartAddedConfirmationModal
 * @function
 * @memberof Cart
 * @param {ID} - product ID
 * @param {qty} - product quantity
 * @param {renders} - isml
 * @param {serverfunction} - post
 */
server.get('cartAddedConfirmationModal', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var quantity = req.querystring.qty;
    var productId = req.querystring.pid;
    var productDetails = productId ? ProductMgr.getProduct(productId) : '';
    var isGiftCard = (productDetails && (productDetails.custom.giftCard.value === 'EGIFT_CARD' || productDetails.custom.giftCard.value === 'GIFT_CARD')) || false;
    if (!empty(productDetails) && (productDetails.custom.giftCard.value === 'EGIFT_CARD')) {
        quantity = 1;
        var amount = req.querystring.gcAmount;
    }
    if (!empty(productDetails) && (productDetails.custom.giftCard.value === 'GIFT_CARD')) {
        amount = req.querystring.gcAmount;
    }
    if (productDetails && !((productDetails.custom.giftCard.value === 'EGIFT_CARD') || (productDetails.custom.giftCard.value === 'GIFT_CARD'))) {
        var sizeVariationAttribute = productDetails.variationModel.getProductVariationAttribute('size');
        var sizeVariationValue = productDetails.variationModel.getVariationValue(productDetails, sizeVariationAttribute);
    }
    var colorVariationAttribute = productDetails ? productDetails.variationModel.getProductVariationAttribute('color') : null;
    var colorVariationValue = productDetails ? productDetails.variationModel.getVariationValue(productDetails, colorVariationAttribute) : null;

    var isQuickAdd = req.querystring.quickAdd === 'true';
    var template = isQuickAdd ? 'checkout/cart/cartAddedConfirmationModalWithRemove' : 'checkout/cart/cartAddedConfirmationModal';

    var uuid = req.querystring.uuid;
    var removeAddedProductURL = URLUtils.https('Cart-RemoveProductLineItem', 'pid', productDetails.ID, 'uuid', uuid);

    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var productLineItems = currentBasket.productLineItems;

    var qtyAlreadyInCart = quantity;
    collections.forEach(productLineItems, function (item) {
        if (item.productID === productId && uuid === item.UUID) {
            qtyAlreadyInCart = item.quantityValue;
        }
    });
    var prevQty = (qtyAlreadyInCart || 0) - (parseInt(quantity, 10) || 1);
    if (prevQty > 0) {
        removeAddedProductURL = URLUtils.https('Cart-UpdateQuantity', 'pid', productDetails.ID, 'uuid', uuid, 'quantity', prevQty);
    }

    res.render(template, {
        prevQty: prevQty > 0 ? prevQty : 0,
        removeAddedProductURL: removeAddedProductURL,
        isQuickAdd: isQuickAdd,
        ProductDetails: productDetails,
        Quantity: quantity,
        Amount: amount,
        sizeValue: sizeVariationValue,
        colorVariationAttribute: colorVariationAttribute,
        colorVariationValue: colorVariationValue,
        isGiftCard: isGiftCard
    });
    next();
});

/**
 * Cart-AddBonusProducts : The Cart-AddBonusProducts endpoint handles adding bonus products to basket
 * @name Base/Cart-AddBonusProducts
 * @function
 * @memberof Cart
 * @param {querystringparameter} - pids - an object containing: 1. totalQty (total quantity of total bonus products) 2. a list of bonus products with each index being an object containing pid (product id of the bonus product), qty (quantity of the bonus product), a list of options of the bonus product
 * @param {querystringparameter} - uuid - UUID of the mian product
 * @param {querystringparameter} - pliuud - UUID of the bonus product line item
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.replace('AddBonusProducts', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var data = JSON.parse(req.querystring.pids);
    var pliUUID = req.querystring.pliuuid;
    var newBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var qtyAllowed = data.totalQty;
    var totalQty = 0;

    for (var i = 0; i < data.bonusProducts.length; i++) {
        totalQty += data.bonusProducts[i].qty;
    }

    if (totalQty === 0) {
        res.json({
            errorMessage: Resource.msg(
                'error.alert.choiceofbonus.no.product.selected',
                'product',
                null),
            error: true,
            success: false
        });
    } else if (totalQty > qtyAllowed) {
        res.json({
            errorMessage: Resource.msgf(
                'error.alert.choiceofbonus.max.quantity',
                'product',
                null,
                qtyAllowed,
                totalQty),
            error: true,
            success: false
        });
    } else {
        var bonusDiscountLineItem = collections.find(newBonusDiscountLineItems, function (item) {
            return item.UUID === req.querystring.uuid;
        });

        if (currentBasket) {
            Transaction.wrap(function () {
                collections.forEach(bonusDiscountLineItem.getBonusProductLineItems(), function (dli) {
                    if (dli.product) {
                        currentBasket.removeProductLineItem(dli);
                    }
                });

                var pli;
                data.bonusProducts.forEach(function (bonusProduct) {
                    var product = ProductMgr.getProduct(bonusProduct.pid);
                    var selectedOptions = bonusProduct.options;
                    var optionModel = productHelper.getCurrentOptionModel(
                        product.optionModel,
                        selectedOptions
                    );
                    pli = currentBasket.createBonusProductLineItem(
                        bonusDiscountLineItem,
                        product,
                        optionModel,
                        null
                    );
                    pli.setQuantityValue(bonusProduct.qty);
                    pli.custom.bonusProductLineItemUUID = pliUUID;
                });

                collections.forEach(currentBasket.getAllProductLineItems(), function (productLineItem) {
                    if (productLineItem.UUID === pliUUID) {
                        productLineItem.custom.bonusProductLineItemUUID = 'bonus';// eslint-disable-line no-param-reassign
                        productLineItem.custom.preOrderUUID = productLineItem.UUID;// eslint-disable-line no-param-reassign
                    }
                });
            });
        }

        res.json({
            totalQty: currentBasket.productQuantityTotal,
            msgSuccess: Resource.msg('text.alert.choiceofbonus.addedtobasket', 'product', null),
            success: true,
            error: false
        });
    }
    next();
});

module.exports = server.exports();

