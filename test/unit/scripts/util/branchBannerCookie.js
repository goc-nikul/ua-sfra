'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/config/preferences', () => {
    const branchBannerCookie = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/util/branchBannerCookie', {
        '*/cartridge/scripts/helpers/cookieHelpers': {
            create: function () {
                return {};
            },
            read: function () {
                return 'emailSubscribeCookie';
            }
        }
    });

    it('Testing config preferences properties', () => {
        assert.equal(branchBannerCookie.cookieValue(), 'emailSubscribeCookie');
    });
});
