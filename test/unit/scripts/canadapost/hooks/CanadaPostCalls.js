'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var url = 'https://test.com/underarmor/token';

var svc = {
    requestMethod: '',
    url: '',
    configuration: {
        credential: {
            URL: 'https://test.com/underarmor/api/TownShip/GetAll/50453'
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

describe('int_canadapost/cartridge/scripts/hooks/CanadaPostCalls.js', () => {
    describe('createReturnLabel method testcases', () => {
        it('Testing method createReturnLabel --> CanadaPostCalls returns success response', () => {
            var CanadaPostCalls = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/hooks/CanadaPostCalls.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'int_canadapost/cartridge/scripts/init/CanadaPostReturnService': {
                    createAuthorizedReturn: {
                        call: function () {
                            return {
                                status: 'OK'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'OK',
                                artifactId: 'artifactId',
                                trackingNumber: '11111'
                            };
                        }
                    },
                    getArtifact: {
                        call: function () {
                            return {
                                status: 'OK'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'OK',
                                shipLabel: 'shipLabel',
                                mimeType: 'mimeType'
                            };
                        }
                    }
                }
            });
            var order = {};
            var result = CanadaPostCalls.createReturnLabel(order, '11');
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
            assert.equal(result.trackingNumber, '11111');
            assert.equal(result.shipLabel, 'shipLabel');
        });

        it('Testing method createReturnLabel --> CanadaPostCalls --> createAuthorizedReturn call returns error', () => {
            var CanadaPostCalls = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/hooks/CanadaPostCalls.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'int_canadapost/cartridge/scripts/init/CanadaPostReturnService': {
                    createAuthorizedReturn: {
                        call: function () {
                            return {
                                status: 'error'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'error',
                                artifactId: '',
                                trackingNumber: ''
                            };
                        }
                    },
                    getArtifact: {
                        call: function () {
                            return {
                                status: 'OK'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'OK',
                                shipLabel: 'shipLabel',
                                mimeType: 'mimeType'
                            };
                        }
                    }
                }
            });
            var order = {};
            var result = CanadaPostCalls.createReturnLabel(order, '11');
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });

        it('Testing method createReturnLabel --> CanadaPostCalls --> getArtifact call returns error', () => {
            var CanadaPostCalls = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/hooks/CanadaPostCalls.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'int_canadapost/cartridge/scripts/init/CanadaPostReturnService': {
                    createAuthorizedReturn: {
                        call: function () {
                            return {
                                status: 'OK'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'OK',
                                artifactId: 'artifactId',
                                trackingNumber: '11111'
                            };
                        }
                    },
                    getArtifact: {
                        call: function () {
                            return {
                                status: 'error'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'error',
                                shipLabel: 'shipLabel',
                                mimeType: 'mimeType'
                            };
                        }
                    }
                }
            });
            var order = {};
            var result = CanadaPostCalls.createReturnLabel(order, '11');
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });

        it('Testing method createReturnLabel --> createAuthorizedReturn call --> getResponse returns error', () => {
            var CanadaPostCalls = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/hooks/CanadaPostCalls.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'int_canadapost/cartridge/scripts/init/CanadaPostReturnService': {
                    createAuthorizedReturn: {
                        call: function () {
                            return {
                                status: 'OK'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'error',
                                artifactId: 'artifactId',
                                trackingNumber: '11111'
                            };
                        }
                    },
                    getArtifact: {
                        call: function () {
                            return {
                                status: 'OK'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'OK',
                                shipLabel: 'shipLabel',
                                mimeType: 'mimeType'
                            };
                        }
                    }
                }
            });
            var order = {};
            var result = CanadaPostCalls.createReturnLabel(order, '11');
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });

        it('Testing method createReturnLabel --> Custom Exception', () => {
            var stub = sinon.stub();
            stub.throwsException('Custom Exception');
            var CanadaPostCalls = proxyquire('../../../../../cartridges/int_canadapost/cartridge/scripts/hooks/CanadaPostCalls.js', {
                'dw/system/Logger': {
                    error: function () {
                        return 'error';
                    }
                },
                'int_canadapost/cartridge/scripts/init/CanadaPostReturnService': {
                    createAuthorizedReturn: {
                        call: stub,
                        getResponse: function () {
                            return {
                                status: 'error',
                                artifactId: 'artifactId',
                                trackingNumber: '11111'
                            };
                        }
                    },
                    getArtifact: {
                        call: function () {
                            return {
                                status: 'OK'
                            };
                        },
                        getResponse: function () {
                            return {
                                status: 'OK',
                                shipLabel: 'shipLabel',
                                mimeType: 'mimeType'
                            };
                        }
                    }
                }
            });
            var order = {};
            var result = CanadaPostCalls.createReturnLabel(order, '11');
            assert.isNotNull(result, 'result is null');
            assert.isDefined(result, 'result is not defined');
        });
    });
});
