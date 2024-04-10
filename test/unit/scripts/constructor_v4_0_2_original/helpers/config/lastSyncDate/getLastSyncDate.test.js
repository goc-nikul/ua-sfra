var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = chai.assert;

describe('getLastSyncDate', function () {
    var getLastSyncDate;
    var getCustomPreferenceStub;
    var buildLastSyncDateKeyStub;
    var sitePreferencesMock = { constructorLastSyncDates: 'lastSyncDates' };

    beforeEach(function () {
        getCustomPreferenceStub = sinon.stub();
        buildLastSyncDateKeyStub = sinon.stub();

        buildLastSyncDateKeyStub.withArgs('job123', 'en_US').returns('job123_locale:en_US');

        getLastSyncDate = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/lastSyncDate/getLastSyncDate', {
            '*/cartridge/scripts/helpers/config/getCustomPreference': getCustomPreferenceStub,
            '*/cartridge/scripts/helpers/config/lastSyncDate/buildLastSyncDateKey': buildLastSyncDateKeyStub,
            '*/cartridge/scripts/constants/sitePreferences': sitePreferencesMock
        });
    });

    afterEach(function () {
        sinon.restore();
    });

    it('should return null if getCustomPreference returns null', function () {
        getCustomPreferenceStub.returns(null);
        var result = getLastSyncDate('job123', 'en_US');
        assert.isNull(result);
    });

    it('should return null if the key does not exist in the JSON object', function () {
        getCustomPreferenceStub.returns(JSON.stringify({}));
        var result = getLastSyncDate('job123', 'en_US');
        assert.isNull(result);
    });

    it('should return a valid Date object if the key exists', function () {
        var dateStr = '2022-01-01T00:00:00.000Z';
        getCustomPreferenceStub.returns(JSON.stringify({ 'job123_locale:en_US': dateStr }));
        var result = getLastSyncDate('job123', 'en_US');
        assert.deepEqual(result, new Date(dateStr));
    });
});
