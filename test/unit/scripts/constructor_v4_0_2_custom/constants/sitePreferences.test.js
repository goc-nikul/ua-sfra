'use strict';

var assert = require('chai').assert;

var sitePreferences = require('../../../../../cartridges/link_constructor_connect_custom/cartridge/scripts/constants/sitePreferences');

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

    it('should have the correct value for CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_IDS_TO_SEND', function () {
        assert.strictEqual(sitePreferences.CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_IDS_TO_SEND, 'Constructor_BucketedAttributeIdsToSend');
    });

    it('should have the correct value for CUSTOM_PROMO_PRICING_ENABLED', function () {
        assert.strictEqual(sitePreferences.CUSTOM_PROMO_PRICING_ENABLED, 'Constructor_PromoPricingEnabled');
    });

    it('should have the correct value for CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_DISPLAY_NAMES_TO_SEND', function () {
        assert.strictEqual(sitePreferences.CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_DISPLAY_NAMES_TO_SEND, 'Constructor_BucketedAttributeDisplayNamesToSend');
    });
});
