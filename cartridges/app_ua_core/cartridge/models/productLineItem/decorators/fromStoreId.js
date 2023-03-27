'use strict';

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'fromStoreId', {
        enumerable: true,
        value: lineItem.shipment.custom.fromStoreId
    });

    Object.defineProperty(object, 'shipmentID', {
        enumerable: true,
        value: lineItem.shipment.ID
    });
};
