/**
 * Initialize HTTP shipment services
 */

'use strict';

var FedExHelper = require('int_fedex/cartridge/scripts/util/FedExHelper');
var fedExHelper = new FedExHelper();

var shipRequest = require('dw/svc/LocalServiceRegistry').createService('int_fedex.soap.shipment.shipRequest.mx', {
    initServiceClient: function () {
        this.webReference = webreferences2.ShipService_v17; // eslint-disable-line no-undef
        return this.webReference.getDefaultService();
    },
    createRequest: function (svc, object, rmaNumber) {
        var credential = svc.getConfiguration().getCredential();
        var newUrl = (!empty(credential) && !empty(credential.getURL())) ? credential.getURL() : '';

        if (!empty(newUrl)) {
            svc.setURL(newUrl);
        }

        this.order = object;

        return fedExHelper.createFedExShipmentProcessRequest(svc, this.configuration.profile, this.webReference, this.order, rmaNumber);
    },
    execute: function (svc, request) {
        var shipResponse = svc.serviceClient.processShipment(request);

        return shipResponse;
    },
    parseResponse: function (svc, response) {
        return fedExHelper.parseFedExShipmentProcessResponse(svc, response);
    },

    mockFull: function (svc, request) { // eslint-disable-line no-unused-vars
        return fedExHelper.getMockedFedExShipmentProcessResponse();
    }
});

module.exports = {
    shipRequest: shipRequest
};
