'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;

describe('app_ua_emea/cartridge/scripts/utils/libBrandify.js', () => {
    var libBrandify = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/utils/libBrandify', {
        'app_ua_core/cartridge/scripts/utils/libBrandify': {}
    });

    var src;
    var brandifyBaseUrl = 'https://brandifyBaseUrl_testUrl.html';
    it('should return the modified brandifyBaseUrl to non-en and default locales', () => {
        global.request = {
            locale: 'fr_CA'
        };
        src = libBrandify.createStoreLocatorURL(brandifyBaseUrl);
        assert.isDefined(src);
        assert.notEqual(brandifyBaseUrl, src);
    });

    it('should return the same brandifyBaseUrl to the en, default and in_ID locales', () => {
        global.request = {
            locale: 'in_ID'
        };
        src = libBrandify.createStoreLocatorURL(brandifyBaseUrl);
        assert.isDefined(src);
        assert.equal(brandifyBaseUrl, src);
        global.request = {
            locale: 'default'
        };
        src = libBrandify.createStoreLocatorURL(brandifyBaseUrl);
        assert.isDefined(src);
        assert.equal(brandifyBaseUrl, src);
    });
});
