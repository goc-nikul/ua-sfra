var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = chai.assert;

describe('performConstructorConnectRequest', function () {
    var performConstructorConnectRequest;
    var params;
    var spies;

    beforeEach(function () {
        spies = {
            setURL: sinon.spy(),
            setAuthentication: sinon.spy(),
            setRequestMethod: sinon.spy(),
            addHeader: sinon.spy(),
            call: sinon.stub().returns({
                isOk: sinon.stub().returns(true)
            })
        };

        performConstructorConnectRequest = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/api/performConstructorConnectRequest', {
            '*/cartridge/scripts/services/httpService': {
                init: function () {
                    return spies;
                }
            },
            '*/cartridge/scripts/helpers/logger': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
        });

        params = {
            url: 'https://example.com/api',
            payload: { data: 'payload' },
            credentials: {
                apiToken: 'api-token',
                apiKey: 'api-key'
            }
        };
    });

    it('should properly initialize the http client', function () {
        performConstructorConnectRequest(params);

        assert.isTrue(spies.setURL.calledWith(params.url));
        assert.isTrue(spies.setAuthentication.calledWith('NONE'));
        assert.isTrue(spies.setRequestMethod.calledWith('POST'));
        assert.isTrue(spies.addHeader.calledWith('api-token', params.credentials.apiToken));
        assert.isTrue(spies.addHeader.calledWith('api-key', params.credentials.apiKey));
    });

    it('should return the result obj', function () {
        var result = performConstructorConnectRequest(params);

        assert.isFunction(result.response.isOk);
        assert.isNumber(result.totalTimeMs);
    });

    describe('when the request fails more than the limit', function () {
        beforeEach(function () {
            params.retryTimes = 2;

            spies.call = sinon.stub().returns({
                isOk: sinon.stub().returns(false),
                getErrorMessage: sinon.stub().returns('error')
            });
        });

        it('should retry the request with retryTimes', function () {
            assert.throws(() => {
                performConstructorConnectRequest(params);
            }, 'Error while sending request, max attempts reached.');

            assert.isTrue(spies.call.calledTwice);
        });
    });
});
