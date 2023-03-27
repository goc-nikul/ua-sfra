'use strict';

/* eslint-disable */
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

global.empty = (data) => {
    return !data;
};

var paymentToken = {
    data: {},
    configObj: {},
    client: {
        text: '{"success":true,"message":"success"}'
    },
    mock: false,
    request: {},
    URL: ''
};

var service = {
    configuration: {
        credential: {
            URL: 'URL',
            user: '111',
            password: '222'
        }
    },
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
    client:{
        setTimeout: function(time) {
            this.time = time;
        },
        open: function(client,url) {
            this.client = client;
        },
        sendAndReceiveToFile: function(client) {
            this.client = client;
        }
    }
};

var paymentRefund = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/service/paymentRefund.js', {
    'dw/svc/LocalServiceRegistry': {
                createService: function (serviceId, configObj) {
                    return {
                        call: function (data) {
                            paymentToken.configObj = configObj;
                            paymentToken.data = data;
                            var isOk = true;
                            var statusCheck = true;
                            return {
                                ok: isOk,
                                object: {
                                    status: isOk && statusCheck ? 'SUCCESS' : 'ERROR'
                                },
                                error: isOk ? 200 : 400,
                                getRequestData: function () {
                                    paymentToken.request = paymentToken.configObj.createRequest(service);
                                    return paymentToken.request;
                                },
                                getResponse: function () {
                                    return paymentToken.mock
                                        ? paymentToken.configObj.mockCall(svc)
                                        : paymentToken.configObj.parseResponse(service, paymentToken.client);
                                }
                            };
                        },
                        getRequestData: function () {
                            paymentToken.request = paymentToken.configObj.createRequest(service);
                            return paymentToken.request;
                        },
                        getResponse: function () {
                            return paymentToken.mock
                                ? paymentToken.configObj.mockCall(svc)
                                : paymentToken.configObj.parseResponse(service, paymentToken.client);
                        },
                        getCredentialID: function () {
                            return serviceId;
                        },
                        getMessage: function (response) {
                            return {
                                requestData: paymentToken.configObj.getRequestLogMessage(paymentToken.request),
                                logResponse: paymentToken.configObj.getResponseLogMessage(response)
                            };
                        },
                        getErrorMessage: function (response) {
                            var obj = {};
                            obj.a = { b: obj };
                            return {
                                requestData: paymentToken.configObj.getRequestLogMessage(obj),
                                logResponse: paymentToken.configObj.getResponseLogMessage(response)
                            };
                        }
                    };
                }
            }
});


describe('paymentTokens Method Test Cases', () => {
    var payload = 220;
    it('paymentRefund should be initialized and returns the requested data', function () {
        var result = paymentRefund(payload);
        assert.isNotNull(result);
        assert.equal(result.error, 200);
        assert.equal(result.object.status, 'SUCCESS');
        result = result.getRequestData();
        assert.equal(result, 'paymentRequest=220');
    });

    it('paymentRefund should be initialized and returns response from service', function () {
        var result = paymentRefund(payload);
        result = result.getResponse(service, paymentToken);
        assert.equal(result, '{"success":true,"message":"success"}');
    });

});


