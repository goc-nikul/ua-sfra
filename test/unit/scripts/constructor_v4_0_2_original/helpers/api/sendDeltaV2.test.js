var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = chai.assert;

describe('sendDeltaV2', function () {
    var performConstructorConnectRequestSpy;
    var sendDeltaV2;
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

        sendDeltaV2 = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/api/sendDeltaV2', {
            '*/cartridge/scripts/helpers/api/performConstructorConnectRequest': performConstructorConnectRequestSpy,
            '*/cartridge/scripts/constants/feedTypes': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/feedTypes'),
            '*/cartridge/scripts/constants/version': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/version'),
            '*/cartridge/scripts/constants/apiUrl': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/apiUrl'),
            '*/cartridge/scripts/helpers/logger': require('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/logger')
        });
    });

    describe('when sending product feeds', function () {
        beforeEach(function () {
            params = {
                salesforceFeedId: 'salesforce-feed-id',
                section: 'Products',
                strategy: 'FULL',
                type: 'product',
                records: [
                    {
                        id: '42',
                        name: 'Product 42'
                    }
                ],
                credentials: {
                    apiToken: 'api-token',
                    apiKey: 'api-key'
                }
            };
        });

        it('should return the correct response', function () {
            var result = sendDeltaV2(params);
            assert.equal(result.status, 'OK');
            assert.isTrue(result.ok);
            assert.equal(result.object.response, JSON.stringify({ id: 'salesforce-feed-id' }));
            assert.equal(result.object.statusCode, 200);
        });

        it('should call the api function with the correct payload', function () {
            sendDeltaV2(params);
            sinon.assert.calledWith(performConstructorConnectRequestSpy, sinon.match({
                url: 'https://connect.cnstrc.com/v2/salesforce/feed/product',
                credentials: params.credentials,
                payload: JSON.stringify({
                    salesforce_feed_id: 'salesforce-feed-id',
                    strategy: 'FULL',
                    payload: [{ id: '42', name: 'Product 42' }],
                    section: 'Products',
                    type: 'product',
                    version: '4.0.2'
                })
            }));
        });
    });

    describe('when sending category feeds', function () {
        beforeEach(function () {
            params = {
                salesforceFeedId: 'salesforce-feed-id',
                strategy: 'FULL',
                type: 'category',
                records: [
                    {
                        id: 'root',
                        name: 'Root Category'
                    }
                ],
                credentials: {
                    apiToken: 'api-token',
                    apiKey: 'api-key'
                }
            };
        });

        it('should return the correct response', function () {
            var result = sendDeltaV2(params);
            assert.equal(result.status, 'OK');
            assert.isTrue(result.ok);
            assert.equal(result.object.response, JSON.stringify({ id: 'salesforce-feed-id' }));
            assert.equal(result.object.statusCode, 200);
        });

        it('should call the api function with the correct payload', function () {
            sendDeltaV2(params);
            sinon.assert.calledWith(performConstructorConnectRequestSpy, sinon.match({
                url: 'https://connect.cnstrc.com/v2/salesforce/feed/category',
                credentials: params.credentials,
                payload: JSON.stringify({
                    salesforce_feed_id: 'salesforce-feed-id',
                    strategy: 'FULL',
                    payload: [{ id: 'root', name: 'Root Category' }],
                    type: 'category',
                    version: '4.0.2'
                })
            }));
        });
    });
});
