'use strict';

/**
 * The onRequest hook is called with every top-level request in a site. This happens both for requests to cached and non-cached pages.
 * For performance reasons the hook function should be kept short.
 *
 * @module  request/OnRequest
 */
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');
/**
 * The onRequest hook function.
 * @returns{dw.system.Status} status response
 */
exports.onRequest = function () {
    var borderFreeEnabled = Site.current.preferences !== null ? Site.current.preferences.custom.bfxIsEnabled : false;
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var brooksBell = cookieHelper.read('brooksBell');
    if (brooksBell && session && session.custom && !session.custom.brooksBell) {
        session.custom.brooksBell = brooksBell;
    }
    if (borderFreeEnabled && customer.authenticated) {
        var geoLocationCountry = request.geolocation.countryCode; // eslint-disable-line no-undef
        var httpParamCountryValue = request.httpParameterMap.country ? // eslint-disable-line no-undef
            request.httpParameterMap.country.value : null; // eslint-disable-line no-undef
        var currentCountry = session.custom.currentCountry;

        // eslint-disable-next-line spellcheck/spell-checker
        if (((geoLocationCountry && geoLocationCountry !== 'US') && (currentCountry && currentCountry !== 'US') && !httpParamCountryValue) ||
            (httpParamCountryValue && httpParamCountryValue !== 'US')) {
            CustomerMgr.logoutCustomer(false);
            response.redirect(URLUtils.url('Home-Show')); // eslint-disable-line no-undef
        }
    }
    var idmEnabled = Site.current.preferences !== null ? Site.current.preferences.custom.uaidmIsEnabled : false;
    if (idmEnabled && request.httpMethod === 'GET') { // eslint-disable-line no-undef
        var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
        var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');
        if (cookieHelpers.read('UALogout') !== undefined) {
            cookieHelpers.deleteCookie('UALogout');
            cookieHelpers.deleteCookie('UAExternalID');
            cookieHelpers.deleteCookie('UAActiveSession');
            CustomerMgr.logoutCustomer(true);
            response.redirect(URLUtils.url('Account-LoggedOutDueToInactivity')); // eslint-disable-line no-undef
        }
        var idmID = cookieHelpers.read('UAExternalID');
        var sizePreferences = cookieHelpers.read('UAExternalSizePreferences0');
        if (idmID !== undefined) {
            // Check if a logged-in user is trying to access either Account or Cart
            // If a user is past the allowable session time, then force the user
            // to reauthenticate.
            var activeSession = cookieHelpers.read('UAActiveSession');
            var uaExternalSizePreferences;
            var privacySession = Site.current.preferences.custom.uaidmActiveSession;
            var loginSession = Site.current.preferences.custom.uaidmPersistantSession;
            var now = (Date.now() / 1000);
            var URL = request.httpURL.toString(); // eslint-disable-line no-undef
            var privacySessionTimeExpire = (now - activeSession) > privacySession;
            var loginSessionTimeElapsed = (now - activeSession) > loginSession;
            var cookieExpiration = activeSession;
            cookieHelpers.create('UAActiveSession', now, cookieExpiration);
            if (privacySessionTimeExpire || loginSessionTimeElapsed) {
                cookieHelpers.deleteCookie('UAExternalID');
                if (sizePreferences !== undefined) {
                    for (let i = 0; i < i + 1; i++) {
                        uaExternalSizePreferences = cookieHelpers.read('UAExternalSizePreferences' + i);
                        if (uaExternalSizePreferences !== undefined) {
                            cookieHelpers.deleteCookie('UAExternalSizePreferences' + i);
                        } else {
                            break;
                        }
                    }
                }

                CustomerMgr.logoutCustomer(true);
                response.redirect(URLUtils.url('Account-LoggedOutDueToInactivity')); // eslint-disable-line no-undef
            } else if (URL.indexOf('MiniCartShow') === -1 && !customer.authenticated) {
                let valueArray = [];
                try {
                    if (sizePreferences !== undefined) {
                        for (let i = 0; i < i + 1; i++) {
                            uaExternalSizePreferences = cookieHelpers.read('UAExternalSizePreferences' + i);
                            if (uaExternalSizePreferences !== undefined) {
                                valueArray.push(JSON.parse(uaExternalSizePreferences));
                            } else {
                                break;
                            }
                        }
                    }
                } catch (e) {
                    // this is to allow users login even if there is a problem with the cookie split
                    // deleting "bad" cookies
                    if (sizePreferences !== undefined) {
                        for (let i = 0; i < i + 1; i++) {
                            uaExternalSizePreferences = cookieHelpers.read('UAExternalSizePreferences' + i);
                            if (uaExternalSizePreferences !== undefined) {
                                cookieHelpers.deleteCookie('UAExternalSizePreferences' + i);
                            } else {
                                break;
                            }
                        }
                    }
                }
                try {
                    idmHelper.loginCustomer(JSON.parse(decodeURI(idmID)), true, valueArray);
                } catch (e) {
                    dw.system.Logger.error('Error in OnRequest.js -> idmHelper.loginCustomer() :: {0}', e.message);
                }
            }
        }
    }
    var mapCookieToSessionEnabled = Site.current.preferences !== null ? Site.current.preferences.custom.mapCookiesToSessionEnabled : false;
    if (mapCookieToSessionEnabled && request.httpMethod === 'GET') { // eslint-disable-line no-undef
        var cookieToSessionMap = 'cookieToSessionVariableMap' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('cookieToSessionVariableMap') ? JSON.parse(Site.current.getCustomPreferenceValue('cookieToSessionVariableMap')) : {};
        Object.keys(cookieToSessionMap).forEach(function (sessionVar) {
            var cookieName = cookieToSessionMap[sessionVar];
            var cookieVal = cookieHelper.read(cookieName);
            if (!empty(cookieVal)) {
                session.custom[sessionVar] = cookieVal;
            }
        });
    }
    return new Status(Status.OK);
};
