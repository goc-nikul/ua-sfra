'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var Site = require('../../mocks/dw/dw_system_Site');
var currentSite = Site.getCurrent();


describe('app_ua_core/cartridge/scripts/utils/libTrustArc test', () => {
    var libTrustArc = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/utils/libTrustArc.js', {
        'dw/system/Site': require('../../mocks/dw/dw_system_Site')
    });

    it('Testing method: libTrustArc', () => {

        global.request = { locale: 'en_US' };
        assert.equal(libTrustArc.createTrustArcURL(), 'https://consent.truste.com/notice?domain=underarmour.com&c=teconsent&text=true&gtm=1&language=en_US&country=us', 'Language and country attributes are appended');

        global.request = { locale: '' };
        assert.equal(libTrustArc.createTrustArcURL(), 'https://consent.truste.com/notice?domain=underarmour.com&c=teconsent&text=true&gtm=1', 'Language and country attributes are not appended');

        global.request = { locale: 'en_GB' };
        assert.equal(libTrustArc.createTrustArcURL(), 'https://consent.truste.com/notice?domain=underarmour.com&c=teconsent&text=true&gtm=1&language=en_GB&country=gb', 'Behavior query param set to expressed');

        global.request = { locale: 'en_US' };
        assert.equal(libTrustArc.createTrustArcURL(), 'https://consent.truste.com/notice?domain=underarmour.com&c=teconsent&text=true&gtm=1&language=en_US&country=us', 'Empty trustarcJSON shoould return results');
    });
});
