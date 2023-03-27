'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/config/countries.js', () => {
    it('Testing oAuthRenentryRedirectEndpoints: verify the redirect URL ends ', () => {
        var oAuthRenentryRedirectEndpoints = proxyquire('../../../cartridges/app_ua_core/cartridge/config/oAuthRenentryRedirectEndpoints.js', {});
        assert.isNotNull(oAuthRenentryRedirectEndpoints, 'oAuthRenentryRedirectEndpoints shouldn\'t be null');
        assert.isDefined(oAuthRenentryRedirectEndpoints, 'oAuthRenentryRedirectEndpoints should defined');
    });
});