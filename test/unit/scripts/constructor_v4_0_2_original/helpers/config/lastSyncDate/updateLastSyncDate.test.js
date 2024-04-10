var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = chai.assert;

describe('updateLastSyncDate', function () {
    var updateLastSyncDate;
    var getCustomPreferenceStub;
    var buildLastSyncDateKeyStub;
    var loggerLogStub;
    var sitePreferencesMock = { constructorLastSyncDates: 'lastSyncDates' };
    var args;

    beforeEach(function () {
        sinon.restore();

        getCustomPreferenceStub = sinon.stub();
        buildLastSyncDateKeyStub = sinon.stub();
        loggerLogStub = sinon.stub();

        args = {
            value: new Date('2022-01-01T00:00:00.000Z'),
            locale: 'en_US',
            jobID: 'job123'
        };

        buildLastSyncDateKeyStub.withArgs('job123', 'en_US').returns('job123:en_US');

        updateLastSyncDate = proxyquire('../../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/lastSyncDate/updateLastSyncDate', {
            '*/cartridge/scripts/helpers/config/getCustomPreference': getCustomPreferenceStub,
            '*/cartridge/scripts/helpers/config/lastSyncDate/buildLastSyncDateKey': buildLastSyncDateKeyStub,
            '*/cartridge/scripts/constants/sitePreferences': sitePreferencesMock,
            '*/cartridge/scripts/helpers/logger': { log: loggerLogStub },
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
            'dw/system/Site': {
                getCurrent: sinon.stub().returns({
                    getPreferences: sinon.stub().returns({
                        getCustom: sinon.stub().returns({})
                    })
                })
            }
        });
    });

    afterEach(function () {
        sinon.restore();
    });

    it('should update the last sync date successfully and return true', function () {
        getCustomPreferenceStub.returns(JSON.stringify({}));
        var result = updateLastSyncDate(args);
        assert.isTrue(result);
        sinon.assert.calledOnce(buildLastSyncDateKeyStub);
        sinon.assert.calledOnce(loggerLogStub);
    });

    it('should handle an existing custom preference correctly', function () {
        var existingPreference = JSON.stringify({ 'job123:en_US': '2021-12-31T00:00:00.000Z' });
        getCustomPreferenceStub.returns(existingPreference);
        var result = updateLastSyncDate(args);
        assert.isTrue(result);
        sinon.assert.calledWithExactly(getCustomPreferenceStub, sitePreferencesMock.constructorLastSyncDates);
    });

    it('should default locale to "default" when not provided', function () {
        args.locale = undefined;
        updateLastSyncDate(args);
        sinon.assert.calledWithExactly(buildLastSyncDateKeyStub, args.jobID, undefined);
    });

    it('should log the update action', function () {
        getCustomPreferenceStub.returns(JSON.stringify({}));
        updateLastSyncDate(args);
        sinon.assert.calledWith(loggerLogStub, sinon.match.string);
    });

    it('should correctly update when the custom preference is empty', function () {
        getCustomPreferenceStub.returns(null);
        var result = updateLastSyncDate(args);
        assert.isTrue(result);
    });
});
