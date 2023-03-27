'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_IDME/cartridge/scripts/util/IDMEHelper.js', () => {


    it('Testing requestTokenData: token and scope exists', () => {
        var IDMEServiceHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEServiceHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'../init/IDMETokenDataService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'OK'
                    }
                }
            },
            '../init/IDMEValidationStatusService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'OK'
                    }
                }
            }
        });
        var code = 'aaaa';
        var clientID = 'aaaa';
        var clientSecret = 'aaaa';
        var redirectUri = 'aaaa';
        var apiEndpointURI = 'aaaa';
        
        var result = IDMEServiceHelper.requestTokenData(code, clientID, clientSecret, redirectUri, apiEndpointURI);
        assert.isNull(result, 'result is null');
    });
    
    it('Testing requestTokenData: service status is not OK', () => {
        var IDMEServiceHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEServiceHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'../init/IDMETokenDataService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'NotOK'
                    }
                }
            },
            '../init/IDMEValidationStatusService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'NotOK'
                    }
                }
            }
        });
        var code = 'aaaa';
        var clientID = 'aaaa';
        var clientSecret = 'aaaa';
        var redirectUri = 'aaaa';
        var apiEndpointURI = 'aaaa';
        
        var result = IDMEServiceHelper.requestTokenData(code, clientID, clientSecret, redirectUri, apiEndpointURI);
        assert.isNull(result, 'result is null');
    });
    
    it('Testing requestValidationStatus: MockValidationStatus', () => {
        var IDMEServiceHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEServiceHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'../init/IDMETokenDataService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'OK'
                    }
                }
            },
            '../init/IDMEValidationStatusService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'OK'
                    }
                }
            }
        });
        var tiaccesstoken = 'aaaa';
        var apiEndpointURI = 'aaaa';
        var result = IDMEServiceHelper.requestValidationStatus(tiaccesstoken, apiEndpointURI);
        assert.isNull(result, 'result is null');
    });
    
    it('Testing requestValidationStatus: service status is not OK', () => {
        var IDMEServiceHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEServiceHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'../init/IDMETokenDataService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'NotOK'
                    }
                }
            },
            '../init/IDMEValidationStatusService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'NotOK'
                    }
                }
            }
        });
        var tiaccesstoken = 'aaaa';
        var apiEndpointURI = 'aaaa';
        var result = IDMEServiceHelper.requestValidationStatus(tiaccesstoken, apiEndpointURI);
        assert.isNull(result, 'result is null');
    });
    
    it('Testing requestValidationStatus: tiaccesstoken is null', () => {
        var IDMEServiceHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEServiceHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'../init/IDMETokenDataService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'NotOK'
                    }
                }
            },
            '../init/IDMEValidationStatusService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'NotOK'
                    }
                }
            }
        });
        var tiaccesstoken = null;
        var apiEndpointURI = 'aaaa';
        var result = IDMEServiceHelper.requestValidationStatus(tiaccesstoken, apiEndpointURI);
        assert.isNotNull(result, 'result is null');
    });
    
    it('Testing requestValidationStatus: service error', () => {
        var IDMEServiceHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEServiceHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'../init/IDMETokenDataService.js': {
                getResponse: () => null,
                call: () => {
                    return {
                        status : 'NotOK'
                    }
                }
            },
            '../init/IDMEValidationStatusService.js': {
                getResponse: () => null,
            }
        });
        var tiaccesstoken = null;
        var apiEndpointURI = 'aaaa';
        var result = IDMEServiceHelper.requestValidationStatus(tiaccesstoken, apiEndpointURI);
        assert.isNotNull(result, 'result is null');
    });
    
});
