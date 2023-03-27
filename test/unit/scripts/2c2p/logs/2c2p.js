'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

var logs = proxyquire('../../../../../cartridges/int_2c2p/cartridge/scripts/logs/2c2p', {
    'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger')
});

describe('int_2c2p/cartridge/scripts/jobs/ProcessRefunds.js', function () { 

    it('Test Method - writelog', () => {
        var logType = 'error';
        var message = 'error';
        var result = logs.writelog(logType, message);
        assert.isUndefined(result, undefined);
    });

    it('Test Method - LOG_TYPE', () => {
        var LOG_TYPE = {
            DEBUG: 'debug',
            ERROR: 'error',
            INFO: 'info',
            WARN: 'warn'
        };
        var result = logs.LOG_TYPE;
        assert.deepEqual(result.DEBUG, LOG_TYPE.DEBUG);
        assert.deepEqual(result.ERROR, LOG_TYPE.ERROR);
        assert.deepEqual(result.INFO, LOG_TYPE.INFO);
        assert.deepEqual(result.WARN, LOG_TYPE.WARN);
    });
});
