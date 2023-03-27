'use strict';

/* API includes */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/* Script modules */
var ServiceHelper = require('int_fedex/cartridge/scripts/util/ServiceHelper');
var serviceHelper = new ServiceHelper();

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

var getType = LocalServiceRegistry.createService('int_fedex.soap.address.getType', {
    initServiceClient: function () {
        this.webReference = webreferences2.AddressValidationService_v4;
        return this.webReference.getDefaultService();
    },
    createRequest: function (svc, object) {
        var credential = svc.getConfiguration().getCredential();
        var newUrl = (!empty(credential) && !empty(credential.getURL())) ? credential.getURL() : '';

        if (!empty(newUrl)) {
            svc.setURL(newUrl);
        }

        this.address = object;

        return serviceHelper.createFedExAddressTypeRequest(svc, this.configuration.profile, this.webReference, this.address);
    },
    execute: function (svc, req) {
        return svc.serviceClient.addressValidation(req);
    },
    parseResponse: function (svc, res) {
        return serviceHelper.parseFedExAddressResponse(svc, res);
    },
    mockFull: function (svc, req) {
        return serviceHelper.getMockedFedExShipmentProcessResponse();
    }
});

module.exports = {
    getType: getType
};
