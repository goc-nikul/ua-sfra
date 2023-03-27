/* eslint spellcheck/spell-checker: 0 */
/* global request */
const server = require('server');
const SecureEncoder = require('dw/util/SecureEncoder');
const Cookie = require('dw/web/Cookie');
const Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');

function getQueryParam(req, param) {
  const val = req.querystring[param];
  return val
    ? SecureEncoder.forHtmlUnquotedAttribute(val)
    : undefined;
}

function getAction(req) {
    const url = req.querystring['currentUrl'];
    if (url) {
        try {
            // This will separate the path from the query parameters then
            //  split the path into component parts.  Then remove the parts of the
            //  path that are empty (in the case where the url ends in a slash)
            //  then returns the last segment of the path.
            return url.split('?')[0].split("/").filter((p)=> p.trim() !== '').pop();
        } catch (e) {
            return '';
        }
    } else {
        return '';
    }
}

function getStoreCookies(productId) {
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
    var bopisDataObj = {};
    var storeID = null;
    var product = require('dw/catalog/ProductMgr').getProduct(productId);
    bopisDataObj.available = product && 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled') &&
                              (product.custom.availableForInStorePickup !== false);
    if (bopisDataObj.available) {
        if (preSelectedStoreCookie) {
            var storeData = JSON.parse(preSelectedStoreCookie);
            storeID = storeData && storeData.ID;
            if (storeID) {
                var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
                var selectedStore = storeHelpers.findStoreById(storeID);
                var productList = [{
                    id: productId,
                    quantity: 1
                }];
                var storeModel = {
                    stores: [selectedStore]
                };
                var storeAvailabilityObj = storeHelpers.getStoreAvailability(storeModel, productList);
                bopisDataObj.selected = false;
                bopisDataObj.stock = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] ?
                    storeAvailabilityObj.stores[0].productInStoreInventory : false;
                bopisDataObj.msg = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
                if (bopisDataObj.stock) {
                	bopisDataObj.msg = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] &&
                    storeAvailabilityObj.stores[0].availabilityMessage ? storeAvailabilityObj.stores[0].availabilityMessage :
                    Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
                    bopisDataObj.selected = true;
                }

            } else {
                bopisDataObj.selected = false;
                bopisDataObj.stock = false;
                bopisDataObj.msg = Resource.msg('cart.store.tealium.pickup.selectstore', 'storeLocator', null);
            }
        } else {
            var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
            var URLUtils = require('dw/web/URLUtils');
            var lat = request.geolocation ? request.geolocation.latitude : null; // eslint-disable-line
            var long = request.geolocation ? request.geolocation.longitude : null; // eslint-disable-line
            var pid = productId;
            var ProductMgr = require('dw/catalog/ProductMgr');
            var product = ProductMgr.getProduct(pid);
            var storesModel;
            var addressBook = customer && customer.addressBook;
            if (addressBook && addressBook.getPreferredAddress()) {
                var prefferedAddress = addressBook.getPreferredAddress();
                var postalCode = prefferedAddress.postalCode;
                storesModel = storeHelpers.preSelectStoreByLocation(lat, long, postalCode);
            } else {
                storesModel = storeHelpers.preSelectStoreByLocation(lat, long, null);
            }
            var selectedStore = storesModel.stores.filter(function(store) { // eslint-disable-line
                if (store.enableStore !== false) {
                    return store;
                }
            })[0];
            var storeData = {};
            if (selectedStore) {
                var productList = [{
                    id: product.ID,
                    quantity: 1
                }];
                var storeModel = {
                    stores: [selectedStore]
                };
                var storeAvailabilityObj = storeHelpers.getStoreAvailability(storeModel, productList);
                bopisDataObj.selected = false;
                bopisDataObj.stock = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] ?
                    storeAvailabilityObj.stores[0].productInStoreInventory : false;
                bopisDataObj.msg = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
                if (bopisDataObj.stock) {
                    bopisDataObj.msg = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] &&
                    storeAvailabilityObj.stores[0].availabilityMessage ? storeAvailabilityObj.stores[0].availabilityMessage :
                    Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
                    bopisDataObj.selected = true;
                }
            } else {
                bopisDataObj.selected = false;
                bopisDataObj.stock = false;
                bopisDataObj.msg = Resource.msg('cart.store.tealium.pickup.selectstore', 'storeLocator', null);
            }
        }
    } else {
        bopisDataObj.selected = false;
        bopisDataObj.msg = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
        bopisDataObj.stock = false;
    }
    return bopisDataObj;
}
function checkoutStep(checkoutStep) {
    if (!checkoutStep || 0 === checkoutStep.length) {
        return 'shipping';
    } else if (checkoutStep === 'placeOrder') {
        return 'contact';
    }
    return checkoutStep;
}

function setVisitorTypeCookie(customerData) {
  const visitorType = customerData.visitor_type;
  const cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
  const visitorCookieVal = cookieHelpers.read('UAVisitorType');
  if (visitorCookieVal !== visitorType) {
    const cookie = new Cookie('UAVisitorType', visitorType);
    cookie.setPath('/');
    response.addHttpCookie(cookie);
  }
}

function getDwSid() {
  const cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
  const dwsid = cookieHelper.read('dwsid');
  return dwsid && dwsid.toString().substring(0, 10);
}

/**
 * Returns a cart Data Object
 * @param {string} action - the action of the request from the URL path 
 * @returns {object} cart Data
 */
function getCartDataObject(logicArgs) {
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    if (!currentBasket) {
        return {};
    }
    var isCartCached = false;
    var action = logicArgs.action;
    var cache = require('~/cartridge/scripts/helpers/cache')
    var cartData = cache.getCartCache();

    // checks cart state from cache if the cart Data is present in the cache and current page is not cart or checkout pages
    if(cartData && action 
    && action !== 'Cart-Show' && action !== 'Checkout-Begin' && ['Order-Confirm', 'COPlaceOrder-Submit'].indexOf(action) === -1)
    {
        isCartCached = cache.checkCartCache(currentBasket);
    }
    if (!isCartCached) {
        const cartObjectData = require('~/cartridge/models/tealiumCart.js').buildCartObject();
        logicArgs.cartData = cartObjectData;
        const PAGE = require('~/cartridge/scripts/dataLogic/page.js')(logicArgs);
        logicArgs.pageName = PAGE.page_name;
        cartData = require('~/cartridge/scripts/dataLogic/cart.js')(logicArgs);
        cache.setCartCache(cartData);
        
        cartData.mapped = {
            allProductLineItems : cartObjectData.mapped.allProductLineItems
        }
        cartData.hasCartItems = cartObjectData.hasCartItems;
    }
   
    return cartData;
}

/**
* @module controllers/Tealium
*
* <isinclude url="${URLUtils.url('Tealium-init',
*     'arg1' => ''
* )}" />
*
* req.querystring.arg1
*/

/**
* Main datalayer definition.
* @param {func} req The first number.
* @returns {Object} The data layer
*/
function buildServerData(req) {
    const BOPIS = {};
    // const pdictAction = getQueryParam(req, 'action');
    const pdictAction = getAction(req);
    const productId = getQueryParam(req, 'productid');
    const productObjectData = productId && require('~/cartridge/models/tealiumProduct.js').buildProductObject(productId);
    const currentCustomerProfile = req.currentCustomer.raw && req.currentCustomer.raw.profile && req.currentCustomer.raw.profile;
    const sizePreferenceObj = req.session.privacyCache.get('sizePreferences');
    const ABTestData = require('~/cartridge/scripts/tealiumUtils').getABTestData();
    const logicArgs = {
        srcParam: getQueryParam(req, 'srcParam'),
        action: pdictAction,
        checkoutStage: getQueryParam(req, 'checkoutStage'),
        selectedPaymentMethod: getQueryParam(req, 'selectedPaymentMethod'),
        pdictAnalyticsPageType: getQueryParam(req, 'analyticsPageType'),
        locale: req.locale, // { id 'en_US', currency: { ... } }
        categoryId: getQueryParam(req, 'pagecgid'),
        orderNumber: getQueryParam(req, 'orderno'),
        pageContextType: getQueryParam(req, 'pagecontexttype'),
        searchTerm: getQueryParam(req, 'searchterm'),
        searchResultsCount: getQueryParam(req, 'searchresultscount'),
        searchShowMore: getQueryParam(req, 'searchshowmore'),
        searchresulttopstyles: getQueryParam(req, 'searchresulttopstyles'),
        productData: productObjectData,
        recommendedLook: getQueryParam(req, 'recommendedLook'),
        sessionID: getQueryParam(req, 'sessionID'),
        customerNo: currentCustomerProfile && currentCustomerProfile.customerNo,
        isVIP: Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && currentCustomerProfile && currentCustomerProfile.custom && currentCustomerProfile.custom.vipAccountId,
        isEmployee: currentCustomerProfile && currentCustomerProfile.custom && currentCustomerProfile.custom.isEmployee,
        gridRefinementAttributes: getQueryParam(req, 'gridRefinementAttributes'),
        wishlistCount: req.querystring.wishlistCount ? parseInt(req.querystring.wishlistCount) : undefined,
        emailOptin: getQueryParam(req, 'order_checkout_optin') === 'true' ? 'yes' : 'no',
        pageBreadCrumbs: getQueryParam(req, 'pageBreadCrumbs'),
        currentCustomerProfile: currentCustomerProfile,
        productSizePrefs: sizePreferenceObj,
        complete_look: getQueryParam(req, 'complete_look'),
        ABTestData : ABTestData
    };
    logicArgs.cartData = getCartDataObject(logicArgs);

    const PAGE = require('~/cartridge/scripts/dataLogic/page.js')(logicArgs);
    logicArgs.pageName = PAGE.page_name;
    logicArgs.pageType = PAGE.page_type;
    logicArgs.siteSection = PAGE.site_section;
    logicArgs.bopisDataObj = logicArgs.pageType === 'product-detail'
        ? getStoreCookies(productId)
        : {};
    const customerObjectData = require('~/cartridge/models/tealiumCustomer.js').buildCustomerObject(logicArgs);
    logicArgs.customerData = customerObjectData;
    logicArgs.orderData = logicArgs.pageType === 'order-receipt'
        ? require('~/cartridge/models/tealiumOrder.js').buildOrderObject(logicArgs)
        : undefined;

    const SITE = require('~/cartridge/scripts/dataLogic/site.js')(logicArgs);
    const PRODUCTS = require('~/cartridge/scripts/dataLogic/products/index.js')(logicArgs);
    const ORDER = logicArgs.pageType === 'order-receipt'
        ? require('~/cartridge/scripts/dataLogic/order.js')(logicArgs)
        : {};
    const CUSTOMER = require('~/cartridge/scripts/dataLogic/customer.js')(logicArgs);
    setVisitorTypeCookie(CUSTOMER);
    const PDP = logicArgs.pageType === 'product-detail'
        ? require('~/cartridge/scripts/dataLogic/pdp.js')(logicArgs)
        : {};
    const SEARCH = ['product-listing', 'search'].indexOf(logicArgs.pageType)
        ? require('~/cartridge/scripts/dataLogic/search.js')(logicArgs)
        : {};
    const GRID = ['product-listing', 'search'].indexOf(logicArgs.pageType) > -1
        ? require('~/cartridge/scripts/dataLogic/grid.js')(logicArgs)
        : {};
    const CART =  logicArgs.cartData
    const PROMO = logicArgs.pageType !== 'order-receipt' && logicArgs.srcParam
        ? require('~/cartridge/scripts/dataLogic/promo.js')(logicArgs)
        : {};
    const CHECKOUT = logicArgs.pageType === 'checkout'
        ? require('~/cartridge/scripts/dataLogic/checkout.js')(logicArgs)
        : {};

    // Datalayer
    var siteData = {
        site_country_code: SITE.site_country_code,
        site_currency: SITE.site_currency,
        site_language: SITE.site_language,
        site_section: SITE.site_section,
        site_shipto_country: SITE.site_shipto_country,
        site_type: 'sfra-responsive'
    };
    var pageData = {
        page_type: PAGE.page_type,
        page_name: PAGE.page_name,
        page_category: PAGE.page_categories && PAGE.page_categories[0],
        page_subcategory1: PAGE.page_categories && PAGE.page_categories[1],
        page_subcategory2: PAGE.page_categories && PAGE.page_categories[2],
        page_subcategory3: PAGE.page_categories && PAGE.page_categories[3],
        page_subcategory4: PAGE.page_categories && PAGE.page_categories[4],
        page_finding_method: undefined,
        page_internal_campaign: undefined,
        page_meta_path: logicArgs.pageBreadCrumbs,
        dwsid: getDwSid()
    };
    var orderData = {
        order_id: ORDER.order_id,
        order_payment_method: ORDER.order_payment_method,
        order_discount: ORDER.order_discount,
        order_shipping_method: ORDER.order_shipping_method,
        order_shipping_revenue: ORDER.order_shipping_revenue,
        order_shipping_subtotal: ORDER.order_shipping_subtotal,
        order_shipping_discount: ORDER.order_shipping_discount,
        order_subtotal: ORDER.order_subtotal,
        order_tax: ORDER.order_tax,
        order_merchandize_tax: ORDER.order_merchandize_tax,
        order_shipping_tax: ORDER.order_shipping_tax,
        order_total: ORDER.order_total,
        order_type: ORDER.order_type,
        order_promo_codes: ORDER.order_promo_codes,
        order_checkout_optin: ORDER.order_checkout_optin,
        order_flags: ORDER.order_flags,
        plain_text_email: ORDER.plain_text_email
    };
    var customerData = {
        customer_id: CUSTOMER.customer_id,
        customer_type: CUSTOMER.customer_type,
        customer_status: CUSTOMER.customer_status,
        logged_in_status: CUSTOMER.logged_in_status,
        session_id: CUSTOMER.session_id,
        visitor_type: CUSTOMER.visitor_type,
        customer_gender_pref: CUSTOMER.customer_gender_pref,
        customer_activity_pref: CUSTOMER.customer_activity_pref
    };
    var bopisData = {
        bopis: CART.cart_bopis
    };
    var pdpData = {
          pdp_type: PDP.pdp_type,
          pdp_360_video: PDP.pdp_360_video,
          pdp_merch_product_stack: PDP.pdp_merch_product_stack,
          pdp_price_type: PDP.pdp_price_type,
          pdp_combined_style: PDP.pdp_combined_style,
          pdp_extended_sizing: PDP.pdp_extended_sizing,
          pdp_outofstock: PDP.pdp_outofstock,
          pdp_discount_exclusions: PDP.pdp_discount_exclusions,
          pdp_experience_type: PDP.pdp_experience_type,
          pdp_feature_icons: PDP.pdp_feature_icons // feature/benefit icons
    };
    var productData = {
        products: PRODUCTS && PRODUCTS.length && PRODUCTS.map(function (p) {
            return {
                product_id: p.product_id,
                product_uuid: p.product_uuid,
                product_name: p.product_name,
                product_rating: p.product_rating,
                product_review_count: p.product_review_count,
                product_quantity: p.product_quantity,
                product_style: p.product_style,
                product_color: p.product_color,
                product_sku: p.product_sku,
                product_silhouette: p.product_silhouette,
                product_gender: p.product_gender,
                product_preorder: p.product_preorder,
                product_price: p.product_price,
                product_msrp: p.product_msrp,
                product_onsale: p.product_onsale,
                product_bopis: p.product_bopis,
                product_bopis_available: p.product_bopis_available,
                product_bopis_selected: p.product_bopis_selected,
                product_bopis_message: p.product_bopis_message,
                product_bopis_stock: p.product_bopis_stock,
                store_id: p.store_id,
                product_size_prepopulated: p.product_size_prepopulated,
                product_image_count: p.product_image_count,
                product_alert_text: p.product_alert_text,
                product_badge_text: p.product_badge_text,
                product_tech_icon: p.product_tech_icon,
                product_oos: p.product_oos,
                complete_look_recommended: logicArgs.recommendedLook === 'true' ? true : false,
                product_options_color_total: p.product_options_color_total,
                product_options_color_full: p.product_options_color_full,
                product_options_size_total: p.product_options_size_total,
                product_options_size_full: p.product_options_size_full,
                product_grid_position: p.product_grid_position,
                product_line_item_revenue: p.product_line_item_revenue,
                product_line_item_price: p.product_line_item_price,
                product_line_item_tax: p.product_line_item_tax,
                product_line_item_sourcecode_discount: p.product_line_item_sourcecode_discount,
                product_line_item_coupon_discount: p.product_line_item_coupon_discount,
                product_line_item_customergroup_discount: p.product_line_item_customergroup_discount,
                product_exchange_rate: p.product_exchange_rate,
                product_exchange_rate_usd:p.product_exchange_rate_usd,
                complete_look: logicArgs.complete_look === 'true' ? true : false,
                product_feature_icons: p.product_feature_icons, // feature/benefit icons
            };
        }) || []
    };
    var searchData = {
        page_finding_method: SEARCH.page_finding_method,
        search_location: SEARCH.search_location,
        search_method: SEARCH.search_method,
        search_results_count: SEARCH.search_results_count,
        search_term: SEARCH.search_term,
        search_type: SEARCH.search_type
    };
    var gridData = {
        grid_stack_count: GRID.grid_stack_count,
        grid_visible_count: GRID.grid_visible_count,
        grid_total_count: GRID.grid_total_count,
        grid_has_loadmore: GRID.grid_has_loadmore,
        grid_double_ingrid: GRID.grid_double_ingrid,
        grid_single_ingrid: GRID.grid_single_ingrid,
        grid_video_count: GRID.grid_video_count,
        grid_has_guidedselling: GRID.grid_has_guidedselling,
        grid_sort_order: GRID.grid_sort_order,
        grid_paging_offset: GRID.grid_paging_offset,
        grid_top_content: GRID.grid_top_content,
        sfTestVariants : GRID.sfTestVariants,
        grid_refinement_attributes: (logicArgs.gridRefinementAttributes || '').split(',')
          .filter(function (val) { return val; })
          .map(function(a) {
            return { grid_refinement_attributes: a };
          })
    };
    var promoData = {
      promo_code: PROMO.promo_code,
      promo_segment: PROMO.promo_segment,
      promo_name: PROMO.promo_name,
      promo_trigger_id: PROMO.promo_trigger_id,
      promo_trigger_type: PROMO.promo_trigger_type,
      promo_class: PROMO.promo_class,
      promo_error_message: PROMO.promo_error_message
    };
    var cartData = {
        cart_subtotal: CART.cart_subtotal,
        cart_shipping: CART.cart_shipping,
        cart_discount: CART.cart_discount,
        cart_total: CART.cart_total,
        cart_tax: CART.cart_tax,
        cart_item_count: CART.cart_item_count,
        cart_payment_method: CART.cart_payment_method,
        cart_approaching_discount: CART.cart_approaching_discounts
    };
    var checkoutData = {
        checkout_step: checkoutStep(logicArgs.checkoutStage),
        checkout_prepopulatedFields: CHECKOUT.checkout_prepopulatedFields
    };
    // variables expected to be assigned by client-side events
    var clientSideOnlyData = {
        tealium_event: undefined,
        abandon_checkout_field: undefined,
        error_name: undefined
    };
    // variables needing investigation by UA
    var unknownData = {
        asset_elements: undefined,
        navigation_structure: undefined // see DTM productFindingMethod
    };
    var loyaltyData = {
        loyalty: ORDER.loyalty_order_data
    };
    const atSettings = {
        adobe_target: {
          featureFlag: 'adobeTargetEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('adobeTargetEnabled'),
          timeout: 'adobeTargetTimeout' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('adobeTargetTimeout') : null
        }
    };
    function objectsMerge(arrayOfObjects) {
        const out = {};
        arrayOfObjects.forEach(function extend(src) {
            Object.keys(src).forEach(function (key) { out[key] = src[key]; });
        });
        return out;
    }
    return {
        datalayer: objectsMerge([
            promoData,
            siteData,
            pageData,
            orderData,
            customerData,
            bopisData,
            pdpData,
            gridData,
            productData,
            searchData,
            cartData,
            checkoutData,
            clientSideOnlyData,
            unknownData,
            loyaltyData,
            atSettings
        ]),
        pageData: {
            locale: logicArgs && logicArgs.locale && (logicArgs.locale.id || '').toLowerCase().replace('_', '-')
        }
    };
}

server.use('Init', function (req, res, next) {
    var serverData = buildServerData(req);
    res.render('tealium/tealium_datalayer', {
        tealiumDataLayer: JSON.stringify(serverData.datalayer),
        serverPageData: JSON.stringify(serverData.pageData)
    });

    next();
});

module.exports = server.exports();
