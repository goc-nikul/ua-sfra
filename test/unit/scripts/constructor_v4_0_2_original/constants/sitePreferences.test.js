'use strict';

var assert = require('chai').assert;

var sitePreferences = require('../../../../../cartridges/link_constructor_connect/cartridge/scripts/constants/sitePreferences');

describe('sitePreferences', function () {
    it('should have the correct value for constructorLastSyncDates', function () {
        assert.strictEqual(sitePreferences.constructorLastSyncDates, 'Constructor_LastSyncDates');
    });

    it('should have the correct value for constructorApiToken', function () {
        assert.strictEqual(sitePreferences.constructorApiToken, 'Constructor_ApiToken');
    });

    it('should have the correct value for constructorApiKey', function () {
        assert.strictEqual(sitePreferences.constructorApiKey, 'Constructor_ApiKey');
    });
});
