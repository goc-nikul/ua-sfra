'use strict';

const {
    assert
} = require('chai');

const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('int_nzpost/cartridge/scripts/helpers/customObjectHelpers.js', () => {


    it('Testing customObjectHelpers method: saveAuthToken when no custom object', () => {
        var customObjectHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/customObjectHelpers.js', {
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: () => {
                    return {
                        custom: {
                            token: null
                        }
                    }
                }
            }
        });
        assert.doesNotThrow(() => {
            customObjectHelpers.saveAuthToken();
        });

    });

    it('Testing customObjectHelpers method: saveAuthToken when custom object exists', () => {
        var customObjectHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/customObjectHelpers.js', {
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    return {
                        custom: {
                            token: null
                        }
                    }
                }
            }
        });
        assert.doesNotThrow(() => {
            customObjectHelpers.saveAuthToken();
        });
    });

    it('Testing customObjectHelpers method: getAuthToken when token doesnot  exists', () => {
        var customObjectHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/customObjectHelpers.js', {
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    return {
                        custom: {
                            token: null
                        }
                    }
                }
            }
        });
        var authToken = customObjectHelpers.getAuthToken();
        assert.isNull(authToken, 'authToken should be null');
    });

    it('Testing customObjectHelpers method: getAuthToken when token exists', () => {
        var customObjectHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/customObjectHelpers.js', {
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    return {
                        custom: {
                            token: 'TOKEN-1234'
                        }
                    }
                }
            }
        });
        var authToken = customObjectHelpers.getAuthToken();
        assert.equal(authToken, 'TOKEN-1234');
    });

    it('Testing customObjectHelpers method: getAuthToken when token exists', () => {
        var customObjectHelpers = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/helpers/customObjectHelpers.js', {
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    return {
                        custom: {
                            token: 'TOKEN-1234'
                        }
                    }
                }
            }
        });
        assert.doesNotThrow(() => {
            customObjectHelpers.resetAuthToken();
        });
    });

});
