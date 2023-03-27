'use strict';

/*
 * Update order level custom attributes related to BOPIS for existing orders.
 */

var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');

const StringUtils = require('dw/util/StringUtils');

function updateOrdersWithBopisItems(params) {
    try {
        // querying orders if isBOPISOrder and isMixedBOPISOrder are null, with the startDate and endDate, excluding HAL Orders and MAOordertype = APP.
        var startDate = params.startDate;
        var endDate = params.endDate;
        var queryString = 'custom.isBOPISOrder = NULL AND custom.isMixedBOPISOrder = NULL AND creationDate >= {1} AND creationDate <= {2} AND custom.maoOrderType != {3} AND custom.isCommercialPickup != {0}';
        var orders = OrderMgr.queryOrders(queryString, 'orderNo ASC', 'true', startDate, endDate, 'APP');
        var bopisOnly = 0, mixedBopis = 0;
        if (!empty(orders)) {
            while (orders.hasNext()) {
                var order = orders.next();
                let basketHasOnlyBOPISProducts = instorePickupStoreHelpers.basketHasOnlyBOPISProducts(order.shipments) || false;
                let basketHasMixedBopisProducts = (order.shipments.length > 1 && instorePickupStoreHelpers.basketHasInStorePickUpShipment && !basketHasOnlyBOPISProducts) ? true : false;
                if (basketHasOnlyBOPISProducts) {
                    bopisOnly++;
                } else if (basketHasMixedBopisProducts) {
                    mixedBopis++;
                }
                Transaction.wrap(function () {
                    order.custom.isBOPISOrder = basketHasOnlyBOPISProducts;
                    order.custom.isMixedBOPISOrder = basketHasMixedBopisProducts;
                });
            }
        }
        Logger.info('UpdateBopisOrder.js: Number of orders processed from ' + startDate + ' to ' + endDate + 'is ' + orders.count + '. Only BOPIS orders = ' + bopisOnly + ' Mixed BOPIS orders = ' + mixedBopis);
    } catch (e) {
        Logger.error('UpdateBopisOrder.js: updateOrdersWithBopisItems() - error while executing this function : {0}', e.message);
    }
}

/* Exported methods */
module.exports = {
    updateOrdersWithBopisItems: updateOrdersWithBopisItems
};
