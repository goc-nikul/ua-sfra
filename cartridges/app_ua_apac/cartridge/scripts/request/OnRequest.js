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

/**
 * The onRequest hook function.
 * @returns{dw.system.Status} status response
 */
exports.onRequest = function () {
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    var customerProfile = request.session.customer && request.session.customer.authenticated && request.session.customer.profile;
    if (mobileAuthProvider.mobileAuthEnabled && customerProfile && empty(customerProfile.custom.CI)) {
        var earlyAccessUrl = request.httpPath.indexOf('Product-Show') !== -1 && request.httpQueryString.indexOf('earlyAccessPid') !== -1;
        var initiateMobileAuthUrl = (request.httpPath.indexOf('Home-Show') !== -1 || request.httpPath.indexOf('Default-Start') !== -1) && !empty(request.httpQueryString) && request.httpQueryString.indexOf('initiateMobileAuth') !== -1;
        var isLoginOrRegisterAjax = (request.httpPath.indexOf('Login-Show') !== -1 || request.httpPath.indexOf('Login-CreateAccountModal') !== -1) && !empty(request.httpQueryString) && request.httpQueryString.indexOf('format=ajax') !== -1;
        if (request.httpPath.indexOf('__Analytics') === -1 &&
            request.httpPath.indexOf('__SYSTEM__') === -1 &&
            request.httpPath.indexOf('CM-Dynamic') === -1 &&
            request.httpPath.indexOf('Login-InitiateMobileAuth') === -1 &&
            request.httpPath.indexOf('Login-MobileAuthModal') === -1 &&
            request.httpPath.indexOf('Login-MobileAuthReturn') === -1 &&
            request.httpPath.indexOf('Login-CompleteMobileAuth') === -1 &&
            request.httpPath.indexOf('Account-Login') === -1 &&
            request.httpPath.indexOf('Account-SubmitRegistration') === -1 &&
            request.httpPath.indexOf('Login-Logout') === -1 &&
            request.httpPath.indexOf('Product-GetProductsSlides') === -1 && // This is invoked from PDP recommendations. If this is not bypassed, this will also load elements of the homepage on PDP. Eg: main.js is loaded twice.
            request.httpPath.indexOf('Product-PriceOnHover') === -1 &&
            request.httpPath.indexOf('ViewApplication-') === -1 &&
            !isLoginOrRegisterAjax &&
            !earlyAccessUrl &&
            !initiateMobileAuthUrl
            ) {
            response.redirect(URLUtils.url('Home-Show', 'initiateMobileAuth', true));
        }
    }
    return new Status(Status.OK);
};
