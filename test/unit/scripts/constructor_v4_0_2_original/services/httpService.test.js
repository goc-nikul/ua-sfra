'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;

describe('httpService', function () {
    var httpService;

    beforeEach(function () {
        // Path to scripts
        httpService = require('../../../../../cartridges/link_constructor_connect/cartridge/scripts/services/httpService');

        // Mock dw System to set compatibilityMode
        require('dw/system/System').compatibilityMode = 'compatibility_mode';
    });

    describe('init', function () {
        it('should return a valid service object', function () {
            var service = httpService.init();

            expect(service).to.be.an('object');
        });
    });

    describe('when creating requests', function () {
        it('should set the User-Agent header', function () {
            var service = httpService.init();

            // Create an empty request to set the headers
            service.configObj.createRequest(service, {});

            assert.strictEqual(
                service.client.requestHeaders['User-Agent'],
                'Cartridge; Constructor Connect [javascript] SiteGenesis + SFRA); PLATFORM: SFCC compatibility_mode'
            );
        });

        it('should set the Content-Type header', function () {
            var service = httpService.init();

            // Create an empty request to set the headers
            service.configObj.createRequest(service, {});

            assert.strictEqual(
                service.client.requestHeaders['Content-Type'],
                'application/json'
            );
        });
    });

    describe('when parsing responses', function () {
        it('should return the response headers', function () {
            var service = httpService.init();

            var response = service.configObj.parseResponse(service, {
                responseHeaders: {
                    'Content-Type': 'application/json'
                }
            });

            assert.deepEqual(response.headers, {
                'Content-Type': 'application/json'
            });
        });

        it('should return the response status code', function () {
            var service = httpService.init();

            var response = service.configObj.parseResponse(service, {
                statusCode: 200
            });

            assert.strictEqual(response.statusCode, 200);
        });

        it('should return the response body as text', function () {
            var service = httpService.init();

            var response = service.configObj.parseResponse(service, {
                text: '{"foo":"bar"}'
            });

            assert.strictEqual(response.response, '{"foo":"bar"}');
        });
    });

    describe('when filtering log messages', function () {
        it('should return the message', function () {
            var service = httpService.init();

            var message = service.configObj.filterLogMessage('foo');

            assert.strictEqual(message, 'foo');
        });
    });
});
