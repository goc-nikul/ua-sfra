'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const { expect } = require('chai');
const sinon = require('sinon');
const Site = require('../../../mocks/dw/dw_system_Site');

var loyaltyDataToken = {
    data: {},
    configObj: {},
    client: {
        text: '{"success":true,"message":"success"}'
    },
    mock: false,
    request: {},
    URL: '',
    payload: '{"Test":"Test"}'
};

var serviceMock = {
    URL: null,
    headers: [],
    method: 'GET',
    addHeader: function (key, value) {
        this.headers[key] = value;
    },
    setRequestMethod: function (method) {
        this.method = method;
    },
    setURL: function (url) {
        this.URL = url;
    },
    setAuthentication: function (auth) {
        this.auth = auth;
    },
    client: {
        setTimeout: function (time) {
            this.time = time;
        },
        open: function (client, url) {
            this.client = client;
        },
        sendAndReceiveToFile: function (client) {
            this.client = client;
        }
    },
    getConfiguration() {
        return {
            credential: {
                URL: 'https://ua.dev/graphql'
            },
            getCredential: function () {
                return {
                    getUser: function () {
                        return 'loyaltyDataServiceUser';
                    },
                    getPassword: function () {
                        return 'loyaltyDataServiceUserPassword';
                    }
                };
            }
        };
    }
};

var LocalServiceRegistryStub = {
    createService: function (serviceId, configObj) {
        return {
            call: function (data) {
                loyaltyDataToken.configObj = configObj;
                loyaltyDataToken.data = data;
                var isOk = true;
                var statusCheck = true;
                return {
                    ok: isOk,
                    object: {
                        status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                    },
                    error: isOk ? 200 : 400,
                    getRequestData: function () {
                        loyaltyDataToken.request = loyaltyDataToken.configObj.createRequest(serviceMock, loyaltyDataToken);
                        return loyaltyDataToken.request;
                    },
                    getResponse: function () {
                        return loyaltyDataToken.mock ?
                            loyaltyDataToken.configObj.mockCall(serviceMock) :
                            loyaltyDataToken.configObj.parseResponse(serviceMock, loyaltyDataToken.client);
                    },
                    getMessage: function (response) {
                        return {
                            logResponse: loyaltyDataToken.configObj.filterLogMessage(response)
                        };
                    }
                };
            },
            getRequestData: function () {
                loyaltyDataToken.request = loyaltyDataToken.configObj.createRequest(serviceMock);
                return loyaltyDataToken.request;
            },
            getResponse: function () {
                return loyaltyDataToken.mock ?
                    loyaltyDataToken.configObj.mockCall(svc) :
                    loyaltyDataToken.configObj.parseResponse(serviceMock, loyaltyDataToken.client);
            },
            getCredentialID: function () {
                return serviceId;
            },
            getMessage: function (response) {
                return {
                    logResponse: loyaltyDataToken.configObj.filterLogMessage(response)
                };
            },
            getErrorMessage: function (response) {
                var obj = {};
                obj.a = {
                    b: obj
                };
                return {
                    requestData: loyaltyDataToken.configObj.getRequestLogMessage(obj),
                    logResponse: loyaltyDataToken.configObj.getResponseLogMessage(response)
                };
            }
        };
    }
};

describe('int_loyalty/cartridge/scripts/services/loyaltyDataService.js TEST', () => {
    global.empty = (data) => {
        return !data;
    };

    let mockLoyaltyDataService;
    let loyaltyDataService;
    beforeEach(() => {
        mockLoyaltyDataService = {};
        mockLoyaltyDataService.getGraphQL = () => {
            return {
                call: () => {
                    return {
                        ok: true
                    };
                }
            };
        };
        mockLoyaltyDataService.getTokenData = () => {
            return {
                call: () => {
                    return {
                        status: 'OK',
                        object: {
                            text: '{"access_token": 12344,"expires_in": 86400, "token_type": "Bearer"}'
                        }
                    };
                }
            };
        };
        loyaltyDataService = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/services/loyaltyDataService', {
            'dw/svc/LocalServiceRegistry': LocalServiceRegistryStub,
            '*/cartridge/scripts/services/serviceHelper': require('../../../../cartridges/int_loyalty/cartridge/scripts/services/serviceHelper'),
            'dw/system/Site': Site,
            '*/cartridge/scripts/util/loggerHelper': {
                maskSensitiveInfo: () => {
                    return 'Service Unavailable';
                }
            }
        });
    });

    it('Loyalty loyaltyDataService(getToken): should be initialized and Should get Response', () => {
        var result = loyaltyDataService.getTokenData();
        var res = result.call();
        result = res.getRequestData(serviceMock, loyaltyDataToken);
        assert.isDefined(result, 'loyaltyDataService.getToken.getRequestData is not defined');
        result = res.getResponse(serviceMock);
        assert.deepEqual(result.text, loyaltyDataToken.client.text);
    });

    it('Loyalty loyaltyDataService(getToken): should be initialized and Should get MockResponse is undefined because it was not written yet', () => {
        loyaltyDataToken.mock = true;
        var result = loyaltyDataService.getTokenData();
        var res = result.call();
        result = res.getRequestData(serviceMock, loyaltyDataToken);
        assert.isDefined(result);
        result = res.getResponse(serviceMock);
        assert.deepEqual(result.text, undefined);
    });

    it('Loyalty loyaltyDataService(getToken): should be initialized and returns filterLogMessage when service throwing error', () => {
        var result = loyaltyDataService.getTokenData();
        var res = result.call();
        result = res.getRequestData(serviceMock, loyaltyDataToken);
        assert.isDefined(result);
        result = res.getMessage(serviceMock);
        assert.deepEqual(result.logResponse, 'Service Unavailable');
    });

    it('Loyalty loyaltyDataService(getGraphQL) POST: should be initialized and return the success response from service', function () {
        var result = loyaltyDataService.getGraphQL('confirmedPoints', 'Bearer Loyalty_Test_Token');
        var res = result.call();
        assert.isTrue(res.ok);
        result = res.getRequestData(serviceMock, loyaltyDataToken);
        result = res.getResponse(serviceMock);
        assert.isDefined(result);
    });

    it('Loyalty loyaltyDataService(getGraphQL): should be initialized and should return Mock response from service when it is called', function () {
        loyaltyDataToken.mock = true;
        var text = '{"data":{"getLoyaltyPointsData":{"success":true,"loyaltyPointsBalance":5000},"estimateLoyaltyPoints":{"success":true,"event":{"estimatedPoints":171}}}}';
        var result = loyaltyDataService.getGraphQL('confirmedPoints', 'Bearer Loyalty_Test_Token');
        var res = result.call();
        result = res.getRequestData(serviceMock, loyaltyDataToken);
        assert.isDefined(result);
        result = res.getResponse(serviceMock);
        assert.deepEqual(result.text, text);
    });

    it('Loyalty loyaltyDataService(getGraphQL): should be initialized and returns filterLogMessage when service throwing error', function () {
        var result = loyaltyDataService.getGraphQL('confirmedPoints', 'Bearer Loyalty_Test_Token');
        var res = result.call();
        result = res.getRequestData(serviceMock, loyaltyDataToken);
        assert.isDefined(result);
        result = res.getMessage(serviceMock);
        assert.deepEqual(result.logResponse, 'Service Unavailable');
    });
});
