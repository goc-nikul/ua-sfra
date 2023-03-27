'use strict';
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
var returnsUtils = new ReturnsUtils();

/**
 * This function used to create Return Case
 * @param {Object} params - Params to create ReturnCase
 * @return {dw.order.ReturnCase} Returns ReturnCase
 */
function create(params) {
    var returnItemsInfo = params.ReturnItemsInfo;
    var order = params.Order;
    if (!returnItemsInfo.length || empty(order)) {
        Logger.error('CreateReturnCase.js: Empty order or return items info');
        return null;
    }

    Transaction.begin();
    // create return case
    var returnCase;
    if (params.PrintLabel) {
        returnCase = returnsUtils.createReturnCaseForPrintLabel(order, returnItemsInfo, false);
    } else {
        returnCase = returnsUtils.createReturnCase(order, returnItemsInfo, false);
    }
    order.custom.returnCaseNumber = returnCase.returnCaseNumber;
    /*
    // set TrackingNumber + ConsignmentID into Return (Due to EPMD-3804 Change)
    returnCase.custom.trackingNumber = params.TrackingNumber;
    returnCase.custom.consignmentId = params.ConsignmentID;

    if (typeof (params.ShipLabel) === 'string') {
        returnCase.custom.shipmentLabel = params.ShipLabel;
    } else if (!empty(params.ShipLabel) && typeof (params.ShipLabel) === 'object') {
        returnCase.custom.shipmentLabel = JSON.stringify(params.ShipLabel);
    } else {
        returnCase.custom.shipmentLabel = null;
    }
    */
    Transaction.commit();
    return returnCase;
}
exports.create = create;
