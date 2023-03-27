'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('plugin_ua_idm/cartridge/scripts/idmPreferences.js', () => {
    it('should return the idm prefernces if preferences are available for the site', () => {
        var idmPreferences = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmPreferences', {
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
        });
        assert.isDefined(idmPreferences);
        assert.isNotNull(idmPreferences);
        assert.isDefined(idmPreferences.isIdmEnabled);
    });

    it('should return empty objectwhen preferences are not available for the site', () => {
        var idmPreferences = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmPreferences', {
            'dw/system/Site': { getCurrent() { return {}; } }
        });
        assert.isDefined(idmPreferences);
        assert.isNotNull(idmPreferences);
        assert.deepEqual(idmPreferences, {});
    });
});
