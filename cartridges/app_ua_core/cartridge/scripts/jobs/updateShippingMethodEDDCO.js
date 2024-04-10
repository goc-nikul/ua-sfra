'use strict';

module.exports.run = function () {
    var Logger = require('dw/system/Logger').getLogger('updateShippingMethodEDDCO');
    var Status = require('dw/system/Status');
    var collections = require('*/cartridge/scripts/util/collections');
    var DeliveryHelper = require('*/cartridge/scripts/util/DeliveryHelper');

    try {
        let shippingMethods = require('dw/order/ShippingMgr').getAllShippingMethods();

        collections.forEach(shippingMethods, function (shippingMethod) {
            let deliveryDates = DeliveryHelper.getShippingDeliveryDates(shippingMethod, false);
            const deliveryDatesFormatted = Array.isArray(deliveryDates) ?
                deliveryDates.map((item) => item.time.toISOString()) : [];
            Logger.info('Processed shipping method ID: {0}, EDD: {1}', shippingMethod.ID, JSON.stringify(deliveryDatesFormatted));
        });
    } catch (e) {
        require('*/cartridge/scripts/util/loggerHelper').logException('JOB_ERROR', '', e);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
};
