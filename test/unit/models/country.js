'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var CountryModel;
var country;
var result;

var countryCode = {
    getValue: () => {
        return '764';
    },
    getDisplayValue: () => {
        return 'display';
    }
}

describe('app_ua_core/cartridge/models/totals.js', () => {
    CountryModel = proxyquire('../../../cartridges/app_ua_core/cartridge/models/country.js', {
        '~/cartridge/scripts/utils/PreferencesUtil': {
            getJsonValue: () => {
                return 'value';
            },
            getValue: () => {
                return countryCode;
            }
        },
        '~/cartridge/scripts/utils/UrlUtils': require('../../mocks/scripts/UrlUtils')
    });

    it('Testing for country model is null', () => {
        country = new CountryModel();

        assert.isDefined(country, 'online should not exists');
        assert.isNotNull(country, 'online should null');
    });

    it('Testing for country model object is exists', () => {
        country = new CountryModel();
        result = country.getBasicSitesList();
        result = country.getFullSitesList();
        result = country.getGlobalAccessCountries();

        assert.isDefined(result, 'online should not exists');
        assert.isNotNull(result, 'online should null');
    });

    it('Testing for countryCode getValue is null', () => {
        countryCode.getValue = ()=> {
            return null;
        };
        country = new CountryModel(countryCode);

        assert.isDefined(country, 'online should not exists');
        assert.isNotNull(country, 'online should null');
    });

    it('Testing for countryCode getValue is equal to some value', () => {
        countryCode.getValue = ()=> {
            return 'sitesListBasic';
        };
        country = new CountryModel(countryCode);

        assert.equal(country.country.countryCode, countryCode.getValue());
        assert.isDefined(country, 'online should not exists');
        assert.isNotNull(country, 'online should null');
    });

});
