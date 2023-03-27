'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var service = {
    setRequestMethod: () => {},
    setURL: () => {},
    addHeader: () => {},
    getConfiguration: function () {
        return {
            getCredential: function () {
                return {
                    getUser: function () {
                        return {};
                    }
                };
            }
        };
    },
    getURL: function () {
        return {
            replace: function () {
                return {};
            }
        };
    }
};

describe('int_talkoot/cartridge/scripts/services/TalkootService.js', () => {
    it('Testing talkoot: talkoot', () => {
        var TalkootService = proxyquire('../../../../../cartridges/int_talkoot/cartridge/scripts/services/TalkootService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service, {
                        endpoint: 'session',
                        paramsStr: 'paramsStr',
                        params: {
                            key: 'value'
                        }
                    });
                    return callbackObject.parseResponse('', {
                        text: '{"CustomerEmail":"aaaa","CustomerFirstName":"aaaa"}',
                        status: 200
                    });
                },
                call: () => {
                    return {
                        object: {
                            SessionKey: 'aaaaa',
                            Expiration: '2500',
                            ErrorCode : '000'
                        }
                    };
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                queryCustomObjects: () => {
                    return {
                        asList: function () {
                            return {
                                toArray: function () {
                                    return {};
                                }
                            };
                        }
                    };
                },
                createCustomObject: () => {
                    return {
                        custom: {
                            data: '{"data":[{"name":"aaa", "value":"1212"}]}'
                        }
                    };
                }
            },
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': {
                info: () => '',
                warn: () => ''
            }
        });

        var params = {
            endpoint: 'session',
            paramsStr: 'paramsStr',
            params: {
                key: 'value'
            }
        };
    });

    it('Testing talkoot: talkoot', () => {
        var TalkootService = proxyquire('../../../../../cartridges/int_talkoot/cartridge/scripts/services/TalkootService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId) => {
                    return {
                        call: function () {
                            return {
                                object: {
                                    SessionKey: '1224',
                                    Expiration: '2500'
                                }
                            };
                        }
                    };
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
					return {
						custom : {
							token : 'qqqqq',
							expires : '1212'
						}
					}
				},
                queryCustomObjects: () => {
                    return {
                        asList: function () {
                            return {
                                toArray: function () {
                                    return {};
                                }
                            };
                        }
                    };
                },
                createCustomObject: () => {
                    return {
                        custom: {
                            data: '{"data":[{"name":"aaa", "value":"1212"}]}'
                        }
                    };
                }
            },
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': {
                info: () => '',
                warn: () => ''
            }
        });

        var params = {
            endpoint: 'session',
            paramsStr: 'paramsStr',
            params: {
                key: 'value'
            }
        };

        var result = TalkootService.call(params);
        assert.equal(result.SessionKey, '1224');
    });
    
    it('Testing talkoot: talkoot ErrorCode 000 ', () => {
        var TalkootService = proxyquire('../../../../../cartridges/int_talkoot/cartridge/scripts/services/TalkootService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId) => {
                    return {
                        call: function () {
                            return {
                                object: {
                                    SessionKey: '1224',
                                    Expiration: '2500',
                                    ErrorCode : '000'
                                },
                                errorMessage: 'errorMessage'
                            };
                        }
                    };
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
					return {
						custom : {
							token : 'qqqqq',
							expires : '1212'
						}
					}
				},
                queryCustomObjects: () => {
                    return {
                        asList: function () {
                            return {
                                toArray: function () {
                                    return {};
                                }
                            };
                        }
                    };
                },
                createCustomObject: () => {
                    return {
                        custom: {
                            data: '{"data":[{"name":"aaa", "value":"1212"}]}'
                        }
                    };
                }
            },
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Logger': {
                info: () => '',
                warn: () => ''
            }
        });

        var params = {
            endpoint: 'session',
            paramsStr: 'paramsStr',
            params: {
                key: 'value'
            }
        };

        var result = TalkootService.call(params);
        assert.equal(result.SessionKey, '1224');
    });
});
