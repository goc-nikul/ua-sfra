'use strict';

/**
 * Initialize HTTP services for a Accertify cartridge
 */

/* global webreferences */
 /* Script Modules */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var ObjectsHelper = require('~/cartridge/scripts/helpers/ObjectsHelper');
var WSUtil = require('dw/ws/WSUtil');
var Port = require('dw/ws/Port');
var Site = require('dw/system/Site');

var getWebRef = function () {
    // eslint-disable-next-line no-undef
    return webreferences2.QASOnDemand_v21;
};

var getSanitizedParams = function (params, requiredProperties) {
    var sanitizedParams = params || {};
    requiredProperties.forEach(function (property) {
        ObjectsHelper.setProperty(sanitizedParams, property, params[property] || '');
    });
    return sanitizedParams;
};

var setStubProperties = function (service) {
    // Set Stub Endpoint
    var endpoint = Site.getCurrent().getCustomPreferenceValue('QASEndpoint');
    WSUtil.setProperty(Port.ENDPOINT_ADDRESS_PROPERTY, endpoint, service.stub);

    //  Get timeout from service configuration
    var timeout = service.getConfiguration().getProfile().getTimeoutMillis(); // eslint-disable-line
    WSUtil.setConnectionTimeout(timeout, service.stub);

    // Get auth token from QAS config
    var authToken = Site.getCurrent().getCustomPreferenceValue('QASToken');
    WSUtil.setHTTPRequestHeader(service.stub, 'auth-token', authToken);
};

var setupEngine = function (request) {
    // Build default engine
    const webRef = getWebRef();
    var engine = new webRef.EngineType();
    engine.setValue(webRef.EngineEnumType.VERIFICATION);
    var intensity = webRef.EngineIntensityType.CLOSE;
    var promptSet = webRef.PromptSetType.DEFAULT;

    engine.setIntensity(intensity);
    engine.setPromptSet(promptSet);
    engine.setFlatten(true);

    request.setEngine(engine);
};

var addressSearchService = LocalServiceRegistry.createService('int_qas.address.search', {
    initServiceClient: function () {
        this.webRef = getWebRef();
        this.stub = this.webRef.getDefaultService();
        setStubProperties(this);
        return this.stub;
    },
    createRequest: function (service, requestParams) {
        var request = new this.webRef.QASearch();
        var params = getSanitizedParams(requestParams, ['layout', 'country', 'search']);
        setupEngine(request);
        request.setLayout(params.layout);
        request.setCountry(params.country);
        request.setSearch(params.search);
        return request;
    },
    execute: function (service, request) {
        return service.serviceClient.doSearch(request);
    },
    parseResponse: function (service, response) {
        return response;
    }
});

var addressTypeDownSearchService = LocalServiceRegistry.createService('int_qas.address.typedown.search', {
    initServiceClient: function () {
        this.webRef = getWebRef();
        this.stub = this.webRef.getDefaultService();
        setStubProperties(this);
        return this.stub;
    },
    createRequest: function (service, requestParams) {
        var request = new this.webRef.QASearch();
        var engine = new this.webRef.EngineType('Typedown');
        var params = getSanitizedParams(requestParams, ['layout', 'country', 'search']);
        setupEngine(request);
        request.setEngine(engine);
        request.setLayout(params.layout);
        request.setCountry(params.country);
        request.setSearch(params.search);
        return request;
    },
    execute: function (service, request) {
        return service.serviceClient.doSearch(request);
    },
    parseResponse: function (service, response) {
        return response;
    }
});

var addressGetService = LocalServiceRegistry.createService('int_qas.address.get', {
    initServiceClient: function () {
        this.webRef = getWebRef();
        this.stub = this.webRef.getDefaultService();
        setStubProperties(this);
        return this.stub;
    },
    createRequest: function (service, requestParams) {
        var request = new this.webRef.QAGetAddress();
        var params = getSanitizedParams(requestParams, ['layout', 'moniker']);
        request.setLayout(params.layout);
        request.setMoniker(params.moniker);
        return request;
    },
    execute: function (service, request) {
        return service.serviceClient.doGetAddress(request);
    },
    parseResponse: function (service, response) {
        return response;
    }
});

var addressRefineService = LocalServiceRegistry.createService('int_qas.address.refine', {
    initServiceClient: function () {
        this.webRef = getWebRef();
        this.stub = this.webRef.getDefaultService();
        setStubProperties(this);
        return this.stub;
    },
    createRequest: function (service, requestParams) {
        var request = new this.webRef.QARefine();
        var params = getSanitizedParams(requestParams, ['layout', 'refinement', 'moniker']);
        request.setLayout(params.layout);
        request.setRefinement(params.refinement);
        request.setMoniker(params.moniker);
        return request;
    },
    execute: function (service, request) {
        return service.serviceClient.doRefine(request);
    },
    parseResponse: function (service, response) {
        return response;
    }
});

module.exports = {
    addressSearchService: addressSearchService,
    addressGetService: addressGetService,
    addressRefineService: addressRefineService,
    addressTypeDownSearchService: addressTypeDownSearchService
};
