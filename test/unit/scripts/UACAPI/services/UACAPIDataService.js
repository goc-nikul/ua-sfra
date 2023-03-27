'use strict';

var proxiquire = require('proxyquire').noCallThru().noPreserveCache();
const {
    assert
} = require('chai');
var sinon = require('sinon');

var svcGraphQL = {
    getConfiguration: () => {
        return {
            credential: {
                url: 'Graph'
            }
        }
    },
    addHeader: () => null,
    setRequestMethod: () => null,
    setURL: () => null
};

var svcOptions = {
    token: 'token1234',
    payload: {
        data: '123'
    }
};

global.empty = (params) => !params;

var LocalServiceRegistryStub = sinon.stub().returns({
    createService: (svcId, callback) => {
        callback.createRequest(svcGraphQL, svcOptions);
        callback.filterLogMessage('{\'status\': 200, \'text\': \'success\'}');
        return callback.parseResponse();
    }
});

var GraphQLResponseStub = sinon.stub().returns({
        status: true,
        text: 'success'
    }),
    MockedUACAPIResponseStub = sinon.stub().returns({
        status: true,
        text: 'success'
    }),
    MockedUACAPITokenResponse = sinon.stub().returns({
        status: true,
        text: 'access_token'
    });


function getProxyObject() {
    return proxiquire('../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/services/UACAPIDataService.js', {
        'dw/svc/LocalServiceRegistry': new LocalServiceRegistryStub(),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        '../helpers/util/UACAPIHelper': {
            parseGraphQLResponse: () => new GraphQLResponseStub(),
            getMockedUACAPIResponse: () => new MockedUACAPIResponseStub(),
            getMockedUACAPITokenResponse: () => new MockedUACAPITokenResponse()
        },
        '*/cartridge/scripts/util/loggerHelper.js': {
            maskSensitiveInfo: () => {}
        }
    });
}

describe('int_mao/cartridge/scripts/UACAPI/services/UACAPIDataService.js', () => {

    it('should return not null for getGraphQL live call', () => {
        var graphQL = getProxyObject().getGraphQL();
        assert.isDefined(graphQL, 'graphQL is not defined');
        assert.isNotNull(graphQL, 'null');
        assert.deepEqual(graphQL, {
            status: true,
            text: 'success'
        });
    });

    it('should return null for getGraphQL live call with response null', () => {
        LocalServiceRegistryStub.returns({
            createService: (svcId, callback) => {
                callback.createRequest(svcGraphQL, svcOptions);
                callback.filterLogMessage(null);
                return callback.parseResponse();
            }
        });
        GraphQLResponseStub = sinon.stub().returns({
            status: false,
            text: null
        });
        var graphQL = getProxyObject().getGraphQL();
        assert.isDefined(graphQL, 'graphQL is not defined');
        assert.isNotNull(graphQL, 'null');
        assert.deepEqual(graphQL, {
            status: false,
            text: null
        });
    });

    it('should return not null for getGraphQL mock call', () => {
        LocalServiceRegistryStub.returns({
            createService: (svcId, callback) => {
                callback.createRequest(svcGraphQL, svcOptions);
                return callback.mockCall();
            }
        });
        var graphQL = getProxyObject().getGraphQL();
        assert.isDefined(graphQL, 'graphQL is not defined');
        assert.isNotNull(graphQL, 'null');
        assert.deepEqual(graphQL, {
            status: true,
            text: 'success'
        });
    });

    it('should return not null for getTokenData live call', () => {
        LocalServiceRegistryStub.returns({
            createService: (svcId, callback) => {
                callback.createRequest(svcGraphQL, svcOptions);
                callback.filterLogMessage('{\'success\' : true, \'text\': \'access_token\'}');
                return callback.parseResponse(svcGraphQL, {
                    status: true,
                    text: 'access_token'
                });
            }
        });
        var tokenData = getProxyObject().getTokenData();
        assert.isDefined(tokenData, 'tokenData is not defined');
        assert.isNotNull(tokenData, 'tokenData is null');
        assert.deepEqual(tokenData, {
            status: true,
            text: 'access_token'
        });
    });

    it('should return not null for getTokenData live call with response null', () => {
        LocalServiceRegistryStub.returns({
            createService: (svcId, callback) => {
                callback.createRequest(svcGraphQL, svcOptions);
                callback.filterLogMessage(null);
                return callback.parseResponse(svcGraphQL, {
                    status: false,
                    text: null
                });
            }
        });
        var tokenData = getProxyObject().getTokenData();
        assert.isDefined(tokenData, 'tokenData is not defined');
        assert.isNotNull(tokenData, 'tokenData is null');
        assert.deepEqual(tokenData, {
            status: false,
            text: null
        });
    });

    it('should return not null for getTokenData mock call', () => {
        LocalServiceRegistryStub.returns({
            createService: (svcId, callback) => {
                callback.createRequest(svcGraphQL, svcOptions);
                return callback.mockCall();
            }
        });
        MockedUACAPITokenResponse = sinon.stub().returns({
            status: true,
            text: 'access_token'
        });
        var tokenData = getProxyObject().getTokenData();
        assert.isDefined(tokenData, 'tokenData is not defined');
        assert.isNotNull(tokenData, 'tokenData is null');
        assert.deepEqual(tokenData, {
            status: true,
            text: 'access_token'
        });
    });

});
