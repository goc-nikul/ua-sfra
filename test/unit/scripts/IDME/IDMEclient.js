'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_IDME/cartridge/scripts/IDMEclient.js', () => {
    it('Testing Client: token and scope exists', () => {
        var IDMEclient = proxyquire('../../../../cartridges/int_IDME/cartridge/scripts/IDMEclient.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'./util/IDMEServiceHelper.js': {
		        requestTokenData: function () {
			                return {
		                    token: 'aaaa',
		                    scope: 'aaa'
		                };
	            },
	            requestValidationStatus: function () {
	                return 'requestValidationStatus';
	            }
    		}
        });
        var config = {
            clientID: 'aaaa',
            clientSecret: 'aaaa',
            redirectUri: 'aaaa',
            apiTokenEndpointURI: 'aaaa',
            apiValidationStatusEndpointURI: 'aaaa',
            code: ''
        };
        var client = new IDMEclient(config);
        var result = client.verify()
        assert.isNotNull(result.token, 'token is null');
    });
    
     it('Testing Client: config is not added', () => {
        var IDMEclient = proxyquire('../../../../cartridges/int_IDME/cartridge/scripts/IDMEclient.js', {
            'dw/system/Logger': {
        		error: () => ''
    		},
    		'./util/IDMEServiceHelper.js': {
		        requestTokenData: function () {
			                return {
		                    token: 'aaaa',
		                    scope: 'aaa'
		                };
	            },
	            requestValidationStatus: function () {
	                return 'requestValidationStatus';
	            }
    		}
        });
        var config = {
            clientID: 'aaaa',
            code: ''
        };
        var client = new IDMEclient(config);
        assert.isNotNull(client, 'result is null');
    });
});
