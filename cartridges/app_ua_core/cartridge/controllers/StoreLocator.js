'use strict';

var server = require('server');

/* API Includes */
var Site = require('dw/system/Site');

/* Global variables */
var currentSite = Site.getCurrent();

var brandifyMobileURL = currentSite.getCustomPreferenceValue('brandifyMobileURL');
var brandifyTabletURL = currentSite.getCustomPreferenceValue('brandifyTabletURL');
var brandifyDesktopURL = currentSite.getCustomPreferenceValue('brandifyDesktopURL');

/* Script Includes */
var storeLocator = require('*/cartridge/scripts/utils/libBrandify');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.use('Find', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var content = ContentMgr.getContent('store-locator');
    if (content) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, content);
    }
    res.render('stores/storeLocator', {
        brandifyMobileURL: storeLocator.createStoreLocatorURL(brandifyMobileURL),
        brandifyTabletURL: storeLocator.createStoreLocatorURL(brandifyTabletURL),
        brandifyDesktopURL: storeLocator.createStoreLocatorURL(brandifyDesktopURL),
        brandifySrcURL: storeLocator.createStoreLocatorURL(brandifyDesktopURL),
        dataCountry: storeLocator.getStoreCountryCode(),
        dataPostalCode: storeLocator.getStorePostalCode()
    });
    next();
}, pageMetaData.computedPageMetaData);

server.get('SelectStore', function (req, res, next) {
    var viewData = res.getViewData();

    var URLUtils = require('dw/web/URLUtils');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');

    var inStorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
    var StoreModel = require('*/cartridge/models/store');

    var requestData = req.querystring;
    var store = StoreMgr.getStore(requestData.storeID);
    var selectedStore = new StoreModel(store);
    var storeInventory = !empty(store) ? inStorePickupStoreHelpers.getStoreInventory(store.ID, requestData.pid) : '';
    var product = ProductMgr.getProduct(requestData.pid);
    var availabilityMessage = requestData.productAvailabilityMsg;
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    selectedStore = storeHelpers.findStoreById(requestData.storeID);
    var productList = [{ id: requestData.pid, quantity: 1 }];
    var storeModel = { stores: [selectedStore] };
    var storeAvailabilityObj = storeHelpers.getStoreAvailability(storeModel, productList);
    var Resource = require('dw/web/Resource');
    var bopisSelected = false;
    var bopisStock = false;
    if (storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] && 'productInStoreInventory' in storeAvailabilityObj.stores[0] && storeAvailabilityObj.stores[0].productInStoreInventory) {
        bopisSelected = true;
        bopisStock = true;
    } else {
        availabilityMessage = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
    }
    storeHelpers.updateSelectedStoreCookie(selectedStore, availabilityMessage, bopisSelected, bopisStock);

    viewData.pickUpInStore = {
        storeInventory: storeInventory,
        selectedStore: selectedStore,
        searchPostalCode: requestData.searchPostalCode,
        searchRadius: requestData.searchRadius,
        actionUrl: URLUtils.url('Stores-InventorySearch', 'showMap', false, 'horizontalView', true, 'isForm', true).toString(),
        atsActionUrl: URLUtils.url('Stores-getAtsValue').toString(),
        enabled: 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled') && product.custom.availableForInStorePickup !== false,
        readyToOrder: requestData.readyToOrder,
        productAvailability: requestData.productAvailabilityMsg
    };

    res.render('inStorePickUp/pdpPickUpInStore');
    next();
});

server.get('selectStoreByCoordinates', function (req, res, next) {
    var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var preSelectedStoreCookie = cookieHelper.read('preSelectedStore');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var URLUtils = require('dw/web/URLUtils');
    var lat = request.geolocation ? request.geolocation.latitude : null; // eslint-disable-line
    var long = request.geolocation ? request.geolocation.longitude : null; // eslint-disable-line
    var pid = req.querystring.pid;
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(pid);

    if (!product) {
        res.setStatusCode(404);
        res.json({
            errorMessage: 'Cannot find product ID ' + pid,
            success: false
        });
    }

    var viewData = res.getViewData();
    var quickViewEnable = 'quickViewEnable' in req.querystring ? req.querystring.quickViewEnable : false;
    var storesModel;
    viewData.pickUpInStore = {
        actionUrl: URLUtils.url('Stores-InventorySearch', 'showMap', false, 'horizontalView', true, 'isForm', true).toString(),
        atsActionUrl: URLUtils.url('Stores-getAtsValue').toString(),
        enabled: 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled') && !empty(product) && product.custom.availableForInStorePickup !== false,
        readyToOrder: req.querystring.readyToOrder,
        searchRadius: storeHelpers.getDefaultRadius(),
        quickViewEnable: quickViewEnable
    };
    var htmlContent = renderTemplateHelper.getRenderedHtml(viewData, 'inStorePickUp/pdpChoosePickUpInStore');
    if (preSelectedStoreCookie) {
        preSelectedStoreCookie = JSON.parse(preSelectedStoreCookie);
    }
    if (!preSelectedStoreCookie || (preSelectedStoreCookie && !preSelectedStoreCookie.ID)) {
        // use default shipping zipcode to preselect store if customer authenticated
        var addressBook = customer && customer.addressBook;
        if (addressBook && addressBook.getPreferredAddress()) {
            var prefferedAddress = addressBook.getPreferredAddress();
            var postalCode = prefferedAddress.postalCode;
            storesModel = storeHelpers.preSelectStoreByLocation(lat, long, postalCode);
        } else {
            storesModel = storeHelpers.preSelectStoreByLocation(lat, long, null);
        }
        var selectedStore = storesModel.stores.filter(function (store) { // eslint-disable-line
            if (store.enableStore !== false) {
                return store;
            }
        })[0];
        var storeData = {};
        var Resource = require('dw/web/Resource');
        if (selectedStore) {
            storeData.ID = selectedStore.ID;
            storeData.name = selectedStore.name;
            storeData.address1 = selectedStore.address1;
            viewData.pickUpInStore.selectedStore = selectedStore;
            viewData.pickUpInStore.searchPostalCode = selectedStore.postalCode;

            // MAO availability check for product & store
            var productList = [{ id: (!empty(product) && product) ? product.ID : '', quantity: 1 }];
            var storeModel = { stores: [selectedStore] };
            var storeAvailabilityObj = storeHelpers.getStoreAvailability(storeModel, productList);
            viewData.pickUpInStore.productAvailability = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] ? storeAvailabilityObj.stores[0].availabilityMessage : null;
            htmlContent = renderTemplateHelper.getRenderedHtml(viewData, 'inStorePickUp/pdpPickUpInStore');
            storeData.availableMsg = storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] ? storeAvailabilityObj.stores[0].availabilityMessage : Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
            if (storeAvailabilityObj && storeAvailabilityObj.stores && storeAvailabilityObj.stores[0] && 'productInStoreInventory' in storeAvailabilityObj.stores[0] && storeAvailabilityObj.stores[0].productInStoreInventory) {
                storeData.bopisSelected = true;
                storeData.bopisStock = true;
            } else {
                storeData.bopisSelected = false;
                storeData.bopisStock = false;
                storeData.availableMsg = Resource.msg('cart.store.tealium.pickup.unavailable', 'storeLocator', null);
            }
        } else {
            storeData.noStoreAvailable = true;
            storeData.bopisSelected = false;
            storeData.bopisStock = false;
            storeData.availableMsg = Resource.msg('cart.store.tealium.pickup.selectstore', 'storeLocator', null);
        }
        storeData = JSON.stringify(storeData);
        if (preSelectedStoreCookie) {
            cookieHelper.deleteCookie('preSelectedStore');
        }
        var cookieExpirationInSecs = Site.getCurrent().getCustomPreferenceValue('selectStorecookieExpirationTime');
        cookieHelper.create('preSelectedStore', storeData, cookieExpirationInSecs);
    }
    res.json({
        htmlContent: htmlContent,
        success: true
    });
    next();
});

module.exports = server.exports();
