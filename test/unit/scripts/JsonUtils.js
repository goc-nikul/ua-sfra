'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/scripts/utils/JsonUtils test', () => {
    var JsonUtils = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/utils/JsonUtils', {
        'dw/system/Logger': require('../../mocks/dw/dw_system_Logger')
    });

    global.empty = (data) => {
        return !data;
    };

    it('Testing method: parse', () => {
        var positiveScenario = JsonUtils.parse('{"test":1}');
        var negativeScenario = JsonUtils.parse('testString');

        assert.isObject(positiveScenario, 'Valid JSON should return object');
        assert.deepEqual(positiveScenario, {'test': 1}, 'Parsing should match');
        assert.deepEqual(negativeScenario, {}, 'Invalid JSON should return empty object');
        assert.deepEqual(JsonUtils.parse(), {}, 'Empty parameter should return empty object');
    });
});
