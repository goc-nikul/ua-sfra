'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var url = 'https://test.com/underarmor/token';

var svc = {
    requestMethod: '',
    url: '',
    configuration: {
        credential: {
            URL: 'https://test.com/underarmor/50453'
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
    },
    serviceClient: {
        getArtifact: function () {
            return {};
        },
        createAuthorizedReturn: function () {
            return {};
        }
    }
};
describe('int_canadapost/cartridge/scripts/init/CanadaPostReturnService.js', () => {
    describe('createAuthorizedReturn methosd testcases', () => {
        it('Testing method createAuthorizedReturn --> returns service object in the response', () => {
            global.webreferences2 = {
                authreturn: {
                    getDefaultService: function () {
                        return {};
                    }
                },
                artifact: {
                    getDefaultService: function () {
                        return {};
                    }
                }
            };
            var CanadaPostReturnService = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/init/CanadaPostReturnService.js', {
                'dw/svc/LocalServiceRegistry': {
                    createService: (serviceId, callbackObject) => {
                        callbackObject.initServiceClient();
                        callbackObject.execute(svc, {});
                        callbackObject.mockFull(svc, {});
                        callbackObject.createRequest(svc, {});
                        return callbackObject.parseResponse('', {
                            getText: () => {
                                return 'Token';
                            }
                        });
                    }
                },
                'int_canadapost/cartridge/scripts/util/CanadaPostHelper': function () {
                    return {
                        setSecurityHeader: function () {
                            return {
                                configuration: {}
                            };
                        },
                        createAuthorizedRequest: function () {
                            return {};
                        },
                        parseAuthorizedResponse: function () {
                            return {};
                        },
                        getMockedAuthorizedProcessResponse: function () {
                            return {};
                        },
                        parseGetArtifactResponse: function () {
                            return {};
                        },
                        createAuthorizedReturn: function () {
                            return {};
                        },
                        getMockedGetArtifactProcessResponse: function () {
                            return {};
                        },
                        createGetArtifactRequest: function () {
                            return {};
                        }
                    };
                }
            });
            var result = CanadaPostReturnService.createAuthorizedReturn;
            assert.isNotNull(result, 'result is null');
        });
    });
});
