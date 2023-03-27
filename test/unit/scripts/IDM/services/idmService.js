'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var svc = {
    mock: false,
    URL: 'https://ua-test//oauth/authorize'
};

global.empty = (data) => {
    return !data;
};

var logMsg = 'test log message';
describe('plugin_ua_idm/cartridge/scripts/services/idmService.js', () => {
    var service;
    var idmService = proxyquire('../../../../../cartridges/plugin_ua_idm/cartridge/scripts/services/idmService', {
        'dw/svc/LocalServiceRegistry': {
            createService: (svcId, callback) => {
                callback.createRequest(svc, '');
                if (svc.mock === true) {
                    return callback.mockCall(svc, {});
                }
                callback.filterLogMessage(logMsg);
                return callback.parseResponse(svc, {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: '{"action":"Login-OAuthReentry"}'
                });
            }
        },
        '*/cartridge/scripts/util/loggerHelper.js': { maskSensitiveInfo() { return 'masked logs'; } }
    });

    it('Testing Method: should return service with mock response when it is mock service call', () => {
        svc.mock = true;
        service = idmService.createIDMService();
        assert.isDefined(service);
        assert.isNotNull(service.text);
    });

    it('Testing Method: when it is not an AUTH call', () => {
        svc.URL = '';
        service = idmService.createIDMService();
        assert.isDefined(service);
        assert.isNotNull(service);

        svc.URL = 'https:/test_ url/test_call';
        service = idmService.createIDMService();
        assert.isDefined(service);
        assert.isNotNull(service);
    });

    it('Testing Method: when it\'s a live call', () => {
        svc.mock = false;
        service = idmService.createIDMService();
        assert.isDefined(service);
        assert.isNotNull(service);
        assert.deepEqual(service, {
            statusCode: 200,
            statusMessage: 'Success',
            text: '{"action":"Login-OAuthReentry"}'
        });
        logMsg = '';
        service = idmService.createIDMService();
        assert.isDefined(service);
        assert.isNotNull(service);
    });
});
