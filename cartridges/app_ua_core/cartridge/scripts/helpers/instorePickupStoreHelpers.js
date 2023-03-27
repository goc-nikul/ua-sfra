'use strict';

var base = require('plugin_instorepickup/cartridge/scripts/helpers/instorePickupStoreHelpers');
var Transaction = require('dw/system/Transaction');

/**
 * Returns the available to sell value for the product at the specified store.
 * @param {dw.util.Collection} shipments - the store ID to lookup the inventory
 * @returns {boolean} flag - the available to sell value
 */
function basketHasInStorePickUpShipment(shipments) {
    if (shipments.length > 0) {
        var shipmentsIterator = shipments.iterator();
        while (shipmentsIterator.hasNext()) {
            var shipment = shipmentsIterator.next();
            if (shipment.productLineItems.length > 0) {
                if (shipment.custom.fromStoreId) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Returns the basketHasOnlyBOPISProducts value.
 * @param {dw.util.Collection} shipments - Basket Shipments
 * @returns {boolean} flag - the basketHasOnlyBOPISProducts value
 */
function basketHasOnlyBOPISProducts(shipments) {
    var hasOnlyBopisProducts = false;
    var shipmentsIterator = shipments.iterator();
    while (shipmentsIterator.hasNext()) {
        var shipment = shipmentsIterator.next();
        if (shipment && shipment.productLineItems.length > 0) {
            if (shipment.custom && shipment.custom.fromStoreId) {
                hasOnlyBopisProducts = true;
            } else {
                hasOnlyBopisProducts = false;
                break;
            }
        }
    }
    return hasOnlyBopisProducts;
}

/**
 * Merge shipToAddress shipments and update the quantity.
 * @param {dw.order.Basket} basket - The current basket
 * @returns {boolean} flag - shipmentMerged value
 */
function mergeShipmentsInBasket(basket) {
    var shipmentMerged = false;
    for (let k = 0; k < basket.shipments.length; k++) {
        var shipment = basket.shipments[k];
        if (shipment.productLineItems.length > 0) {
            var productLi = shipment.productLineItems[0];
            for (let j = k + 1; j < basket.shipments.length; j++) {
                var currentShipment = basket.shipments[j];
                if (currentShipment.productLineItems.length > 0) {
                    if ((currentShipment.UUID !== shipment.UUID) && (currentShipment.shippingMethod.ID === shipment.shippingMethod.ID)) {
                        var prodLi = currentShipment.productLineItems ? currentShipment.productLineItems[0] : ''; // eslint-disable-line
                        Transaction.wrap(function() { //eslint-disable-line
                            if (!(shipment.shippingMethod.custom.storePickupEnabled) && !(currentShipment.shippingMethod.custom.storePickupEnabled) && (currentShipment.shippingMethodID !== 'eGift_Card')) {
                                if (productLi.productID === prodLi.productID) {
                                    productLi.setQuantityValue(prodLi.quantity.value + productLi.quantity.value);
                                    basket.removeProductLineItem(prodLi);
                                    shipmentMerged = true;
                                } else {
                                    prodLi.setShipment(shipment);
                                    shipmentMerged = true;
                                }
                            } else if (shipment.shippingMethod.custom.storePickupEnabled && currentShipment.shippingMethod.custom.storePickupEnabled) {
                                if (productLi.productID === prodLi.productID && productLi.custom.fromStoreId === prodLi.custom.fromStoreId) {
                                    productLi.setQuantityValue(prodLi.quantity.value + productLi.quantity.value);
                                    basket.removeProductLineItem(prodLi);
                                    shipmentMerged = true;
                                }
                            }
                        });
                    }
                }
            }
        }
    }
    return shipmentMerged;
}

/**
 * split shipToAddress shipments.
 * @param {dw.order.Basket} basket - The current basket
 * @returns {boolean} flag - the splitShipmentsForBOPIS value
 */
function splitShipmentsForBOPIS(basket) {
    var UUIDUtils = require('dw/util/UUIDUtils');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    if (basket.shipments.length > 1) {
        for (let k = 0; k < basket.shipments.length; k++) {
            var shipment = basket.shipments[k];
            if (!(!empty(shipment.shippingMethod) && shipment.shippingMethod.custom.storePickupEnabled) && (shipment.shippingMethodID !== 'eGift_Card') && (shipment.productLineItems.length > 1)) {
                for (let j = 1; j < shipment.productLineItems.length; j++) {
                    var productLi = shipment.productLineItems[j];
                    Transaction.wrap(function () { //eslint-disable-line
                        var newShipment = basket.createShipment(UUIDUtils.createUUID());
                        if (shipment.shippingAddress) {
                            var shippingAddress = {};
                            shippingAddress.address = shipment.shippingAddress;
                            COHelpers.copyShippingAddressToShipment(shippingAddress, newShipment);
                        }
                        newShipment.setShippingMethod(shipment.shippingMethod);
                        productLi.setShipment(newShipment);
                    });
                }
                return true;
            }
        }
    }
    return false;
}

/**
 * Transition from BOPIS to Ship To Address shipment on login as VIP.
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Object} req - the request object needed to access session.privacyCache
 */
function updateToShipToAddressShipment(currentBasket, req) {
    var collections = require('*/cartridge/scripts/util/collections');
    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var shipments = currentBasket.shipments;
    var defaultShipment = currentBasket.defaultShipment;

    // combine multiple shipments into a single one
    Transaction.wrap(function () {
        if ('fromStoreId' in defaultShipment.custom && defaultShipment.custom.fromStoreId) {
            delete defaultShipment.custom.fromStoreId;
            delete defaultShipment.custom.storePickupMessage;
            delete defaultShipment.custom.shipmentType;
        }

        collections.forEach(shipments, function (shipment) {
            if (shipment.ID !== 'EGiftCardShipment' && shipment.shippingMethodID !== 'eGift_Card') {
                collections.forEach(shipment.productLineItems, function (item) {
                    var lineItem = item;
                    if ('fromStoreId' in lineItem.custom && !empty(lineItem.custom.fromStoreId)) {
                        delete lineItem.custom.fromStoreId;
                        delete lineItem.custom.primaryContactBOPIS;
                        delete lineItem.custom.secondaryContactBOPIS;
                    }
                    if (!shipment.default) {
                        var productLineItems = defaultShipment.getProductLineItems();
                        var shipmentLineItem;
                        for (var i = 0; i < productLineItems.length; i++) {
                            if (productLineItems[i].shipment.ID === defaultShipment.ID && productLineItems[i].productID === lineItem.productID) {
                                shipmentLineItem = productLineItems[i];
                                break;
                            }
                        }

                        if (shipmentLineItem) {
                            shipmentLineItem.setQuantityValue(shipmentLineItem.quantity.value + lineItem.quantity.value);
                            currentBasket.removeProductLineItem(lineItem);
                        } else {
                            lineItem.setShipment(defaultShipment);
                        }
                    }
                });
                if (!shipment.default) {
                    currentBasket.removeShipment(shipment);
                }
            }
        });

        shippingHelpers.selectShippingMethod(defaultShipment);
        defaultShipment.createShippingAddress();
        COHelpers.ensureNoEmptyShipments(req);

        if (req.currentCustomer.addressBook && req.currentCustomer.addressBook.preferredAddress) {
            var preferredAddress = req.currentCustomer.addressBook.preferredAddress;
            COHelpers.copyCustomerAddressToShipment(preferredAddress);
        }

        basketCalculationHelpers.calculateTotals(currentBasket);
    });
}

/**
 * To set shipping methods for BOPIS shipments once logged in.
 * @param {dw.order.Basket} currentBasket - The current basket
 */
function setInStorePickUpShippingAddress(currentBasket) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var collections = require('*/cartridge/scripts/util/collections');

    var shipments = currentBasket.shipments;
    collections.forEach(shipments, function (shipment) {
        if (shipment.custom.fromStoreId) {
            var store = StoreMgr.getStore(shipment.custom.fromStoreId);
            // Find in-store method in shipping methods.
            var shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
            var shippingMethod = collections.find(shippingMethods, function (method) {
                return method.custom.storePickupEnabled;
            });

            var storeAddress = {
                address: {
                    firstName: store.name,
                    lastName: store.name,
                    address1: store.address1,
                    address2: !empty(store.address2) ? store.address2 : '',
                    city: store.city,
                    stateCode: store.stateCode,
                    postalCode: store.postalCode,
                    countryCode: store.countryCode.value,
                    phone: store.phone
                },
                shippingMethod: shippingMethod && shippingMethod.ID
            };
            COHelpers.copyShippingAddressToShipment(storeAddress, shipment);
        }
    });
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
}

/**
 * Returns count of Bopis items in current basket
 * @param {Object} currentBasket currentBasket
 * @returns {Object} - count of bopis items.
 */
function getCountOfBopisItems(currentBasket) {
    var collections = require('*/cartridge/scripts/util/collections');
    var Logger = require('dw/system/Logger');
    var result = {};
    result.numberOfBopisItems = 0;
    result.numberOfNonBopisItems = 0;
    try {
        if (currentBasket) {
            collections.forEach(currentBasket.productLineItems, function (PLI) {
                if (PLI.shipment.custom.fromStoreId) {
                    result.numberOfBopisItems++;
                } else {
                    result.numberOfNonBopisItems++;
                }
            });
        }
    } catch (e) {
        Logger.error('Error while executing getCountOfBopisItems', e.message);
    }
    return result;
}

/**
 * Returns Bopis shipment
 * @param {Object} shipments currentBasket.shipments
 * @returns {Object} - bopisShipment
 */
function getBopisShipment(shipments) {
    var collections = require('*/cartridge/scripts/util/collections');
    var bopisShipment;
    if (shipments) {
        bopisShipment = collections.find(shipments, function (item) { // eslint-disable-line
            if (item && item.custom && item.custom.fromStoreId) {
                return item;
            }
        });
    }
    return bopisShipment;
}

module.exports = {
    basketHasInStorePickUpShipment: basketHasInStorePickUpShipment,
    setStoreInProductLineItem: base.setStoreInProductLineItem,
    getStoreInventory: base.getStoreInventory,
    basketHasOnlyBOPISProducts: basketHasOnlyBOPISProducts,
    mergeShipmentsInBasket: mergeShipmentsInBasket,
    splitShipmentsForBOPIS: splitShipmentsForBOPIS,
    updateToShipToAddressShipment: updateToShipToAddressShipment,
    setInStorePickUpShippingAddress: setInStorePickUpShippingAddress,
    getCountOfBopisItems: getCountOfBopisItems,
    getBopisShipment: getBopisShipment
};
