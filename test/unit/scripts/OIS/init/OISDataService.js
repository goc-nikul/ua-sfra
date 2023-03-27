'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var service = {
    setRequestMethod: () => {},
    setURL: () => {},
    addHeader: () => {}
};

describe('int_OIS/cartridge/scripts/init/OISDataService.js', () => {
    it('Testing OISDataService: get the token data', () => {
        var OISDataService = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/init/OISDataService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service, {
                        request: 'consignment'
                    });
                    return callbackObject.parseResponse('', {
                        consignmentid: 'ABCD',
                        status: 200
                    });
                }
            },
            '../util/OISHelper': {
                getMockedOISResponse: function () {
                    return {
                        token: 'aaaa',
                        scope: 'aaa'
                    };
                },
                parseGraphQLResponse: function () {
                    return {
                        token: 'mockToken',
                        scope: 'MockScopeValue'
                    };
                }
            },
            '*/cartridge/scripts/util/loggerHelper.js': {
                maskSensitiveInfo: () => ''
            }
        });

        var result = OISDataService.getTokenData();
        assert.isDefined(result, 'result not defined');
    });

    it('Testing OISDataService: get the getGraphQL', () => {
        var OISDataService = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/init/OISDataService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service, {
                        request: 'consignment'
                    });
                    return callbackObject.parseResponse('', {
                        consignmentid: 'ABCD',
                        status: 200
                    });
                }
            },
            '../util/OISHelper': {
                getMockedOISResponse: function () {
                    return {
                        token: 'aaaa',
                        scope: 'aaa'
                    };
                },
                parseGraphQLResponse: function () {
                    return {
                        token: 'mockToken',
                        scope: 'MockScopeValue'
                    };
                }
            },
            '*/cartridge/scripts/util/loggerHelper.js': {
                maskSensitiveInfo: () => ''
            }
        });

        var result = OISDataService.getGraphQL();
        assert.isDefined(result, 'result not defined');
    });
});
