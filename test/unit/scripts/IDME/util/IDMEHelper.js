'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Site = {
    current: {
        preferences: {
            custom: {}
        }
    }
};

describe('int_IDME/cartridge/scripts/util/IDMEHelper.js', () => {


    it('Testing getMockedIDMEResponse: token and scope exists', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var result = IDMEHelper.getMockedIDMEResponse();
        assert.isNotNull(result.token, 'token is null');
        assert.isDefined(result.scope, 'scope is not defined');
    });
    
    it('Testing getMockedIDMEValidationStatusResponse: MockValidationStatus', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var result = IDMEHelper.getMockedIDMEValidationStatusResponse();
        assert.isNotNull(result, 'result is not null');
    });
    
    it('Testing parseTokenDataResponse: statusCode 200', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var svc = '';
        var response = {
				text : "[{\"scope\":\"a\",\"access_token\":\"aaaa\",\"verified\":true}]",
				statusCode : 200
			};
        var result = IDMEHelper.parseTokenDataResponse(svc, response);
        assert.isNotNull(result, 'result is not null');
    });
    
    it('Testing parseTokenDataResponse: statusCode 500', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var svc = '';
        var response = {
				text : "[{\"scope\":\"a\",\"access_token\":\"aaaa\",\"verified\":true}]",
				statusCode : 500
			};
        var result = IDMEHelper.parseTokenDataResponse(svc, response);
        assert.isNotNull(result, 'result is not null');
    });
    
    it('Testing parseTokenDataResponse: invalid text', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var svc = '';
        var response = {
				text : "aaaa",
				statusCode : 500
			};
        var result = IDMEHelper.parseTokenDataResponse(svc, response);
        assert.isNotNull(result, 'result is not null');
    });
    
    it('Testing parseValidationResponse: statusCode 200', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var svc = '';
        var response = {
				text : "[{\"scope\":\"a\",\"access_token\":\"aaaa\",\"verified\":true}]",
				statusCode : 200
			};
        var result = IDMEHelper.parseValidationResponse(svc, response);
        assert.isNotNull(result, 'result is not null');
    });
    
    it('Testing parseValidationResponse: invalid text 200', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var svc = '';
        var response = {
				text : "aaa",
				statusCode : 200
			};
        var result = IDMEHelper.parseValidationResponse(svc, response);
        assert.isNotNull(result, 'result is not null');
    });
    
    it('Testing parseValidationResponse: statusCode 200', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/util/IDMEHelper.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
        });
        var svc = '';
        var response = {
				text : "[{\"scope\":\"a\",\"access_token\":\"aaaa\",\"verified\":true}]",
				statusCode : 500
			};
        var result = IDMEHelper.parseValidationResponse(svc, response);
        assert.isNotNull(result, 'result is not null');
    });

});
