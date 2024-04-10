'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Site = require('../../mocks/dw/dw_system_Site');
var currentSite = Site.getCurrent();

describe('app_ua_core/cartridge/scripts/util/loggerHelper test', () => {
    var loggerHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/util/loggerHelper', {
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/util/ArrayList': require('../../mocks/dw/dw_util_ArrayListIterator'),
        'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
    });

    it('Testing handler', () => {
        currentSite.preferenceMap.serviceLogValuesToBeMasked = [".+?"];

        var logMessage = JSON.stringify(['test "apple": val,ue']);
        var result = loggerHelper.maskSensitiveInfo(logMessage);
        assert.equal(result, '["test \\"apple\\":"******",ue"]', 'Log string is masked');

        var result = loggerHelper.maskSensitiveInfo();
        assert.equal(result, '', 'Empty result is returned');

        var result = loggerHelper.maskSensitiveInfo('test');
        assert.equal(result, '', 'String returns empty result');

        var result3 = loggerHelper.getLoggingObject();
        assert.isString(result3, 'stringified object');
    });
});
