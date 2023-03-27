'use strict';
var base = module.superModule;

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.catalog.Store} storeObject - a Store objects
 */
function store(storeObject) {
    var storeHelper = require('*/cartridge/scripts/helpers/storeHelpers');
    base.call(this, storeObject);
    if (storeObject) {
        if (storeObject.custom.storeType.displayValue) {
            this.storeType = storeObject.custom.storeType.displayValue;
        }
        if (storeObject.custom.storeOpenUntil) {
            this.storeOpenUntil = storeObject.custom.storeOpenUntil;
        }
        if (storeObject.custom.storePickupDetails) {
            this.storePickupDetails = storeObject.custom.storePickupDetails;
        }
        if (storeObject.image) {
            this.image = storeObject.image.httpsURL;
        }
        if (storeObject.inventoryListID) {
            this.inventoryListId = storeObject.inventoryListID;
        }
        if (storeObject.custom.storeTimeZone) {
            this.storeTimeZone = storeObject.custom.storeTimeZone;
        }
        if (storeObject.custom.storeHoursJson) {
            this.storeHoursJson = storeObject.custom.storeHoursJson;
            this.storeOpenHours = storeHelper.getStoreOpenHours(this.storeHoursJson);
        }
        this.enableStore = storeObject.custom.enableStore;
        this.productInStoreInventory = false;
        this.storeGoogleMapLink = storeHelper.getStoreGoogleMapLink(storeObject);
    }
}

module.exports = store;
