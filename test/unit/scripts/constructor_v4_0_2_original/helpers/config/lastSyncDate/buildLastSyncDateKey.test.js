var chai = require('chai');
var assert = chai.assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('buildLastSyncDateKey', function () {
    var jobID = 'jobID';

    it('should build the key with job ID and locale', function () {
        var buildLastSyncDateKey = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/lastSyncDate/buildLastSyncDateKey', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        defaultLocale: 'en_US'
                    };
                }
            }
        });

        var result = buildLastSyncDateKey(jobID, 'en_US');
        assert.strictEqual(result, 'jobID_locale:en_US');
    });

    it('should build the key with job ID and default locale if locale is null', function () {
        // Using proxyquire within the test to ensure the mock applies for this test's scope
        var buildLastSyncDateKeyWithDefaultLocale = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/lastSyncDate/buildLastSyncDateKey', {
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        defaultLocale: 'en_GB'
                    };
                }
            }
        });

        var result = buildLastSyncDateKeyWithDefaultLocale(jobID, null);
        assert.strictEqual(result, 'jobID_locale:en_GB');
    });
});
