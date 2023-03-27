/* globals request response */
'use strict';

/**
 * The onRequest hook is called with every top-level request in a site. This happens both for requests to cached and non-cached pages.
 * For performance reasons the hook function should be kept short.
 *
 * @module  request/OnRequest
 */
var Status = require('dw/system/Status');
var URLUtils = require('dw/web/URLUtils');
var HookMgr = require('dw/system/HookMgr');

/**
 * The onRequest hook function.
 * @returns{dw.system.Status} status response
 */
exports.onRequest = function () {
    if (request.httpPath.indexOf('__Analytics') === -1 &&
        request.httpPath.indexOf('__SYSTEM__') === -1 &&
        request.httpPath.indexOf('Account-EditProfile') === -1 &&
        request.httpPath.indexOf('Account-SaveProfile') === -1 &&
        request.httpPath.indexOf('Login-Logout') === -1) {
        var customerProfile = request.session.customer && request.session.customer.authenticated && request.session.customer.profile;
        if (customerProfile && HookMgr.hasHook('app.memberson.CountryConfig')) {
            var countryCode = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
            var membersonConfigs = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
            if (membersonConfigs.membersonEnabled) {
                var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');
                if (membersonHelpers.validateUserForMemberson(customerProfile.email) && customerProfile.custom['Loyalty-OptStatus'] && (empty(customerProfile.custom['Loyalty-ID']) || empty(customerProfile.custom.birthYear) || empty(customerProfile.birthday))) {
                    response.redirect(URLUtils.url('Account-EditProfile'));
                }
            }
        }
    }
    return new Status(Status.OK);
};
