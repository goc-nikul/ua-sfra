'use strict';

var ShippingMgr = require('dw/order/ShippingMgr');
var collections = require('*/cartridge/scripts/util/collections');
var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');

/* Script modules */
/**
 * This module extends shippingHelpers.js as defined in app_storefront_base. It exports
 * everything from the base module and overrides or adds to module.exports.
 */
var base = require('app_storefront_base/cartridge/scripts/checkout/shippingHelpers');
var plugin = require('plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers');

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Basket} basket - the target Basket
 * @param {string} uuid - the matching UUID to match against Shipments
 * @returns {dw.order.Shipment} a Shipment object
 */
function getShipmentByUUID(basket, uuid) {
    if (!basket) return null;

    return collections.find(basket.shipments, function (shipment) {
        return shipment.UUID === uuid;
    });
}

/**
 * Retrieve raw address JSON object from request.form
 * @param {Request} req - the DW Request object
 * @returns {Object} - raw JSON representing address form data
 */
function getAddressFromRequest(req) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Locale = require('dw/util/Locale');
    var Site = require('dw/system/Site');
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    // eslint-disable-next-line no-undef
    var currentLocale = Locale.getLocale(request.getLocale());
    var countryCode = (currentLocale && currentLocale.country) || 'US';
    var shipment;
    if (shipmentUUID) {
        shipment = getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }
    var shippingAddress = shipment.shippingAddress;
    if (currentBasket && currentBasket.custom && currentBasket.custom.isCommercialPickup && shippingAddress) {
        var currentCustomer = req.currentCustomer.raw;
        var customerFirstName = Site.current.getCustomPreferenceValue('shippingFirstName') || 'Collection';
        var customerLastName = Site.current.getCustomPreferenceValue('shippingLastName') || 'Point';
        if (currentCustomer && currentCustomer.profile) {
            customerFirstName = currentCustomer.profile.firstName || customerFirstName;
            customerLastName = currentCustomer.profile.lastName || customerLastName;
        }
        return {
            firstName: customerFirstName || 'Collection',
            lastName: customerLastName || 'Point',
            address1: shippingAddress.address1 || '',
            address2: shippingAddress.address2 || '',
            city: shippingAddress.city || '',
            stateCode: shippingAddress.stateCode || '',
            postalCode: shippingAddress.postalCode || '',
            countryCode: countryCode || ''
        };
    } else { // eslint-disable-line
        return {
            firstName: req.form.firstName,
            lastName: req.form.lastName,
            address1: req.form.address1,
            address2: req.form.address2,
            city: req.form.city,
            stateCode: req.form.stateCode,
            postalCode: req.form.postalCode,
            countryCode: req.form.countryCode,
            phone: req.form.phone
        };
    }
}

/**
 * Validates and return true for non shoprunner method and for shop runner returns login status
 * @param {Object} method dw Shipping method
 * @returns {boolean} returns true for non shoprunner method and for shop runner returns login status
 */
function isShopRunnerEligible(method) {
    var Site = require('dw/system/Site');
    var shopRunnerEnabled = Site.getCurrent().getCustomPreferenceValue('sr_enabled');
    return (method.ID !== 'shoprunner') || (shopRunnerEnabled && !empty(session.custom.srtoken));
}

/**
 * Returns the first shipping method (and maybe prevent in store pickup)
 * @param {dw.util.Collection} methods - Applicable methods from ShippingShipmentModel
 * @param {boolean} filterPickupInStore - whether to exclude PUIS method
 * @returns {dw.order.ShippingMethod} - the first shipping method (maybe non-PUIS)
 */
function getFirstApplicableShippingMethod(methods, filterPickupInStore) {
    var method = null;
    var iterator = methods.iterator();
    while (iterator.hasNext()) {
        var tMethod = iterator.next();
        if (!filterPickupInStore || (filterPickupInStore && !tMethod.custom.storePickupEnabled && isShopRunnerEligible(tMethod))) {
            method = tMethod;
            break;
        }
    }
    return method;
}

/**
 * Returns true if basket have pre-order mask products
 * @returns {boolean} - true if basket have pre-order mask products
 */
function basketHavePreOrderProducts() {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var hasPreOrderProductsInBasket = false;
    if (currentBasket) {
        collections.forEach(currentBasket.productLineItems, function (productLineItem) {
            if (productLineItem && productLineItem.product && productLineItem.product.custom && productLineItem.product.custom.isPreOrder) {
                if (!hasPreOrderProductsInBasket) {
                    hasPreOrderProductsInBasket = true;
                }
            }
        });
    }
    return hasPreOrderProductsInBasket;
}

/**
 * Returns applicable shipping methods for a given shipment and shipping address.
 * @param {dw.order.Shipment} shipment - the target Shipment
 * @param {Object} [address] - optional address object
 * @returns {dw.util.Collection} an array of ShippingModels
 */
function getApplicableShippingMethods(shipment, address) {
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var baseAddress = address;
    if (!address && shipment && !shipment.shippingAddress) {
        baseAddress = {};
    }
    if (!shipment) return null;

    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    var shippingMethods;
    if (baseAddress) {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods(baseAddress);
    } else {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    // Move Pickup in store method to the end of the list
    var pickupInstoreMethod = collections.find(shippingMethods, function (method) {
        return method.custom.storePickupEnabled;
    });
    var defaultShippingMethodID = currentBasket && currentBasket.getDefaultShipment() && currentBasket.getDefaultShipment().getShippingMethod() ? currentBasket.getDefaultShipment().getShippingMethod().getID() : '';
    if (pickupInstoreMethod && !empty(defaultShippingMethodID) && defaultShippingMethodID !== 'store-pickup') {
        shippingMethods.remove(pickupInstoreMethod);
    }
    var hasPreOrderProductsInBasket = basketHavePreOrderProducts();
    var isHALshipping = (!empty(currentBasket) && 'isCommercialPickup' in currentBasket.custom && currentBasket.custom.isCommercialPickup) ? currentBasket.custom.isCommercialPickup : false;
    // Filter out whatever the method associated with in store pickup && shippingMethod.ID !== 'Borderfree'
    var filteredMethods = [];
    var filteredMethodUSPSPOB = [];
    var isUspsPob = false;
    var siteId = Site.getCurrent().getID();
    collections.forEach(shippingMethods, function (shippingMethod) {
        if (shippingMethod.ID === 'standard-usps-pob' && siteId.toLowerCase() === 'us') {
            filteredMethodUSPSPOB.push(new ShippingMethodModel(shippingMethod, shipment));
            isUspsPob = true;
        }
        if (!isHALshipping) {
            if ((!shippingMethod.custom.storePickupEnabled || (shippingMethod.custom.storePickupEnabled && Site.current.getCustomPreferenceValue('isBOPISEnabled'))) &&
                shippingMethod.ID !== 'Borderfree' && shippingMethod.ID !== 'eGift_Card' && !(shippingMethod.ID === 'shoprunner' && customer.isMemberOfCustomerGroup('CSR')) && !shippingMethod.custom.isHALshippingMethod) {
                if (shippingMethod.ID === 'standard-pre-order-AK-HI') {
                    if (hasPreOrderProductsInBasket) {
                        filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
                    }
                } else {
                    filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
                }
            }
        } else if (shippingMethod.custom.isHALshippingMethod && isHALshipping) {
            filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
        }
    });

    return isUspsPob ? filteredMethodUSPSPOB : filteredMethods;
}

/**
 * Returns applicable shipping methods for a given shipment and shipping address.
 * @param {dw.order.Shipment} shipment - the target Shipment
 * @param {Object} [address] - optional address object
 * @returns {dw.util.Collection} an array of ShippingModels
 */
function filterApplicableShippingMethods(shipment, address) {
    var Site = require('dw/system/Site');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var baseAddress = address;
    if (!address && shipment && !shipment.shippingAddress) {
        baseAddress = {};
    }
    if (!shipment) return null;

    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    var shippingMethods;
    if (baseAddress) {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods(baseAddress);
    } else {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    // Move Pickup in store method to the end of the list
    var pickupInstoreMethod = collections.find(shippingMethods, function (method) {
        return method.custom.storePickupEnabled;
    });
    if (pickupInstoreMethod) {
        shippingMethods.remove(pickupInstoreMethod);
        shippingMethods.add(pickupInstoreMethod);
    }
    var hasPreOrderProductsInBasket = basketHavePreOrderProducts();
    var isHALshipping = (!empty(currentBasket) && 'isCommercialPickup' in currentBasket.custom && currentBasket.custom.isCommercialPickup) ? currentBasket.custom.isCommercialPickup : false;
    // Filter out whatever the method associated with in store pickup && shippingMethod.ID !== 'Borderfree'
    var ArrayList = require('dw/util/ArrayList');
    var filteredMethods = new ArrayList();
    var filteredMethodUSPSPOB = new ArrayList();
    var isUspsPob = false;
    var siteId = Site.getCurrent().getID();
    collections.forEach(shippingMethods, function (shippingMethod) {
        if (shippingMethod.ID === 'standard-usps-pob' && siteId.toLowerCase() === 'us') {
            filteredMethodUSPSPOB.push(shippingMethod);
            isUspsPob = true;
        }
        if (!isHALshipping) {
            if ((!shippingMethod.custom.storePickupEnabled || (shippingMethod.custom.storePickupEnabled && Site.current.getCustomPreferenceValue('isBOPISEnabled'))) &&
                shippingMethod.ID !== 'Borderfree' && shippingMethod.ID !== 'eGift_Card' && !(shippingMethod.ID === 'shoprunner' && customer.isMemberOfCustomerGroup('CSR')) && !shippingMethod.custom.isHALshippingMethod) {
                if (shippingMethod.ID === 'standard-pre-order-AK-HI') {
                    if (hasPreOrderProductsInBasket) {
                        filteredMethods.push(shippingMethod);
                    }
                } else {
                    filteredMethods.push(shippingMethod);
                }
            }
        } else if (shippingMethod.custom.isHALshippingMethod && isHALshipping) {
            filteredMethods.push(shippingMethod);
        }
    });

    return isUspsPob ? filteredMethodUSPSPOB : filteredMethods;
}
/**
 * This method returns the shippingMethod by accepting shipping methodID as parameter
 *
 * @param {string} shippingMethodID - shippingMethod ID
 * @returns {dw.order.ShippingMethod} shippingMethodFound - shippingMethod matches with given ID
 */
function getShippingMethodByID(shippingMethodID) {
    var allShippingMethods = ShippingMgr.getAllShippingMethods();
    var shippingMethodFound;
    // loop through the shipping methods to get shipping method
    var iterator = allShippingMethods.iterator();
    while (iterator.hasNext()) {
        var shippingMethod = iterator.next();
        if (shippingMethod.ID === shippingMethodID) {
            shippingMethodFound = shippingMethod;
            break;
        }
    }
    return shippingMethodFound;
}

/**
 * This method sets the shippingMethod price based on shipping promotion discount price
 *
 * @param {dw.order} order - order
 */
function setShippingMethodPromotionalPrice(order) {
    var applicableShippingMethods = order && order.shipping[0].applicableShippingMethods;
    var selectedShippingMethod = order && order.shipping[0] && order.shipping[0].selectedShippingMethod;
    if (!selectedShippingMethod) {
        return;
    }
    var shippingDisocuntedPrice = order.totals && order.totals.shippingLevelDiscountTotal.formatted;
    var shippingTotalCost = order.totals && order.totals.totalShippingCost;
    var currencyCode = order && order.currencyCode;
    for (var i = 0; i < applicableShippingMethods.length; i++) { // eslint-disable-line
        var shippingMethod = applicableShippingMethods[i];
        if ((shippingMethod.ID === selectedShippingMethod.ID) && (shippingDisocuntedPrice === shippingTotalCost)) {
            var Money = require('dw/value/Money');
            shippingMethod.shippingCost = require('dw/util/StringUtils').formatMoney(new Money(0, currencyCode));
            selectedShippingMethod.shippingCost = require('dw/util/StringUtils').formatMoney(new Money(0, currencyCode));
            break;
        }
    }
}

/**
 * Sets the shipping method of the basket's default shipment
 * @param {dw.order.Shipment} shipment - Any shipment for the current basket
 * @param {string} shippingMethodID - The shipping method ID of the desired shipping method
 * @param {dw.util.Collection} shippingMethods - List of applicable shipping methods
 * @param {Object} address - the address
 */
function selectShippingMethod(shipment, shippingMethodID, shippingMethods, address) {
    var applicableShippingMethods;
    var defaultShippingMethod = ShippingMgr.getDefaultShippingMethod();
    var shippingAddress;

    if (address && shipment) {
        shippingAddress = shipment.shippingAddress;

        if (shippingAddress) {
            if (address.stateCode && shippingAddress.stateCode !== address.stateCode) {
                shippingAddress.stateCode = address.stateCode;
            }
            if (address.postalCode && shippingAddress.postalCode !== address.postalCode) {
                shippingAddress.postalCode = address.postalCode;
            }
        }
    }

    var isShipmentSet = false;

    if (shippingMethods) {
        applicableShippingMethods = shippingMethods;
    } else {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var shipmentAddress = shipment ? shipment.shippingAddress : null;
        if (currentBasket && currentBasket.custom.isCommercialPickup && shipmentAddress) {
            var searchAddress = {};
            searchAddress.countryCode = shipmentAddress.countryCode.value;
            searchAddress.stateCode = shipmentAddress.stateCode;
            searchAddress.postalCode = shipmentAddress.postalCode;
            searchAddress.city = shipmentAddress.city;
            searchAddress.address1 = shipmentAddress.address1;
            searchAddress.address2 = shipmentAddress.address2;
            applicableShippingMethods = filterApplicableShippingMethods(shipment, searchAddress);
        } else {
            applicableShippingMethods = filterApplicableShippingMethods(shipment, address);
        }
    }
    var hasPreOrderProductsInBasket = basketHavePreOrderProducts();
    if (!hasPreOrderProductsInBasket && applicableShippingMethods.length > 0) {
        var preOrderShippingMethod = getShippingMethodByID('standard-pre-order-AK-HI');
        if (preOrderShippingMethod) {
            applicableShippingMethods.remove(preOrderShippingMethod);
        }
    }

    // Removing the eGiftCard Shipping method for non-giftcard shipments
    if (shipment.ID !== 'EGiftCardShipment') {
        var eGiftCardShippingMethod = getShippingMethodByID('eGift_Card');
        if (eGiftCardShippingMethod) {
            applicableShippingMethods.remove(eGiftCardShippingMethod);
        }
    }

    if (shippingMethodID && !shipment.custom.fromStoreId) {
        // loop through the shipping methods to get shipping method
        var iterator = applicableShippingMethods.iterator();
        while (iterator.hasNext()) {
            var shippingMethod = iterator.next();
            if (shippingMethod.ID === shippingMethodID && isShopRunnerEligible(shippingMethod)) {
                shipment.setShippingMethod(shippingMethod);
                isShipmentSet = true;
                break;
            }
        }
    }

    if (!isShipmentSet && !shipment.custom.fromStoreId) {
        if (collections.find(applicableShippingMethods, function (sMethod) {
            return sMethod.ID === defaultShippingMethod.ID;
        })) {
            shipment.setShippingMethod(defaultShippingMethod);
        } else if (applicableShippingMethods.length > 0) {
            var firstMethod = getFirstApplicableShippingMethod(applicableShippingMethods, true);
            shipment.setShippingMethod(firstMethod);
        } else {
            shipment.setShippingMethod(null);
        }
    }
}

/**
 * This method set the shippingMethod cost zero in case of BOPIS mixed scenario
 * @param {dw.order.Basket} basket - The current basket
 */
function setShippingMethodPrice(basket) {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().getCustomPreferenceValue('isBOPISEnabled')) {
        var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
        var totalShipmentCostThreshold = 'totalShipmentCostThreshold' in Site.current.preferences.custom ? Site.getCurrent().getCustomPreferenceValue('totalShipmentCostThreshold') : null;
        if (instorePickupStoreHelpers.basketHasInStorePickUpShipment(basket.shipments) && !instorePickupStoreHelpers.basketHasOnlyBOPISProducts(basket.shipments)) {
            var shipmentCost = 0;
            var shippingPrice = 0;
            collections.forEach(basket.getShipments(), function (shipment) {
                var shipMethod = shipment.getShippingMethod();
                if (shipMethod) {
                    var isIncludeBopisShipmentCost = 'isIncludeBopisShipmentCost' in shipMethod.custom ? shipMethod.custom.isIncludeBopisShipmentCost : false;
                    if (isIncludeBopisShipmentCost || shipMethod.custom.storePickupEnabled) {
                        var shippingModel = ShippingMgr.getShipmentShippingModel(shipment);
                        shippingPrice += shippingModel.getShippingCost(shipMethod).getAmount().value;
                        shipmentCost += shipment.adjustedMerchandizeTotalPrice.value;
                    }
                }
            });
            if (shippingPrice > 0 && shipmentCost !== 0 && shipmentCost >= totalShipmentCostThreshold) {
                var shipmentsIterator = basket.shipments.iterator();
                while (shipmentsIterator.hasNext()) {
                    var shipment = shipmentsIterator.next();
                    if (!shipment.custom.fromStoreId) {
                        var shippingLineItems = shipment.getShippingLineItems();
                        if (shippingLineItems) {
                            var shippingLineItem = shippingLineItems[0];
                            shippingLineItem.setPriceValue(0);
                            break;
                        }
                    }
                }
            }
        }
    }
}


module.exports = base;
module.exports = plugin;
// Export any overrides and additions defined in this module
module.exports.getShipmentByUUID = getShipmentByUUID;
module.exports.getApplicableShippingMethods = getApplicableShippingMethods;
module.exports.filterApplicableShippingMethods = filterApplicableShippingMethods;
module.exports.setShippingMethodPromotionalPrice = setShippingMethodPromotionalPrice;
module.exports.getShippingMethodByID = getShippingMethodByID;
module.exports.selectShippingMethod = selectShippingMethod;
module.exports.getAddressFromRequest = getAddressFromRequest;
module.exports.setShippingMethodPrice = setShippingMethodPrice;
