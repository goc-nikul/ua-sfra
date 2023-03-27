'use strict';

var superModule = module.superModule;

superModule.prototype.superModuleBuild = superModule.prototype.build;

superModule.prototype.build = function (shipment, type) {
    this.superModuleBuild(shipment);
    if (this.isMerchantDataAvailable && !empty(shipment.shippingAddress)) {
        this.item.merchant_data = (type === 'order') ? '' : this.buildMerchantData(shipment);
    }

    return this.item;
};

module.exports = superModule;
