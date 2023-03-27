'use strict';

/**
 * Registers UPS Service
 * @returns {Object} Returns UPS service object
 */
function shipmentShipRequest() {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var WSUtil = require('dw/ws/WSUtil');
    var shipmentShipHelpers = require('*/cartridge/scripts/helpers/shipmentShip');
    return LocalServiceRegistry.createService('int_ups.soap.shipment.shipRequest', {
        initServiceClient: function (svc) {
            this.webReference = webreferences2.Ship;//eslint-disable-line
            var port = this.webReference.getDefaultService();
            var timeout = (svc.getConfiguration().getProfile().getTimeoutMillis()) ? (svc.getConfiguration().getProfile().getTimeoutMillis()) : 5000;
            WSUtil.setRequestTimeout(timeout, port);
            return port;
        },
        createRequest: function (svc, lineItemCtnr) {
            var credential = svc.getConfiguration().getCredential();
            var newUrl = (credential && credential.getURL()) ? credential.getURL() : '';
            if (newUrl) svc.setURL(newUrl);
            this.order = lineItemCtnr;
            return shipmentShipHelpers.createRequest(svc.configuration.profile, this.webReference, this.order);
        },
        execute: function (svc, parameter) {
            return svc.serviceClient.processShipment(parameter.ShipmentRequest, parameter.UPSSecurity);
        },
        parseResponse: function (svc, response) {
            return shipmentShipHelpers.parseResponse(response);
        },
        mockFull: function () {
            return shipmentShipHelpers.mockResponse();
        }
    });
}

module.exports = {
    shipmentShipRequest: shipmentShipRequest
};
