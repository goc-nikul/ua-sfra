'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_apac/cartridge/scripts/utils/libBrandify test', () => {
    var storeLocator = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/utils/libBrandify.js', {
        '*/cartridge/scripts/utils/PreferencesUtil': require('../../../../mocks/scripts/PreferencesUtil'),
        'app_ua_core/cartridge/scripts/utils/libBrandify': {}
    });

    it('Testing method: libBrandify', () => {
        var testURL = 'https://mobile.where2getit.com/underarmour/2015/index1.html';

        global.request = { locale: 'in_ID' };
        assert.equal(storeLocator.createStoreLocatorURL(testURL), testURL, 'Test URL is unchanged');
    });
    it('Testing method: libBrandify', () => {
        var testURL = 'https://mobile.where2getit.com/underarmour/2015/index1.html';
        global.request = { locale: 'es_ES' };
        assert.equal(storeLocator.createStoreLocatorURL(testURL), 'https://mobile.where2getit.com/underarmour/2015/index1_es.html', 'Test URL ends in index_es1.html');
    });

    it('Testing method: libBrandify', () => {
        var testURL = 'https://mobile.where2getit.com/underarmour/2015/index1.html';

        global.request = { locale: 'th_TH' };
        assert.equal(storeLocator.createStoreLocatorURL(testURL), testURL, 'Test URL is unchanged');
    });

    it('Testing method: libBrandify', () => {
        var testURL = 'https://mobile.where2getit.com/underarmour/2015/index1.html';

        global.request = { locale: 'zh_HK' };
        assert.equal(storeLocator.createStoreLocatorURL(testURL), testURL, 'Test URL is unchanged');
    });
});
