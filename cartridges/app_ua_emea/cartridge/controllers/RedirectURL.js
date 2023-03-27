'use strict';

var server = require('server');
server.extend(module.superModule);
var geoLocationRedirect = require('*/cartridge/scripts/middleware/geoLocationRedirect');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

// we cannot override this since we are not able to find status code from base layer
server.replace('Start', geoLocationRedirect.redirect, function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var config = require('*/cartridge/config/wellKnown');
    var serveJSONFiles = config.files;
    for (var i = 0; i < serveJSONFiles.length; i++) {
        var file = serveJSONFiles[i];
        if (URLRedirectMgr.getRedirectOrigin() === '/.well-known/' + file) {
            res.cacheExpiration(config['cache-hours']);
            res.setContentType('application/json');
            res.print(JSON.stringify(require('../static/default/.well-known/' + file)));
            return next();
        }
    }

    var redirect = URLRedirectMgr.redirect;
    var location = redirect ? redirect.location : null;
    var redirectStatus = redirect ? redirect.getStatus() : null;
    var path = '/' + req.locale.id.toLocaleLowerCase().replace('_', '-');
    if (!location) {
        // This logic has been taken over from LRA codebase DetermineHomepageURL.ds file.
        if (req.httpHeaders['x-is-path_info'].equals(path) || req.httpHeaders['x-is-path_info'].equals(path + '/')) {
            var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
            var Site = require('dw/system/Site');
            pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
            //  Handle login and show password module
            res.setViewData({
                showLogin: req.querystring.login || false,
                showPasswordReset: req.querystring.passwordreset || false
            });
            res.render('/home/homePage');
        } else {
            res.setStatusCode(410);
            res.render('error/notFound');
        }
    } else {
        if (redirectStatus) {
            res.setRedirectStatus(redirectStatus);
        }
        res.redirect(location);
    }

    return next();
}, pageMetaData.computedPageMetaData);

// eslint-disable-next-line consistent-return
server.prepend('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var config = require('*/cartridge/config/wellKnown');
    var serveJSONFiles = config.files;
    for (var i = 0; i < serveJSONFiles.length; i++) {
        var file = serveJSONFiles[i];
        if (URLRedirectMgr.getRedirectOrigin() === '/.well-known/' + file + '.txt') {
            if (config['cache-hours']) {
                res.cacheExpiration(config['cache-hours']);
            }
            res.render('common/applePayDomainAssociation');
            this.emit('route:Complete', req, res);
            return true;
        }
    }
    next();
});

/**
 * RedirectURL-RedirectLocale : This endpoint will be used to redirect the url based on the locale/country
 */
server.get('RedirectLocale', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var countriesJSON = PreferencesUtil.getJsonValue('countriesJSON');
    var countryCode = req.geolocation.countryCode;
    var JSONUtils = require('int_customfeeds/cartridge/scripts/util/JSONUtils');
    var lookupCountry = JSONUtils.searchJSON(countriesJSON, 'countryCode', countryCode);
    var httpProtocol = req.https ? 'https://' : 'http://';
    var location;

    if (!empty(lookupCountry) && lookupCountry[0]) {
        location = httpProtocol + lookupCountry[0].hostname + '/' + lookupCountry[0].locales[0].replace('_', '-').toLowerCase() + '/';
    } else {
        location = PreferencesUtil.getValue('redirectNoLocaleDefaultUrl');
    }

    res.redirect(location);
    next();
});


module.exports = server.exports();
