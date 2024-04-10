'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;
var sinon = require('sinon');

var redirectStub = sinon.stub();
var getAvailableDomainsForLocaleStub = sinon.stub();
var getAvailableDomainsForLangStub = sinon.stub();
var isDomainLocaleRelateStub = sinon.stub();
var getDefaultLocaleStub = sinon.stub();
var nextStub = sinon.stub();

var req = {
    host: 'en_DK',
    httpHeaders: {
        'x-is-path_info': '/'
    },
    https: true,
    locale: {
        id: 'default'
    }
};
global.empty = (data) => {
    return !data;
};

var res = {
    redirect: redirectStub
};

describe('app_ua_emea/cartridge/scripts/middleware/geoLocationRedirect.js', () => {
    var geoLocationRedirect = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/middleware/geoLocationRedirect', {
        'int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds': {
            getLocalePath() {
                return 'default';
            },
            isDomainLocaleRelate: isDomainLocaleRelateStub,
            getAvailableDomainsForLocale: getAvailableDomainsForLocaleStub,
            getLocaleLangByLocaleID() {
                return 'en';
            },
            getHostForLocale() {

            },
            getAvailableDomainsForLang: getAvailableDomainsForLangStub,
            finishURL() {
                return 'https://test-finishurl/en_US.com';
            },
            getDefaultLocale: getDefaultLocaleStub,
            getRequestLang(param) {
                return param.substring(0, 2);
            }
        }
    });

    beforeEach(() => {
        nextStub.reset();
        redirectStub.reset();
        getAvailableDomainsForLocaleStub.reset();
    });

    it('should call next function when locale related to request domain ', () => {
        getAvailableDomainsForLocaleStub.returns({
            'fr_FR': 'FR locale'
        });
        isDomainLocaleRelateStub.returns(true);

        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isTrue(redirectStub.calledOnce);
        assert.isTrue(nextStub.calledOnce);
    });

    it('checking the behaviour when request domain present in availableDomains', () => {
        getAvailableDomainsForLocaleStub.returns({
            'en_DK': 'DK locale'
        });

        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isTrue(redirectStub.calledOnce);
        assert.isTrue(nextStub.calledOnce);
        redirectStub.reset();

        req.httpHeaders['x-is-path_info'] = '/test';
        req.https = false;
        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isFalse(redirectStub.calledOnce);
    });

    it('checking the behaviour requestLocaleId is default locale', () => {
        req.host = 'default';
        isDomainLocaleRelateStub.returns(false);
        getDefaultLocaleStub.returns('default');

        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isTrue(redirectStub.calledOnce);
        assert.isTrue(nextStub.calledOnce);
        nextStub.reset();
        redirectStub.reset();

        req.locale.id = 'fr_fr';
        getDefaultLocaleStub.returns('');
        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isTrue(redirectStub.calledOnce);
        assert.isTrue(nextStub.calledOnce);
    });

    it('checking the behaviour when available Domains for request language', () => {
        getAvailableDomainsForLocaleStub.resetBehavior();
        req.host = 'en_GB';
        getAvailableDomainsForLangStub.returns({
            'en_GB': 'en_GB'

        });
        geoLocationRedirect.redirect(req, res, nextStub);
        getAvailableDomainsForLangStub.returns({
            'de_De': 'de_De'

        });
        geoLocationRedirect.redirect(req, res, nextStub);
    });

    it('should call redirect function when available Domains for request language', () => {
        getAvailableDomainsForLocaleStub.resetBehavior();
        req.host = 'en_GB';
        getAvailableDomainsForLangStub.returns({
            'en_GB': 'en_GB'

        });
        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isTrue(redirectStub.called);
        redirectStub.reset();

        getAvailableDomainsForLangStub.returns({
            'de_De': 'de_De'

        });
        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isTrue(redirectStub.called);
    });

    it('shouldn\'t call redirect function when no available Domains for request language', () => {
        getAvailableDomainsForLangStub.returns('');
        geoLocationRedirect.redirect(req, res, nextStub);
        assert.isTrue(redirectStub.notCalled);
    });
});