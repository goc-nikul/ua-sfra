'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var svcMock = {
    setAuthentication: () => { },
    addHeader: () => { },
    setRequestMethod: () => { },
    setURL: () => { }
};

var params = {
    token: 'testtoken',
    graphQLApiUrl: 'https://testurl.com',
    requestBody: '{}',
    authHostname: 'https://testurl.com'
};

global.empty = (data) => {
    return !data;
};

var LocalServiceRegistryStub = {
    createService: (svcId, callback) => {
        callback.createRequest(svcMock, params);
        callback.filterLogMessage('{\'status\': 200, \'text\': \'success\'}');
        callback.parseResponse(svcMock, params);
        callback.filterLogMessage();
        return svcMock;
    }
};

describe('int_first_data/cartridge/scripts/services/firstDataService', () => {
    var service;
    var firstDataService = proxyquire('../../../../../cartridges/int_first_data/cartridge/scripts/services/firstDataService', {
        'dw/svc/LocalServiceRegistry': LocalServiceRegistryStub,
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '*/cartridge/scripts/util/loggerHelper.js': { maskSensitiveInfo() { } }
    });

    it('Testing method : createAuthTokenService => should return AuthTokenService service object', () => {
        service = firstDataService.createAuthTokenService();
        assert.isDefined(service);
    });

    it('Testing method : createGraphQLService => should return GraphQLService service object', () => {
        service = firstDataService.createGraphQLService();
        assert.isDefined(service);
    });
});
