'use strict';

/**
 * Job step to query custom object and fetches label
 * @returns {Object} return status object
 */
function getLabel() {
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var HookManager = require('dw/system/HookMgr');
    var returns = require('dw/object/CustomObjectMgr').queryCustomObjects('ReturnXML', 'custom.readyToExport = {0} AND custom.currencyCode = {1}', null, false, 'NZD');
    while (returns.hasNext()) {
        if (HookManager.hasHook('app.shipment.label.nzpost')) {
            var returnObj = returns.next();
            var shippingLabelFromConsignmentId = HookManager.callHook('app.shipment.label.nzpost', 'shippingLabelFromConsignmentId', returnObj.custom.consignmentId);
            if ((shippingLabelFromConsignmentId.trackingNumber && shippingLabelFromConsignmentId.shipLabel)) {
                Transaction.wrap(() => { //eslint-disable-line
                    // update custom object
                    returnObj.custom.readyToExport = true;
                    returnObj.custom.trackingNumber = shippingLabelFromConsignmentId.trackingNumber;
                    // Update return case
                    var order = require('dw/order/OrderMgr').getOrder(returnObj.custom.dwOrderNo);
                    var returnCase = order.getReturnCase(returnObj.custom.returnID);
                    returnCase.custom.trackingNumber = shippingLabelFromConsignmentId.trackingNumber;
                    returnCase.custom.shipmentLabel = shippingLabelFromConsignmentId.shipLabel;
                    // Trigger mail to customer
                    require('*/cartridge/scripts/order/returnHelpers').sendReturnCreatedConfirmationEmail(order, returnCase);
                });
            }
        }
    }
    return new Status(Status.OK);
}

module.exports = {
    getLabel: getLabel
};
