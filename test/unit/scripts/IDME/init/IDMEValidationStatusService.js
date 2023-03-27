'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var service = {
    setRequestMethod: () => {},
    setURL: () => {},
    addHeader: () => {}
};

describe('int_IDME/cartridge/scripts/init/IDMEValidationStatusService.js', () => {


    it('Testing IDMETokenDataService: token and scope exists', () => {
        var IDMEHelper = proxyquire('../../../../../cartridges/int_IDME/cartridge/scripts/init/IDMEValidationStatusService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service, {
                        request: 'consignment'
                    });
                    return callbackObject.parseResponse('', {
                        consignmentid: 'ABCD',
                        status: 200
                    });
                },
            },
            '../util/IDMEHelper': {
			        parseValidationResponse: function () {
				                return {
			                    token: 'aaaa',
			                    scope: 'aaa'
			                };
		            },
		            getMockedIDMEResponse: function () {
				        return {
				            token: 'mockToken',
				            scope: 'MockScopeValue'
				        };
    				}
    			},
    			'dw/system/Logger': {
        			error: () => ''
    			}
        });
        
    });
    
});
