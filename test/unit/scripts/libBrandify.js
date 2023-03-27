'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();



describe('app_ua_core/cartridge/scripts/utils/libBrandify test', () => {
    var storeLocator = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/utils/libBrandify.js', {
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../mocks/scripts/PreferencesUtil'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource')
    });

    var addressFieldsToVerify = ['address1', 'city', 'state'];
    var object = {
        'address1': '',
        'city': 'Redmond',
        'state': 'CA<body'
    };

    it('Testing method: libBrandify', () => {

        var testURL = 'https://mobile.where2getit.com/underarmour/2015/index1.html';

        global.request = { locale: 'in_ID' };
        assert.equal(storeLocator.createStoreLocatorURL(testURL), testURL, 'Test URL is unchanged');

        global.request = { locale: 'es_ES' };
        assert.equal(storeLocator.createStoreLocatorURL(testURL), 'https://mobile.where2getit.com/underarmour/2015/index_es1.html', 'Test URL ends in index_es1.html');

        global.request = {
            locale: {
                countryCode: 'US',
                postalCode: '90210'
            },
            geolocation: {
                countryCode: 'MX',
                postalCode: '123456'
            }
        };

        assert.equal(storeLocator.getStoreCountryCode(), 'MX', 'Store country code is MX');
        assert.equal(storeLocator.getStorePostalCode(), '123456', 'Store country code is 123456');
    });
});
