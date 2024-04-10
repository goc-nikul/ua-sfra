'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;

describe('int_adobe_target/cartridge/scripts/adobeTargetPreferences.', () => {
    global.empty = (data) => {
        return !data;
    };

    it('should return the adobe target prefernces if preferences are available for the site', () => {
        var adobeTargetPreferences = proxyquire(
            '../../../../cartridges/int_adobe_target/cartridge/scripts/adobeTargetPreferences',
            {
                'dw/system/Site': require('../../../mocks/dw/dw_system_Site')
            }
        );
        assert.isDefined(adobeTargetPreferences);
        assert.isNotNull(adobeTargetPreferences);
        assert.isDefined(adobeTargetPreferences.orgId);
    });

    it('should return empty objectwhen preferences are not available for the site', () => {
        var adobeTargetPreferences = proxyquire(
            '../../../../cartridges/int_adobe_target/cartridge/scripts/adobeTargetPreferences',
            {
                'dw/system/Site': {
                    getCurrent() {
                        return {};
                    }
                }
            }
        );
        assert.isDefined(adobeTargetPreferences);
        assert.isNotNull(adobeTargetPreferences);
        assert.deepEqual(adobeTargetPreferences, {});
    });
});
