'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var url = 'https://test.legendsoft.com/underarmor/token';

var svc = {
    requestMethod: '',
    url: '',
    configuration: {
        credential: {
            URL: 'https://test.legendsoft.com/underarmor/api/TownShip/GetAll/50453'
        }
    },
    getConfiguration: () => {
        return {
            getCredential: () => {
                return {
                    getUser: () => {
                        return 'abc@test.com';
                    },
                    getPassword: () => {
                        return 'ZAQ!zaq1';
                    },
                    getURL: () => {
                        return url;
                    }
                };
            }
        };
    },
    setRequestMethod: function (reqMethod) {
        this.requestMethod = reqMethod;
    },
    addHeader: function (key, val) {
        Object.defineProperty(svc, key, {
            enumerable: true,
            value: val
        });
        return svc;
    },
    setURL: function (URL) {
        url = URL;
    }
};

describe('int_legendsoft/cartridge/scripts/services/legendSoftServices.js', () => {
    describe('getTokenService methosd testcases', () => {
        it('Testing method getTokenService --> returns service object in the response', () => {
            var legendSoftServices = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/services/legendSoftServices', {
                'dw/svc/LocalServiceRegistry': {
                    createService: (serviceId, callbackObject) => {
                        callbackObject.createRequest(svc);
                        return callbackObject.parseResponse('', {
                            getText: () => {
                                return 'LiveAccessToken';
                            }
                        });
                    }
                }
            });
            var result = legendSoftServices.tokenService();
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
            assert.equal(result, 'LiveAccessToken');
        });
    });

    describe('getPostalCodeService Method Test Cases', () => {
        it('Testing method getPostalCodeService --> returns postal code in the response', () => {
            var params = {
                token: 'testtoken',
                postalCode: '23452'
            };
            var legendSoftServices = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/services/legendSoftServices', {
                'dw/svc/LocalServiceRegistry': {
                    createService: (serviceId, callbackObject) => {
                        callbackObject.createRequest(svc, params);
                        return callbackObject.parseResponse('', {
                            getText: () => {
                                return '23415';
                            }
                        });
                    }
                }
            });
            var result = legendSoftServices.postalCodeService();
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
            assert.equal(result, '23415');
        });
    });
});
