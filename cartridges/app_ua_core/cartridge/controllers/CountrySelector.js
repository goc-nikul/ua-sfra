'use strict';
var server = require('server');
var Locale = require('dw/util/Locale');
var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');


/**
 * Checks if BorderFree is enabled or not
 * @param {Object} shipCountry - a parameter from Query Parameters.
 * @returns {Object} - json value contains value localURL.
 */
function getWelComeMat(shipCountry) {
    var CountryModel = require('*/cartridge/models/country');
    var countryModel = new CountryModel();
    var allCountries = countryModel.getFullSitesList();
    var displayOrder = allCountries.displayOrder;
    var localURL = null;
    var result;
    if (!empty(displayOrder)) {
        for (var i = 0; i < displayOrder.length; i++) {
            var continent = allCountries.displayOrder[i];
            var continentCountries = allCountries[continent];
            for (var j = 0; j < continentCountries.length; j++) {
                var countryCode = continentCountries[j].code;
                var countryURL = continentCountries[j].url;
                if (countryCode === shipCountry && countryURL.indexOf('country') > -1) {
                    result = { countryURL: countryURL };
                } else if (countryCode === shipCountry && countryURL.indexOf('country') < 0) {
                    localURL = countryURL;
                    result = { localURL: localURL };
                }
                if (result) break;
            }
            if (result) break;
        }
    }
    return result;
}

server.use('ShowWelcomeMat', function (req, res, next) {
    var geoLocationCountry = req.geolocation.countryCode;
    var countryCookie = cookieHelper.read('regionDetected');
    var country = countryCookie !== undefined ? countryCookie : geoLocationCountry;
    var currentsessionCountry = session.custom.currentCountry;
    var runTimeCountry = country;
    var curLocale = Locale.getLocale(request.getLocale()).country; // eslint-disable-line
    var result = getWelComeMat(geoLocationCountry);

    if (currentsessionCountry && currentsessionCountry === geoLocationCountry) {
        runTimeCountry = currentsessionCountry;
    }
    var shipToCountry = req.querystring.country ? req.querystring.country : runTimeCountry;

    var alreadyWelcomed = true;
    if (!empty(result)) {
        if (!empty(shipToCountry && curLocale) && shipToCountry !== curLocale && (countryCookie === undefined || country !== shipToCountry)) {
            alreadyWelcomed = false;
        }
    }
 // Create a cookie if country cookies is not present
    if (countryCookie === undefined || countryCookie !== curLocale) {
        cookieHelper.create('regionDetected', curLocale, '2592000');
    }
    res.render('/common/welcomemat', {
        alreadyWelcomed: alreadyWelcomed,
        shipCountry: shipToCountry
    });
    next();
});


server.get('GetWelcomeMatContent', function (req, res, next) {
    var geoLocationCountryName = request.geolocation.countryName; // eslint-disable-line
    var shipCountry = req.querystring.shipCountry;
    var CountryModel = require('*/cartridge/models/country');
    var countryModel = new CountryModel();
    var globalAccessCountries = JSON.parse(countryModel.getGlobalAccessCountries());
    var defaultCountry = Locale.getLocale(request.getLocale()).country; // eslint-disable-line
    var defaultCountryName = Locale.getLocale(request.getLocale()).getDisplayCountry(); // eslint-disable-line
    var defaultCountryURL = globalAccessCountries[defaultCountry].url;
    var localCountryURL = null;
    var result = getWelComeMat(shipCountry);

    // if shipCountry or full site list display order is invalid
    if (empty(result)) {
        var tmpResult = getWelComeMat(defaultCountry);
        if (!empty(tmpResult)) {
            result = tmpResult;
            shipCountry = defaultCountry;
        }
    }

    var localURL = result.countryURL ? result.countryURL : result.localURL;
    var joinSymbol = localURL.match(/\?./) ? '&' : '?';
    if (req.querystring.forwardedQueryString) {
        localURL += joinSymbol + req.querystring.forwardedQueryString;
    }

    res.render('/common/welcomematContent', {
        geoLocationCountryName: geoLocationCountryName,
        geoLocationCountry: req.geolocation.countryCode,
        shipCountry: shipCountry,
        localCountryURL: localCountryURL,
        defaultCountryURL: defaultCountryURL,
        localURL: localURL,
        countryURL: result.countryURL,
        defaultCountrycode: defaultCountry.toLowerCase(),
        defaultCountryName: defaultCountryName
    });

    next();
});

module.exports = server.exports();
