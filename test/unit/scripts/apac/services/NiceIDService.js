'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var svc = {
    URL: 'https://niceid-test/'
};

global.empty = (data) => {
    return !data;
};

var logMsg = 'test log message';
describe('app_ua_apac/cartridge/scripts/services/NiceIDService.js', () => {
    var service;
    var NiceIDService = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/services/NiceIDService', {
        'dw/svc/LocalServiceRegistry': {
            createService: (svcId, callback) => {
                callback.createRequest(svc, '');
                callback.filterLogMessage(logMsg);
                return callback.parseResponse(svc, {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: '{"dataHeader": {"CNTY_CD": "ko","GW_RSLT_CD": "1200","GW_RSLT_MSG": "success"},"dataBody": {"rsp_cd": "P000","result_cd": "0000","site_code": "test","token_version_id": "202401292056235G-NCGACC550-5HBH7-F582CD29BA","token_val": "I9L8h6vOZ8fWRBp1DXSOXYSSTuOmpxQUEjUezHTwaIM=","period": 3600}}'
                });
            }
        },
        '*/cartridge/scripts/util/loggerHelper.js': { maskSensitiveInfo() { return 'masked logs'; } }
    });

    it('Testing Method: when it is not an AUTH call', () => {
        svc.URL = '/test';
        service = NiceIDService.createNiceIDService();
        assert.isDefined(service);
        assert.isNotNull(service);
    });

    it('Testing Method: when it is not an AUTH call', () => {
        svc.URL = '/test';
        logMsg = null;
        service = NiceIDService.createNiceIDService();
        assert.isDefined(service);
        assert.isNotNull(service);
    });
});
