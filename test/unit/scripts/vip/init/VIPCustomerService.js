/* eslint-disable spellcheck/spell-checker */
'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var paymentToken = {
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
    }
};

var vipCustomserService = proxyquire('../../../../../cartridges/int_VIP/cartridge/scripts/init/VIPCustomerService', {
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
                            paymentToken.request = paymentToken.configObj.createRequest(service, paymentToken);
                            return paymentToken.request;
                        },
                        getResponse: function () {
                            return paymentToken.mock ?
                                paymentToken.configObj.mockCall(service) :
                                paymentToken.configObj.parseResponse(service, paymentToken.client);
                        },
                        getMessage: function (response) {
                            return {
                                // requestData: paymentToken.configObj.getRequestLogMessage(paymentToken.request),
                                logResponse: paymentToken.configObj.filterLogMessage(response)
                            };
                        }
                    };
                },
                getRequestData: function () {
                    paymentToken.request = paymentToken.configObj.createRequest(service);
                    return paymentToken.request;
                },
                getResponse: function () {
                    return paymentToken.mock ?
                        paymentToken.configObj.mockCall(svc) :
                        paymentToken.configObj.parseResponse(service, paymentToken.client);
                },
                getCredentialID: function () {
                    return serviceId;
                },
                getMessage: function (response) {
                    return {
                        // requestData: paymentToken.configObj.getRequestLogMessage(paymentToken.request),
                        logResponse: paymentToken.configObj.filterLogMessage(response)
                    };
                },
                getErrorMessage: function (response) {
                    var obj = {};
                    obj.a = {
                        b: obj
                    };
                    return {
                        requestData: paymentToken.configObj.getRequestLogMessage(obj),
                        logResponse: paymentToken.configObj.getResponseLogMessage(response)
                    };
                }
            };
        }
    },
    '~/cartridge/scripts/util/VIPCustomerHelper': {
        getMockedVIPResponse: () => {
            return {
                success: true,
                statusCode: 200,
                statusMessage: 'ok',
                errorMessage: '',
                text: '{ "data": { "account": { "availableBalance": 20000, "activeContract": { "promoGroup": "UA_ATHLETE_50" } } } }'
            };
        },
        parseGraphQLResponse: () => {
            return {
                response: true,
                success: true,
                errorMessage: ''
            };
        }
    },
    '*/cartridge/scripts/util/loggerHelper.js': {
        maskSensitiveInfo: () => {
            return 'Service Unavailable';
        }
    }
});

describe('paymentTokens Method Test Cases', () => {
    it('paymentTokens should be initialized and Should get a response', function () {
        var result = vipCustomserService.getTokenData();
        var res = result.call();
        result = res.getRequestData(service, paymentToken);
        assert.isDefined(result);
        result = res.getResponse(service);
        assert.deepEqual(result.text, paymentToken.client.text);
    });

    it('paymentTokens should be initialized and should return Mock response from service when it is called', function () {
        paymentToken.mock = true;
        var text = '{ "data": { "account": { "availableBalance": 20000, "activeContract": { "promoGroup": "UA_ATHLETE_50" } } } }';
        var result = vipCustomserService.getTokenData();
        var res = result.call();
        result = res.getRequestData(service, paymentToken);
        assert.isDefined(result);
        result = res.getResponse(service);
        assert.deepEqual(result.text, text);
    });

    it('paymentTokens should be initialized and returns filterLogMessage when service throwing error', function () {
        var result = vipCustomserService.getTokenData();
        var res = result.call();
        result = res.getRequestData(service, paymentToken);
        assert.isDefined(result);
        result = res.getMessage(service);
        assert.deepEqual(result.logResponse, 'Service Unavailable');
    });

    it('paymentTokens should be initialized and return the success response from service', function () {
        var result = vipCustomserService.getGraphQL();
        var res = result.call();
        result = res.getRequestData(service, paymentToken);
        assert.isDefined(result);
        result = res.getResponse(service);
        assert.equal(result.statusMessage, 'ok');
        assert.equal(result.success, true);
    });

    it('paymentTokens should be initialized and should return Mock response from service when it is called', function () {
        paymentToken.mock = true;
        var text = '{ "data": { "account": { "availableBalance": 20000, "activeContract": { "promoGroup": "UA_ATHLETE_50" } } } }';
        var result = vipCustomserService.getGraphQL();
        var res = result.call();
        result = res.getRequestData(service, paymentToken);
        assert.isDefined(result);
        result = res.getResponse(service);
        assert.deepEqual(result.text, text);
    });

    it('paymentTokens should be initialized and returns filterLogMessage when service throwing error', function () {
        var result = vipCustomserService.getGraphQL();
        var res = result.call();
        result = res.getRequestData(service, paymentToken);
        assert.isDefined(result);
        result = res.getMessage(service);
        assert.deepEqual(result.logResponse, 'Service Unavailable');
    });
});
