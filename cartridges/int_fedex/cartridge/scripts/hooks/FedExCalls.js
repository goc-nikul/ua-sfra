var Logger = require('dw/system/Logger');
var FedExShipment = require('dw/system/Logger').getLogger('FedexService', 'FedexService');

/**
 * Getting shipping label and tracking number from FedEx Web Service
 * @param {Object} order - Object
 * @param {string} rmaNumber - RMA Number
 * @returns {Object} args
 */
function createReturnLabel(order, rmaNumber) {
    var args = {}; // output object
    try {
        var service = require('*/cartridge/scripts/init/FedExShipmentService').shipRequest;
        var beforeCurrentTime = new Date().getTime();

        var serviceResult = service.call(order, rmaNumber);

        var afterCurrentTime = new Date().getTime();
        FedExShipment.warn('fedex shipment service elapsed time{0}', beforeCurrentTime - afterCurrentTime);

        if (serviceResult.status !== 'OK') {
            Logger.error('FedExCalls.js: ' + serviceResult.status + ':  ' + serviceResult.errorMessage);
            return args;
        }
        var shipmentProcessStatus = service.getResponse();
        if (shipmentProcessStatus.status === 'OK' && !empty(shipmentProcessStatus.shipLabel) && !empty(shipmentProcessStatus.trackingNumber)) {
            args.shipLabel = shipmentProcessStatus.shipLabel;
            args.trackingNumber = shipmentProcessStatus.trackingNumber;
            args.carrierCode = shipmentProcessStatus.carrierCode;
            args.mimeType = shipmentProcessStatus.labelType;
        } else {
            args.errorDescription = shipmentProcessStatus.errorDescription;
        }
    } catch (e) {
        Logger.error('Error in FedExCalls.js: ' + e.message);
        return args;
    }
    return args;
}

module.exports = {
    createReturnLabel: createReturnLabel
};
