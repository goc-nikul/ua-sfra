'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('Locale', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var PriceHelper = require('app_ua_core/cartridge/scripts/util/PriceHelper');
    var countries = PreferencesUtil.getJsonValue('countriesJSON');
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(req.locale.id);
    var viewData = res.getViewData();
    var countryLocaleCount = 1;
    session.custom.currentCountry = currentLocale.country;
    // This method will set the price book for the country based on the details available in countriesJSON.
    PriceHelper.setSitesApplicablePriceBooks(currentLocale.country, countries);
    for (var i = 0; i < viewData.localeModel.locale.localLinks.length; i++) {
        var localLinks = viewData.localeModel.locale.localLinks[i];
        if (currentLocale.country === localLinks.country) {
            countryLocaleCount++;
        }
    }
    viewData.countryLocaleCount = countryLocaleCount;
    viewData.shipCountry = currentLocale.country;
    viewData.baseCountries = countries;
    res.setViewData(viewData);
    next();
});


server.append('SetLocale', function (req, res, next) {
    var viewData = res.getViewData();
    var redirectUrl = viewData.redirectUrl;
    if (req.querystring.action === 'RedirectURL-Start') {
        viewData.redirectUrl = redirectUrl.replace('RedirectURL-Start', 'Home-Show');
    }
    next();
});

module.exports = server.exports();
