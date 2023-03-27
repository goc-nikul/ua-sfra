'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_legendsoft/cartridge/scripts/helpers/legendsoftHelpers.js', function() {
    global.empty = (data) => {
        return !data;
    }
    
    const CUSTOM_OBJECT = {
        TYPE: 'authTokens',
        KEY: 'legendsoft'
    };

    it('LegendSoft fetchCustomObjectToken = > Verify the value to be null', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => null,
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {
                                token: '{"accessToken": "aaaaa","expires":2}'
                            };
                        }
                    };
                }
            }
        });    
        var result = legendsoft.fetchCustomObjectToken();
        assert.doesNotThrow(() => {
            legendsoft.fetchCustomObjectToken();
        });
        assert.isNull(result, 'fetchCustomObjectToken function should be null');
        });

    it('Testing legendSoftHelper.fetchCustomObjectToken -  Test to return the defined token from getCustomObject function', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => {
                    return {
                        custom: {
                            token: 'ABC-1234'
                        }
                    };
                },
                createCustomObject: () => null
            }
        });    
        var result = legendsoft.fetchCustomObjectToken();
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
        assert.isNotNull(result, 'fetchCustomObjectToken Should not be null values');
        assert.equal(result,'ABC-1234');
    });
    

    it('Testing legendSoftHelper method: fetchServiceToken when no custom object and hooks, ', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {},
            '*/cartridge/scripts/helpers/hooks': () => null,
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        });
        assert.doesNotThrow(() => {
            legendsoft.fetchServiceToken();
        });
    });

    it('Testing legendSoftHelper method: fetchServiceToken when custom object exists', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => {
                    return {
                        custom: {
                            token: '{"accessToken": "aaaaa","expires":2}'
                        }
                    };
                },
                createCustomObject: () => null
            },
            '*/cartridge/scripts/helpers/hooks': function() {
                return {
                    access_token: "833294",
                    expires_in: 2
                };
                },
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        });
        var result = legendsoft.fetchServiceToken();
        assert.isNotNull(result, 'Token should not be null')
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
    });

    it('Testing legendSoftHelper method: fetchServiceToken when no custom object and hooks', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => {
                    return {
                        custom: {
                            token: '{"accessToken": "aaaaa","expires":2}'
                        }
                    };
                },
                createCustomObject: () => null
            },
            '*/cartridge/scripts/helpers/hooks': function() {
                return {
                    access_token: "833294",
                    expires_in: 2
                };
                },
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        });
        var result = legendsoft.fetchServiceToken();
        assert.isNotNull(result, 'Token should not be null')
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
    });

    it('Testing legendSoftHelper method: fetchServiceToken when no existing custom object and will createCO method', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => null,
                createCustomObject: (customObjectName, objectID) => {
                    return {
                        custom: {
                            token: '{"accessToken": "aaaaa","expires":2}'
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/hooks': function() {
                return {
                    access_token: "833294",
                    expires_in: 2
                };
                },
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        });
        var result = legendsoft.fetchServiceToken();
        assert.isNotNull(result, 'Token should not be null')
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
    });


    it('Testing legendSoftHelper method: fetchAllOptions when no existing custom object ', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {},
            '*/cartridge/scripts/helpers/hooks': () => null,
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        });
        assert.doesNotThrow(() => {
            legendsoft.fetchAllOptions();
        });
    });

    it('Testing legendSoftHelper method: fetchAllOptions when no existing custom object ', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {},
            '*/cartridge/scripts/helpers/hooks': () => null,
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/config/statemap': () => {
                return 'AH'
            }
        });    
        var result = legendsoft.fetchAllOptions();
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
    });

    it('LegendSoft fetchAllOptions', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => {
                    return {
                        custom: {
                            token: '{"accessToken": "aaaaa","expires":2}'
                        }
                    };
                },
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {
                                token: '{"accessToken": "aaaaa","expires":2}'
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/hooks': function() {
                return {
                    access_token: "833294",
                    expires_in: 2,
                    success: true,
                    total: 5,
                    data: [{
                        Name: 'name',
                        Town: {
                            Name: 'name',
                            CityName: 'CityName',
                            State: [{
                                Code: 'AB'
                            }]
                        }
                    }]
                };
                },
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/config/statemap': {
                
            }
        });    
        var result = legendsoft.fetchAllOptions(CUSTOM_OBJECT.TYPE, CUSTOM_OBJECT.KEY);
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
    });

    it('LegendSoft fetchServiceToken - Test the function with hooks null values', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => {
                    return {
                        custom: {
                            token: '{"accessToken": "aaaaa","expires":2}'
                        }
                    };
                },
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {
                                token: '{"accessToken": "aaaaa","expires":2}'
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/hooks': () => {
                return {
                    access_token: null,
                    expires_in: null,
                    success: false,
                    total: 0,
                    data: [{}]
                };
            },
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/config/statemap': {
                
            }
        });    
        var result = legendsoft.fetchServiceToken();
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
    });

    it('LegendSoft fetchAllOptions', () => {
        let legendsoft = proxyquire('../../../../../cartridges/int_legendsoft/cartridge/scripts/helpers/legendSoftHelpers.js', {
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {
                                token: '{"accessToken": "aaaaa","expires":2}'
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/hooks': function() {
                    return {
                        access_token: "833294",
                        expires_in: 2,
                        success: true,
                        total: 5,
                        data: [{
                            Name: 'name',
                            Town: {
                                Name: 'name',
                                CityName: 'CityName',
                                State: [{
                                    Code: 'AB'
                                }]
                            }
                        }]
                    };
            },
            'dw/system/HookMgr': {},
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/scripts/config/statemap': () => {
                return 'AH'
            }
        });    
        var result = legendsoft.fetchAllOptions();
        assert.isDefined(result, 'fetchCustomObjectToken is defined');
    });
    
});