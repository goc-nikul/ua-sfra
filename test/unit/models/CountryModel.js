'use strict';

/* eslint-disable */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/models/country test', () => {
    var CountryModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/country', {
        '~/cartridge/scripts/utils/UrlUtils': require('../../mocks/scripts/UrlUtils'),
        '~/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil')
    });

    global.empty = (data) => {
        return !data;
    };

    it('Testing model properties', () => {
        var result = new CountryModel();

        assert.equal(result.country.countryCode, 'US');
        assert.equal(result.country.displayName, 'USA');
        // add tests for new methods

        assert.isArray(result.getBasicSitesList());
        assert.deepEqual(result.getBasicSitesList(), [{ 'countryCode': 'BE', 'siteID': 'PJG-BE', 'locales': ['en_BE'], 'currencyCode': 'EUR' }, { 'countryCode': 'DE', 'siteID': 'PJG-DE', 'locales': ['de_DE'], 'currencyCode': 'EUR' }]);

        assert.deepEqual(result.getFullSitesList(), { "displayOrder": ["North_America"] });

        assert.equal(result.getGlobalAccessCountries(), '{CA: {url: "https://staging-ca.sfcc.ua-ecm.com/en-ca/"}, AU: {url: "https://staging.underarmour.com/en-au"}, KR: {url: "http://www.underarmour.co.kr/?cregion=%2Fen-us"}}');
    });
});
