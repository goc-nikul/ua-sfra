var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = chai.assert;

describe('completeFeed', function () {
    var performConstructorConnectRequestSpy;
    var completeFeed;
    var params;

    beforeEach(function () {
        performConstructorConnectRequestSpy = sinon.spy(() => ({
            response: {
                status: 'OK',
                ok: true,
                object: {
                    response: JSON.stringify({ id: 'salesforce-feed-id' }),
                    statusCode: 200
                }
            }
        }));

        completeFeed = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/api/completeFeed', {
            '*/cartridge/scripts/helpers/api/performConstructorConnectRequest': performConstructorConnectRequestSpy,
            '*/cartridge/scripts/constants/apiUrl': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/apiUrl'),
            '*/cartridge/scripts/helpers/logger': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
        });

        params = {
            salesforceFeedId: 'salesforce-feed-id',
            totalExecutionTimeMs: 4200,
            sentChunksCount: 42,
            credentials: {
                apiToken: 'api-token',
                apiKey: 'api-key'
            }
        };
    });

    it('should return the correct response', function () {
        var result = completeFeed(params);

        // Explicitly assert each property
        assert.equal(result.status, 'OK');
        assert.equal(result.ok, true);
        assert.deepEqual(result.object, {
            response: JSON.stringify({ id: 'salesforce-feed-id' }),
            statusCode: 200
        });
    });

    it('should call the api function with the correct payload', function () {
        completeFeed(params);

        // Check that the spy was called with a specific first argument structure
        var expectedPayload = JSON.stringify({
            total_execution_time_ms: 4200,
            salesforce_feed_id: 'salesforce-feed-id'
        });
        var call = performConstructorConnectRequestSpy.getCall(0);
        assert.equal(call.args[0].payload, expectedPayload);
        assert.equal(call.args[0].url, 'https://connect.cnstrc.com/v2/salesforce/complete_feed');
        assert.deepEqual(call.args[0].credentials, params.credentials);
    });
});
