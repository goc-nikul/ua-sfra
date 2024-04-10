'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
const { expect } = require('chai');
const sinon = require('sinon');

var waitlistToken = {
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
            getCredential: function () {
                return {
                    getUser: function () {
                        return 'waitlistServiceUser';
                    },
                    getPassword: function () {
                        return 'waitlistServiceUserPassword';
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
                waitlistToken.configObj = configObj;
                waitlistToken.data = data;
                var isOk = true;
                var statusCheck = true;
                return {
                    ok: isOk,
                    object: {
                        status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                    },
                    error: isOk ? 200 : 400,
                    getRequestData: function () {
                        waitlistToken.request = waitlistToken.configObj.createRequest(serviceMock, waitlistToken);
                        return waitlistToken.request;
                    },
                    getResponse: function () {
                        return waitlistToken.mock ?
                            waitlistToken.configObj.mockCall(serviceMock) :
                            waitlistToken.configObj.parseResponse(serviceMock, waitlistToken.client);
                    },
                    getMessage: function (response) {
                        return {
                            logResponse: waitlistToken.configObj.filterLogMessage(response)
                        };
                    }
                };
            },
            getRequestData: function () {
                waitlistToken.request = waitlistToken.configObj.createRequest(serviceMock);
                return waitlistToken.request;
            },
            getResponse: function () {
                return waitlistToken.mock ?
                    waitlistToken.configObj.mockCall(svc) :
                    waitlistToken.configObj.parseResponse(serviceMock, waitlistToken.client);
            },
            getCredentialID: function () {
                return serviceId;
            },
            getMessage: function (response) {
                return {
                    logResponse: waitlistToken.configObj.filterLogMessage(response)
                };
            },
            getErrorMessage: function (response) {
                var obj = {};
                obj.a = {
                    b: obj
                };
                return {
                    requestData: waitlistToken.configObj.getRequestLogMessage(obj),
                    logResponse: waitlistToken.configObj.getResponseLogMessage(response)
                };
            }
        };
    }
};

describe('int_loyalty/cartridge/scripts/services/waitlistService.js TEST', () => {
    global.empty = (data) => {
        return !data;
    };

    let waitlistLoyaltyService;
    beforeEach(() => {
        waitlistLoyaltyService = proxyquire('../../../../cartridges/int_loyalty/cartridge/scripts/services/waitlistService', {
            'dw/svc/LocalServiceRegistry': LocalServiceRegistryStub,
            '*/cartridge/scripts/util/loggerHelper': {
                maskSensitiveInfo: () => {
                    return 'Service Unavailable';
                }
            }
        });
    });

    it('Loyalty waitlistService(getToken): should be initialized and Should get Response', () => {
        var result = waitlistLoyaltyService.getToken();
        var res = result.call();
        result = res.getRequestData(serviceMock, waitlistToken);
        assert.isDefined(result);
        result = res.getResponse(serviceMock);
        assert.deepEqual(result.text, waitlistToken.client.text);
    });

    it('Loyalty waitlistService(getToken): should be initialized and Should get MockResponse is undefined because it was not written yet', () => {
        waitlistToken.mock = true;
        var result = waitlistLoyaltyService.getToken();
        var res = result.call();
        result = res.getRequestData(serviceMock, waitlistToken);
        assert.isDefined(result);
        result = res.getResponse(serviceMock);
        assert.deepEqual(result.text, undefined);
    });

    it('Loyalty waitlistService(getToken): should be initialized and returns filterLogMessage when service throwing error', () => {
        var result = waitlistLoyaltyService.getToken();
        var res = result.call();
        result = res.getRequestData(serviceMock, waitlistToken);
        assert.isDefined(result);
        result = res.getMessage(serviceMock);
        assert.deepEqual(result.logResponse, 'Service Unavailable');
    });

    it('Loyalty waitlistService(setEvent) POST: should be initialized and return the success response from service', () => {
        let params = {
            email: 'loyaltyTestUser@loyalty.ua',
            zipcode: '02719'
        };
        var result = waitlistLoyaltyService.setEvent(params);
        var res = result.call();
        assert.isTrue(res.ok);
        result = res.getRequestData(serviceMock, waitlistToken);
        result = res.getResponse(serviceMock);
        assert.isDefined(result);
    });

    it('Loyalty waitlistService(setEvent) POST: should be initialized and return the success response from service', () => {
        let params = {
            email: 'loyaltyTestUser@loyalty.ua',
            zipcode: '02719'
        };
        var result = waitlistLoyaltyService.setEvent(params);
        var res = result.call();
        assert.isTrue(res.ok);
        result = res.getRequestData(serviceMock, waitlistToken);
        result = res.getMessage(serviceMock);
        assert.isDefined(result);
        assert.deepEqual(result.logResponse, 'Service Unavailable');
    });
});
