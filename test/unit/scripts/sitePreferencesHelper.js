const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var key = 'enableAurusPay';
global.empty = (data) => {
    return !data;
};

var mockObject = {
    'dw/system/Site':
    {
        current: {
            getCustomPreferenceValue: function (value) {
                if ( value === key) {
                    return true
                }
                return false;
            }
        }
    }
};

var sitePreferencesHelper = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/sitePreferencesHelper.js', mockObject);
describe('sitePreferencesHelper.js file test cases', function () {
    describe('isAurusEnabled method test cases', function () {
        it('should return true', () => {
            var result = sitePreferencesHelper.isAurusEnabled();
            assert.isTrue(result);
        });
        it('should return false', () => {
            key = 'diff val';
            var result = sitePreferencesHelper.isAurusEnabled();
            assert.isFalse(result);
        });
    });
});

