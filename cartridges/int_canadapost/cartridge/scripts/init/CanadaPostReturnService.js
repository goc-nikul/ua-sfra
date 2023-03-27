/**
 * Initialize service for the Canada Post
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var CanadaPostHelper = require('int_canadapost/cartridge/scripts/util/CanadaPostHelper');
var canadaPostHelper = new CanadaPostHelper();

var createAuthorizedReturn = LocalServiceRegistry.createService('int_canadapost.soap.shipment.createAuthorizedReturn', {
    initServiceClient: function () {
        this.webReference = webreferences2.authreturn; // eslint-disable-line no-undef
        return this.webReference.getDefaultService();
    },
    createRequest: function (svc, object) {
        var credential = svc.getConfiguration().getCredential();
        var newUrl = (!empty(credential) && !empty(credential.getURL())) ? credential.getURL() : '';

        if (!empty(newUrl)) {
            svc.setURL(newUrl);
        }

        canadaPostHelper.setSecurityHeader(this.serviceClient, credential);

        this.order = object.order;
        this.rmaNumber = object.rmaNumber;

        return canadaPostHelper.createAuthorizedRequest(svc, svc.configuration.profile, this.webReference, this.order, this.rmaNumber);
    },
    execute: function (svc, request) { // eslint-disable-line  no-unused-vars
        var authorizedResponse = svc.serviceClient.createAuthorizedReturn(request);
        return authorizedResponse;
    },
    parseResponse: function (svc, response) {
        return canadaPostHelper.parseAuthorizedResponse(svc, response);
    },

    mockFull: function (svc, request) { // eslint-disable-line  no-unused-vars
        return canadaPostHelper.getMockedAuthorizedProcessResponse();
    }
});

var getArtifact = LocalServiceRegistry.createService('int_canadapost.soap.shipment.getArtifact', {
    initServiceClient: function () {
        this.webReference = webreferences2.artifact; // eslint-disable-line  no-undef
        return this.webReference.getDefaultService();
    },
    createRequest: function (svc, artifactId) {
        var credential = svc.getConfiguration().getCredential();
        var newUrl = (!empty(credential) && !empty(credential.getURL())) ? credential.getURL() : '';

        if (!empty(newUrl)) {
            svc.setURL(newUrl);
        }

        canadaPostHelper.setSecurityHeader(this.serviceClient, credential);

        return canadaPostHelper.createGetArtifactRequest(svc, svc.configuration.profile, this.webReference, artifactId);
    },
    execute: function (svc, request) {
        var getArtifactResponse = svc.serviceClient.getArtifact(request);

        return getArtifactResponse;
    },
    parseResponse: function (svc, response) {
        return canadaPostHelper.parseGetArtifactResponse(svc, response);
    },

    mockFull: function (svc, request) { // eslint-disable-line  no-unused-vars
        return canadaPostHelper.getMockedGetArtifactProcessResponse();
    }
});

module.exports = {
    createAuthorizedReturn: createAuthorizedReturn,
    getArtifact: getArtifact
};
