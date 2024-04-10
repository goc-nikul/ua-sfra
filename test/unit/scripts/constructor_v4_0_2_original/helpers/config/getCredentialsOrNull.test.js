var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var assert = chai.assert;

describe('getCredentialsOrNull', function () {
    var getCustomPreferenceStub;
    var sitePreferencesMock;

    beforeEach(function () {
        getCustomPreferenceStub = sinon.stub();

        sitePreferencesMock = {
            constructorApiToken: 'constructorApiToken',
            constructorApiKey: 'constructorApiKey'
        };

        getCustomPreferenceStub.withArgs(sitePreferencesMock.constructorApiToken).returns('foobarToken');
        getCustomPreferenceStub.withArgs(sitePreferencesMock.constructorApiKey).returns('foobarKey');
    });

    it('should return null if credentials are not set', function () {
        getCustomPreferenceStub.withArgs(sitePreferencesMock.constructorApiToken).returns(null);
        getCustomPreferenceStub.withArgs(sitePreferencesMock.constructorApiKey).returns(null);

        var getCredentialsOrNull = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/getCredentialsOrNull', {
            '*/cartridge/scripts/helpers/config/getCustomPreference': getCustomPreferenceStub,
            '*/cartridge/scripts/constants/sitePreferences': sitePreferencesMock
        });

        var result = getCredentialsOrNull();

        assert.strictEqual(result, null, "Expected getCredentialsOrNull to return null when credentials are not set.");
    });

    it('should return credentials object if both apiToken and apiKey are set', function () {
        var getCredentialsOrNull = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/getCredentialsOrNull', {
            '*/cartridge/scripts/helpers/config/getCustomPreference': getCustomPreferenceStub,
            '*/cartridge/scripts/constants/sitePreferences': sitePreferencesMock
        });

        var result = getCredentialsOrNull();

        assert.deepEqual(result, {
            apiToken: 'foobarToken',
            apiKey: 'foobarKey'
        });
    });

    it('should use apiKeyOverride if provided', function () {
        var getCredentialsOrNull = proxyquire('../../../../../../cartridges/link_constructor_connect/cartridge/scripts/helpers/config/getCredentialsOrNull', {
            '*/cartridge/scripts/helpers/config/getCustomPreference': getCustomPreferenceStub,
            '*/cartridge/scripts/constants/sitePreferences': sitePreferencesMock
        });

        var result = getCredentialsOrNull('apiKeyOverride');

        assert.deepEqual(result, {
            apiToken: 'foobarToken',
            apiKey: 'apiKeyOverride'
        });
    });
});
