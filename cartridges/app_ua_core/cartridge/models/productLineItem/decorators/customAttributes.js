'use strict';

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'gcRecipientName', {
        enumerable: true,
        value: lineItem.custom.gcRecipientName
    });
    Object.defineProperty(object, 'gcRecipientEmail', {
        enumerable: true,
        value: lineItem.custom.gcRecipientEmail
    });
    Object.defineProperty(object, 'gcFrom', {
        enumerable: true,
        value: lineItem.custom.gcFrom
    });
    Object.defineProperty(object, 'gcDeliveryDate', {
        enumerable: true,
        value: lineItem.custom.gcDeliveryDate
    });
    Object.defineProperty(object, 'fromStoreId', {
        enumerable: true,
        value: lineItem.shipment.custom.fromStoreId || lineItem.custom.fromStoreId
    });
    Object.defineProperty(object, 'primaryContactBOPIS', {
        enumerable: true,
        value: lineItem.custom.primaryContactBOPIS
    });
    Object.defineProperty(object, 'secondaryContactBOPIS', {
        enumerable: true,
        value: lineItem.custom.secondaryContactBOPIS
    });
    Object.defineProperty(object, 'sku', {
        enumerable: true,
        value: lineItem.custom.sku
    });
    Object.defineProperty(object, 'instoreAvailability', {
        enumerable: true,
        value: 'instoreAvailability' in lineItem.custom && lineItem.custom.instoreAvailability
    });
    Object.defineProperty(object, 'availableForInStorePickup', {
        enumerable: true,
        value: lineItem.product.custom.availableForInStorePickup
    });
    Object.defineProperty(object, 'storeAvailabilityMsg', {
        enumerable: true,
        value: 'storeAvailabilityMsg' in lineItem.custom && lineItem.custom.storeAvailabilityMsg
    });
    Object.defineProperty(object, 'storeInventory', {
        enumerable: true,
        value: 'storeInventory' in lineItem.custom && lineItem.custom.storeInventory
    });
    Object.defineProperty(object, 'atsValue', {
        enumerable: true,
        value: 'atsValue' in lineItem.custom && lineItem.custom.atsValue
    });
};

