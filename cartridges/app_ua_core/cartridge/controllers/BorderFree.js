'use strict';
var server = require('server');

/**
 * Checks if BorderFree is enabled or not
 * @param {Object} shipCountry - a parameter from Query Parameters.
 * @returns {Object} - json value contains value for isBorderFreeEnabled or localURL.
 */
function getWelComeMat(shipCountry) {
    var CountryModel = require('~/cartridge/models/country');
    var countryModel = new CountryModel();
    var allCountries = countryModel.getFullSitesList();
    var displayOrder = allCountries.displayOrder;
    var isBorderFreeEnabled = false;
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
                    isBorderFreeEnabled = true;
                    result = { isBorderFreeEnabled: isBorderFreeEnabled, shipCountryName: continentCountries[j].name };
                } else if (countryCode === shipCountry && countryURL.indexOf('country') < 0) {
                    localURL = countryURL;
                    result = { localURL: localURL, localCountryName: continentCountries[j].name };
                }
                if (result) break;
            }
            if (result) break;
        }
    }
    return result;
}

server.use('ShowWelcomeMat', function (req, res, next) {
    var cookieHelper = require('*/cartridge/scripts/helpers/cookieHelpers');
    var geoLocationCountry = req.geolocation.countryCode;
    var bfxCountryCookie = cookieHelper.read('bfx.country');
    var bfxCountry = bfxCountryCookie !== undefined ? bfxCountryCookie : geoLocationCountry;
    var runTimeCountry = bfxCountry;

    if (session.custom.currentCountry && session.custom.currentCountry !== geoLocationCountry) {
        if (geoLocationCountry === 'US') {
            runTimeCountry = session.custom.currentCountry;
        } else {
            runTimeCountry = bfxCountry;
        }
    }

    var shipToCountry = req.querystring.country ? req.querystring.country : runTimeCountry;
    session.custom.currentCountry = shipToCountry;

    var alreadyWelcomed = true;

    if (shipToCountry !== 'US' && (bfxCountryCookie === undefined || bfxCountry !== shipToCountry)) {
        alreadyWelcomed = false;
    }

    res.render('/common/welcomemat', {
        alreadyWelcomed: alreadyWelcomed,
        shipCountry: shipToCountry
    });
    next();
});

server.get('GetWelcomeMatContent', function (req, res, next) {
    var shipCountry = req.querystring.shipCountry;
    var CountryModel = require('~/cartridge/models/country');
    var countryModel = new CountryModel();
    var globalAccessCountries = JSON.parse(countryModel.getGlobalAccessCountries());
    var defaultCountry = 'US';
    var defaultCountryName = 'United States';
    var isShipCountryGlobalAccess = false;
    var defaultCountryURL = globalAccessCountries[defaultCountry].url;
    var localCountryURL = null;
    var result = getWelComeMat(shipCountry);

    // if shipCountry or full site list display order is invalid
    // we try to fall back to default country
    if (empty(result)) {
        var tmpResult = getWelComeMat(defaultCountry);
        if (!empty(tmpResult)) {
            result = tmpResult;
            shipCountry = defaultCountry;
        }
    }
    if (shipCountry && globalAccessCountries[shipCountry]) {
        isShipCountryGlobalAccess = true;
        localCountryURL = globalAccessCountries[shipCountry].url;
    }

    res.render('/common/welcomematContent', {
        isShipCountryGlobalAccess: isShipCountryGlobalAccess,
        shipCountry: shipCountry,
        shipCountryName: result.shipCountryName,
        localCountryURL: localCountryURL,
        defaultCountryURL: defaultCountryURL,
        defaultCountryName: defaultCountryName,
        localURL: result.localURL,
        localCountryName: result.localCountryName,
        isBorderFreeEnabled: result.isBorderFreeEnabled
    });

    next();
});

module.exports = server.exports();
