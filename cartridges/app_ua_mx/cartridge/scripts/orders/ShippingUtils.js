/**
* Return utils contai some returns help functions
*
*/

let Logger = require('dw/system/Logger');
let Money = require('dw/value/Money');
var ArrayList = require('dw/util/ArrayList');
var ShippingUtils = function () {};
var collections = require('*/cartridge/scripts/util/collections');

ShippingUtils.prototype = {

    getQtyJsonPLIBySku: function (sku, orderJsonObj, total) {
        var qty = 0;

        if (!empty(sku) && !empty(orderJsonObj)) {
            for (var i = 0; i < orderJsonObj.length; i++) {
                var shipment = orderJsonObj[i];
                if (!empty(shipment.items) && !empty(shipment.items[sku])) {
                    if (total) { qty += Number(shipment.items[sku]); } else {
                        qty = shipment.items[sku];
                        break;
                    }
                }
            }
        }

        return qty;
    },

    getPLIDeliveryNumber: function (shippingJson, pliSku) {
        var deliveryNumber;
        if (!empty(shippingJson) && !empty(pliSku)) {
            var shipments = this.parseJsonSafely(shippingJson);
            collections.forEach(shipments, function (shipment) {
                // eslint-disable-next-line no-prototype-builtins
                if (shipment.items.hasOwnProperty(pliSku)) {
                    deliveryNumber = shipment.deliveryNumber;
                    return;
                }
            });
        }
        return deliveryNumber;
    },

    parseJsonSafely: function (jsonString) {
        var jsonObject = null;
        try {
            jsonObject = JSON.parse(jsonString);
        } catch (e) {
            Logger.error('ShippingUtil.ds JSON parse error:' + e);
        }

        return jsonObject;
    },

    getShippedCollection: function (shippingJson, productLineItems) {
        var shippedCollection = productLineItems;
        var toRemove = [];
        var sapItems = this.getLastSapItems(shippingJson);

		// Identify which lineItems must be removed from shipped collection
        collections.forEach(shippedCollection, function (dwShippedItem) {
			// If shipped item not in JSON list, remove
            // eslint-disable-next-line no-prototype-builtins
            if (!sapItems.hasOwnProperty(dwShippedItem.product.custom.sku)) toRemove.push(dwShippedItem);
			// If JSON item has a qty of 0, remove
            else if (sapItems[dwShippedItem.product.custom.sku].toString() === '0') toRemove.push(dwShippedItem);
        });

		// Remove offending lineItems from collection
        toRemove.forEach(function (deleted) {
            shippedCollection.remove(deleted);
        });
        return shippedCollection;
    },

    getNotShippedCollection: function (shippingJson, productLineItems) {
        var notShippedCollection = productLineItems;
        var toRemove = [];

        var sapItems = this.getAllShippedItems(shippingJson);

        collections.forEach(notShippedCollection, function (dwShippedItem) {
            // If shipped item is in JSON list, remove
            // eslint-disable-next-line no-prototype-builtins
            if (dwShippedItem.custom && 'sku' in dwShippedItem.custom && sapItems.hasOwnProperty(dwShippedItem.custom.sku)) {
                if (sapItems[dwShippedItem.custom.sku] === dwShippedItem.getQuantity()) {
                    toRemove.push(dwShippedItem);
                }
                // eslint-disable-next-line no-prototype-builtins
            } else if (dwShippedItem.custom.sku && sapItems.hasOwnProperty(dwShippedItem.custom.sku)) {
                if (sapItems[dwShippedItem.custom.sku] === dwShippedItem.getQuantity()) {
                    toRemove.push(dwShippedItem);
                }
            }
            if (dwShippedItem.product && 'virtualProduct' in dwShippedItem.product.custom && dwShippedItem.product.custom.virtualProduct) {
                toRemove.push(dwShippedItem);
            }
        });
        // Remove offending lineItems from collection
        toRemove.forEach(function (deleted) {
            notShippedCollection.remove(deleted);
        });
        return notShippedCollection;
    },

    getOnlyShippableItems: function (productLineItems) {
        var shippableCollection = productLineItems;
        var toRemove = [];

        collections.forEach(shippableCollection, function (dwItem) {
            if (dwItem.product.custom.virtualProduct) {
                toRemove.push(dwItem);
            }
        });
        toRemove.forEach(function (deleted) {
            shippableCollection.remove(deleted);
        });
        return shippableCollection;
    },

    getSapItems: function (shippingJson) {
        var items = [];
        shippingJson.forEach(function (object) {
            // eslint-disable-next-line no-prototype-builtins
            if (object.hasOwnProperty('items')) {
                items = object.items;
                return;
            }
        });
        return items;
    },
    getAllShippedItems: function (shippingJson) {
        var items = {};
        if (shippingJson) {
            shippingJson.forEach(function (object) {
                // eslint-disable-next-line no-prototype-builtins
                if (object.hasOwnProperty('items')) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (var prop in object.items) {
                        // eslint-disable-next-line no-prototype-builtins
                        if (object.items.hasOwnProperty(prop)) {
                            items[prop] = object.items[prop];
                        }
                    }
                }
            });
        }
        return items;
    },
    getLastSapItems: function (shippingJson) {
        let lastItem = shippingJson[shippingJson.length - 1];

        if (lastItem && 'items' in lastItem) { return lastItem.items; }

        return [];
    },
    getUpdatedLineItemPrice: function (productLineItem, qty) {
        if (qty > 0) {
            var priceForOne = productLineItem.adjustedPrice / productLineItem.getQuantity().value;
            var updatedPrice = priceForOne * qty;
            return new Money(updatedPrice, productLineItem.adjustedPrice.currencyCode);
        }

        return new Money(0, productLineItem.adjustedPrice.currencyCode);
    },
    updateEmailFlag: function (shippingJson) {
		/* Update Shipping JSON to reflect that order shipped */
        for (let i = 0, len = shippingJson.length; i < len; i++) {
            let object = shippingJson[i];
            // eslint-disable-next-line no-prototype-builtins
            if (object.emailSent !== true && object.hasOwnProperty('items')) { object.emailSent = true; }
        }

        return JSON.stringify(shippingJson);
    },
    isShortShip: function (order) {
        var shippingJson = this.parseJsonSafely(order.custom.shippingJson);
        var notShippedCollectionLength = 0;
        collections.forEach(order.shipments, (shipment) => {
            notShippedCollectionLength += this.getNotShippedCollection(shippingJson, shipment.productLineItems).length;
        });

        if (notShippedCollectionLength !== 0) {
            return true;
        }

        return false;
    },
    getTotalShipmentQty: function (order) {
        var totalQ = 0;
        var shipment = order.shipments[0];
        var shippingJson = this.parseJsonSafely(order.custom.shippingJson);
        collections.forEach(shipment.productLineItems, function (pli) {
            var pliQ = Number(this.getQtyJsonPLIBySku(pli.custom.sku, shippingJson));
            if (pliQ > 0) {
                totalQ += pliQ;
            }
        });
        return totalQ;
    },
    getLastShipmentQty: function (order) {
        var totalQty = 0;
        var shipment = order.shipments[0];
        var shippingJson = this.parseJsonSafely(order.custom.shippingJson);
        var sapItems = this.getLastSapItems(shippingJson);
        collections.forEach(shipment.productLineItems, function (pli) {
            // eslint-disable-next-line no-restricted-syntax
            for (let sku in sapItems) {
                if (sku === pli.custom.sku) { totalQty += Number(sapItems[sku]); }
            }
        });

        return totalQty;
    },
    getOlreadyShipmentsQty: function (order, isLast) {
        var totalQty = 0;
        var shippingJson = this.parseJsonSafely(order.custom.shippingJson);
        var sapItems = isLast ? this.getLastSapItems(shippingJson) : this.getAllShippedItems(shippingJson);
        collections.forEach(order.shipments, function (shipment) {
            collections.forEach(shipment.productLineItems, function (pli) {
                sapItems.forEach(function (sku) {
                    if (sku === pli.custom.sku) {
                        totalQty += Number(sapItems[sku]);
                    }
                });
            });
        });

        return totalQty;
    },
    getLastShipmnetSKUQty: function (sku, shippingJson) {
        let sapItems = this.getLastSapItems(shippingJson);

        // eslint-disable-next-line no-restricted-syntax
        for (let prop in sapItems) {
            if (prop === sku) {
                return sapItems[prop];
            }
        }

        return false;
    },
    isPLIShipped: function (pli, shippingJson, isShipped) {
        let qty = this.getQtyJsonPLIBySku(pli.custom.sku, shippingJson, true);

		// not separate shipment section
        if (isShipped) {
            return true;
        }
        return (pli.getQuantity() - qty) > 0;
    },
    isOrderShipped: function (order, shippingJson) {
        let notShippedPLI = new ArrayList();
        for (let i = 0, len = order.shipments.length; i < len; i++) {
            let pli = order.shipments[i].productLineItems;

            for (let j = 0, pliLen = pli.length; j < pliLen; j++) {
                if (this.isPLIShipped(pli[j], shippingJson)) {
                    notShippedPLI.push(pli[j]);
                }
            }
        }

        return notShippedPLI.length > 0;
    },
    filterShippingMethods: function (shippingMethods) {
		// Filter out unnecessary Paazl methods
        var methodsToSkip = dw.web.Resource.msg('shipping.methods.to.skip', 'paazl', 'GBP~UPS-PUP,EUR~UPS-PUP,SEK~UPS-PUP,DKK~UPS-PUP');
        var filteredShippingMethods = new ArrayList();

        shippingMethods.toArray().forEach(function (method) {
            if (methodsToSkip.indexOf(method.ID) === -1) {
                filteredShippingMethods.push(method);
            }
        });

        if (filteredShippingMethods.length) {
            // eslint-disable-next-line no-param-reassign
            shippingMethods = filteredShippingMethods;
        }

        return shippingMethods;
    }
};

module.exports = ShippingUtils;
