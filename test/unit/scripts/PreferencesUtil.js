'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/scripts/utils/PreferencesUtil test', () => {
    var PreferencesUtil = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/utils/PreferencesUtil', {
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/system/System': require('../../mocks/dw/dw_system_System'),
        '~/cartridge/scripts/utils/JsonUtils': require('../../mocks/scripts/JsonUtils')
    });

    global.empty = (data) => {
        return !data;
    };

    it('Testing method: getValue', () => {
        var result = PreferencesUtil.getValue('testString');
        assert.equal(result, 'test', 'String should be returned');

        var result = PreferencesUtil.getValue();
        assert.equal(result, null, 'Null should be returned when no key is passed');
    });

    it('Testing method: getJsonValue', () => {
        var data = PreferencesUtil.getJsonValue('testJson');
        assert.deepEqual(data, {test: 1}, 'JSON should be returned');

        var data = PreferencesUtil.getJsonValue();
        assert.equal(data, null, 'Null should be returned when no key is passed');
    });

    it('Testing method: getGlobalValue', () => {
        var data = PreferencesUtil.getGlobalValue('testString');
        assert.equal(data, 'test', 'String should be returned');

        var data = PreferencesUtil.getGlobalValue();
        assert.equal(data, null, 'Null should be returned when no key is passed');
    });

    it('Testing method: getGlobalJsonValue', () => {
        var data = PreferencesUtil.getGlobalJsonValue('testJson');
        assert.deepEqual(data, {test: 1}, 'JSON should be returned');

        var data = PreferencesUtil.getGlobalJsonValue();
        assert.equal(data, null, 'Null should be returned when no key is passed');
    });

    it('Testing method: isCountryEnabled', () => {
        global.request.locale = 'en_US';
        var result = PreferencesUtil.isCountryEnabled('testStringAll');
        assert.equal(result, true, 'ALL should return true');

        var result = PreferencesUtil.isCountryEnabled('testStringUs');
        assert.equal(result, true, 'US should return true');

        var result = PreferencesUtil.isCountryEnabled('testStringNone');
        assert.equal(result, false, 'Empty should return false');

        var result = PreferencesUtil.isCountryEnabled('doesNotExist');
        assert.equal(result, false, 'Undefined should return false');

        global.request.locale = '';
        var result = PreferencesUtil.isCountryEnabled('testStringAll');
        assert.equal(result, false, 'Empty locale should return false');
    });
});
