'use strict';

var server = require('server');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
var ShippingMgr = require('dw/order/ShippingMgr');
var BasketMgr = require('dw/order/BasketMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var collections = require('*/cartridge/scripts/util/collections');
var StoreMgr = require('dw/catalog/StoreMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');
const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
server.extend(module.superModule);

/**
*
* @param {string} products - list of product details info in the form of "productId:quantity,productId:quantity,... "
* @returns {Object} a object containing product ID and quantity
*/
function buildProductListAsJson(products) {
    if (!products) {
        return null;
    }

    return products.split(',').map(function (item) {
        var properties = item.split(':');
        return { id: properties[0], quantity: properties[1] };
    });
}

server.append('GetStoreById', function (req, res, next) {
    var viewData = res.getViewData();
    viewData.checkoutView = req.querystring.checkoutView ? req.querystring.checkoutView : '';
    viewData.addressView = req.querystring.addressView ? req.querystring.addressView : '';
    res.render('cart/productCard/cartProductCardPickUpInStoreInfo', viewData);
    next();
});

server.replace('InventorySearch', function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var URLUtils = require('dw/web/URLUtils');
    var ArrayList = require('dw/util/ArrayList');
    var Locale = require('dw/util/Locale');

    var radius = req.querystring.radius;
    var postalCode = req.querystring.postalCode;
    var lat = req.querystring.lat || request.geolocation.latitude; // eslint-disable-line
    var long = req.querystring.long || request.geolocation.longitude; // eslint-disable-line
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;
    var prodPID = req.querystring.prodPID;
    var prodUUID = req.querystring.prodUUID;
    var products = buildProductListAsJson(req.querystring.products);
    var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line
    var distanceUnit = countryCode === 'US' ? 'miles' : 'km';
    var url = URLUtils.url('Stores-FindStores', 'showMap', showMap, 'products', req.querystring.products).toString();
    var preSelectedStoreCookie = storeHelpers.getPreSelectedStoreCookie();
    if (!preSelectedStoreCookie || (preSelectedStoreCookie && !preSelectedStoreCookie.ID)) {
        // use default shipping zipcode to preselect store if customer authenticated
        var addressBook = customer && customer.addressBook;
        if (addressBook && addressBook.getPreferredAddress()) {
            var prefferedAddress = addressBook.getPreferredAddress();
            postalCode = prefferedAddress.postalCode;
        }
    }
    var selectedStoreID = req.querystring.storeID;
    radius = storeHelpers.getDefaultRadius(radius);
    if (!postalCode && preSelectedStoreCookie && preSelectedStoreCookie.ID) {
        var store = StoreMgr.getStore(preSelectedStoreCookie.ID);
        if (store) {
            postalCode = store.postalCode;
            selectedStoreID = store.ID;
        }
    }

    var storesModel = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, url, products);
    if (!postalCode) {
        storesModel.stores = new ArrayList();
        postalCode = null;
    }

    var content = ContentMgr.getContent('store-not-available');
    var contentMarkUp = '';
    if (content && content.online && ('body' in content.custom && !empty(content.custom.body))) {
        contentMarkUp = content.custom.body.markup;
    }

    var viewData = {
        stores: storesModel,
        horizontalView: horizontalView,
        isForm: isForm,
        showMap: showMap,
        currentCountryCode: Locale.getLocale(req.locale.id).country,
        prodPID: prodPID,
        postalCode: postalCode,
        radius: radius,
        distanceUnit: distanceUnit,
        prodUUID: prodUUID,
        contentMarkUp: contentMarkUp
    };

    if (typeof selectedStoreID !== undefined && !empty(selectedStoreID)) {
        viewData.selectedStoreID = selectedStoreID;
        for (var i = 0; i < storesModel.stores.length; i++) {
            if (viewData.selectedStoreID === storesModel.stores[i].ID) {
                viewData.storePresentInResult = true;
                break;
            }
        }
    }

    var storesResultsHtml = storesModel.stores
        ? renderTemplateHelper.getRenderedHtml(viewData, 'storeLocator/storeLocatorNoDecorator')
        : null;

    storesModel.storesResultsHtml = storesResultsHtml;
    res.json(storesModel);
    next();
});

server.replace('FindStores', function (req, res, next) {
    var Locale = require('dw/util/Locale');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var radius = req.querystring.radius;
    var postalCode = (typeof req.querystring.postalCode === 'undefined' && typeof req.querystring.detectLocation !== 'undefined' && req.querystring.detectLocation === 'true' ) ? request.geolocation.postalCode : req.querystring.postalCode; // eslint-disable-line
    var lat = req.querystring.lat;
    var long = req.querystring.long;
    var showMap = req.querystring.showMap || false;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;
    var url = null;
    var products = buildProductListAsJson(req.querystring.products);

    var storesModel = storeHelpers.getStores(radius, postalCode, lat, long, req.geolocation, showMap, url, products);

    var content = ContentMgr.getContent('store-not-available');
    var contentMarkUp = '';
    if (content && content.online && ('body' in content.custom && !empty(content.custom.body))) {
        contentMarkUp = content.custom.body.markup;
    }

    if (products) {
        var context = {
            stores: storesModel,
            horizontalView: horizontalView,
            isForm: isForm,
            showMap: showMap,
            radius: radius,
            distanceUnit: Locale.getLocale(req.locale.id).country === 'US' ? 'miles' : 'km',
            contentMarkUp: contentMarkUp
        };

        if (typeof req.querystring.storeID !== undefined && !empty(req.querystring.storeID)) {
            context.selectedStoreID = req.querystring.storeID;
            for (var i = 0; i < storesModel.stores.length; i++) {
                if (context.selectedStoreID === storesModel.stores[i].ID) {
                    context.storePresentInResult = true;
                    break;
                }
            }
        }

        if (typeof postalCode !== undefined && !empty(postalCode)) {
            context.postalCode = postalCode;
        }

        var storesResultsHtml = storesModel.stores
            ? renderTemplateHelper.getRenderedHtml(context, 'storeLocator/storeLocatorResults')
            : null;

        storesModel.storesResultsHtml = storesResultsHtml;
        if (typeof req.querystring.postalCode === 'undefined' && typeof req.querystring.detectLocation !== 'undefined' && req.querystring.detectLocation === 'true') {
            storesModel.geolocationPostalCode = postalCode;
        }
    }

    res.json(storesModel);
    next();
});

server.replace('getAtsValue', function (req, res, next) {
    var Resource = require('dw/web/Resource');

    var productId = req.querystring.pid;
    var storeId = req.querystring.storeId;
    var quantitySelected = req.querystring.quantitySelected;
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(productId);
    const realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
    var maoAvaialability = null;
    var instoreInventory = null;
    if (isMAOEnabled && realTimeInventoryCallEnabled && product && storeId) {
        const Availability = require('int_mao/cartridge/scripts/availability/MAOAvailability');
        var items = null;

        if (Object.prototype.hasOwnProperty.call(product.custom, 'sku') && product.custom.sku) {
            items = [product.custom.sku];
            var locations = [storeId];
            maoAvaialability = Availability.getMaoAvailability(items, locations);
        } else {
            Logger.getLogger('mao_availability').info('MAOEmptySKU (Stores.js) : Product {0} has empty sku', product.ID);
        }

        if (maoAvaialability && maoAvaialability[items]) {
            maoAvaialability = JSON.parse(maoAvaialability[items]);
            instoreInventory = maoAvaialability.Quantity;
            if (maoAvaialability.Quantity < 1) {
                maoAvaialability.isProductOOS = true;
            }
        } else {
            instoreInventory = 0;
        }
    } else {
        var instorePUstoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
        instoreInventory = instorePUstoreHelpers.getStoreInventory(storeId, productId, quantitySelected);
    }

    var productAtsValue = {
        atsValue: instoreInventory,
        product: {
            available: !!instoreInventory,
            readyToOrder: !!instoreInventory,
            messages: [
                Resource.msg('label.instock', 'common', null)
            ]
        },
        resources: {
            info_selectforstock: Resource.msg('label.ats.notavailable', 'instorePickup', null)
        },
        maoAvaialability: maoAvaialability
    };

    res.json(productAtsValue);
    next();
});

server.get('UpdateBopisShipments', function(req, res, next) { // eslint-disable-line
    var format = 'format' in req.querystring ? req.querystring.format : '';
    var location = 'location' in req.querystring ? req.querystring.location : '';
    try {
        var isBopisInCart = true;
        var basket = BasketMgr.getCurrentBasket();
        var storeID = req.querystring.newStoreId;
        if (format === 'ajax' && location === 'PDP') {
            var isBopisShipment = collections.find(basket.shipments, function (item) {
                return item.custom.fromStoreId;
            });
            if (!isBopisShipment) {
                isBopisInCart = false;
            }
        }
        if (isBopisInCart) {
            var pid = req.querystring.pid;
            var UUID = req.querystring.uuid;
            var store = StoreMgr.getStore(storeID);
            storeHelpers.updateSelectedStoreCookie(store);

            var storeAddress = {
                address: {
                    firstName: store.name,
                    lastName: store.name,
                    address1: store.address1,
                    address2: store.address2,
                    city: store.city,
                    stateCode: store.stateCode,
                    postalCode: store.postalCode,
                    countryCode: store.countryCode.value,
                    phone: store.phone
                }
            };
            var changeAllItemsStore = false;
            if (pid === 'undefined' && UUID === 'undefined') {
                changeAllItemsStore = true;
            }
            var shippingMethods = ShippingMgr.getShipmentShippingModel(basket.defaultShipment).getApplicableShippingMethods();
            var storePickUpShippingMethod = collections.find(shippingMethods, function (method) {
                return method.custom.storePickupEnabled;
            });
            if (!storePickUpShippingMethod) {
                storePickUpShippingMethod = basket.defaultShipment.shippingMethod;
            }
            var shipment = collections.find(basket.shipments, function (item) {
                return item.custom.fromStoreId;
            });
            if (pid !== 'undefined' && pid !== undefined) {
                var productLi = collections.find(basket.productLineItems, function (item) {
                    return item.productID === pid && item.UUID === UUID;
                });
                Transaction.wrap(function () {
                    if (shipment) {
                        productLi.setShipment(shipment);
                    } else {
                        var uuid = UUIDUtils.createUUID();
                        shipment = basket.createShipment(uuid);
                        shipment.setShippingMethod(storePickUpShippingMethod);
                        productLi.setShipment(shipment);
                    }
                });
            }
            if (shipment.productLineItems.length > 0) {
                Transaction.wrap(function () {
                    shipment.custom.fromStoreId = storeID;
                    shipment.custom.shipmentType = 'in-store';
                    COHelpers.copyShippingAddressToShipment(storeAddress, shipment);
                    var PLI = shipment.productLineItems;
                    for (let m = 0; m < PLI.length; m++) {
                        PLI[m].setShipment(shipment);
                        PLI[m].custom.fromStoreId = storeID;
                    }
                });
            }
            var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
            var giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
            Transaction.wrap(function () {
                cartHelper.mergeLineItems(basket);
                cartHelper.defaultShipToAddressIfAny(basket);
            });
            // Below line of code will split the single shipment into multiple shipment if the basket has the e-gift card item.
            Transaction.wrap(function () {
                giftcardHelper.updateGiftCardShipments(basket);
            });
            giftcardHelper.removeEmptyShipments(basket);
        }
    } catch (e) {
        Logger.error('Store.js - Error while updating shipments: ' + e.message);
    } finally {
        if (format === 'ajax' && location === 'PDP') {
            res.json({ success: true }); // PDP ajax call . redirect is not required.
        } else {
            response.redirect(require('dw/web/URLUtils').https('Cart-Show', 'changeAllItemsStore', changeAllItemsStore, 'cartProdPid', pid, 'cartProdUUID', UUID)); // eslint-disable-line
        }
    }
});

server.get('ShipToAddress', function(req, res, next) { // eslint-disable-line
    try {
        var basket = BasketMgr.getCurrentBasket();
        var pid = req.querystring.pid;
        var UUID = req.querystring.uuid;
        var productLi = collections.find(basket.productLineItems, function (item) {
            return item.productID === pid && item.UUID === UUID;
        });
        var shipment = collections.find(basket.shipments, function (item) {
            return !item.custom.fromStoreId && item.shippingMethodID !== 'eGift_Card';
        });
        Transaction.wrap(function () {
            if (!shipment) {
                var uuid = UUIDUtils.createUUID();
                shipment = basket.createShipment(uuid);
                productLi.setShipment(shipment);
                var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
                var shipmentModel = ShippingMgr.getShipmentShippingModel(basket.defaultShipment);
                var applicableShippingMethods = shipmentModel.applicableShippingMethods;
                if (collections.find(applicableShippingMethods, function (sMethod) {
                        return sMethod.ID === defaultShippingMethod.ID; // eslint-disable-line
                    })) { // eslint-disable-line
                    shipment.setShippingMethod(defaultShippingMethod);
                }
                shipment.createShippingAddress();
            } else {
                productLi.setShipment(shipment);
            }
            if ('fromStoreId' in productLi.custom && !empty(productLi.custom.fromStoreId)) {
                delete productLi.custom.fromStoreId;
            }
            var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
            cartHelper.mergeLineItems(basket);
            cartHelper.defaultShipToAddressIfAny(basket);
        });
        var giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
         // Below line of code will split the single shipment into multiple shipment if the basket has the e-gift card item.
        Transaction.wrap(function () {
            giftcardHelper.updateGiftCardShipments(basket);
        });
        giftcardHelper.removeEmptyShipments(basket);
    } catch (e) {
        Logger.error('Store.js - Error while updating shipments: ' + e.message);
    } finally {
        response.redirect(require('dw/web/URLUtils').https('Cart-Show')); // eslint-disable-line
    }
});

module.exports = server.exports();
