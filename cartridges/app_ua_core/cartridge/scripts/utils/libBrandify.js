'use strict';

/**
 * Brandify returns a source url for a Brandify store locator iframe
 * Function gets the site peference url and checks request locale and adds related language to src.
 * @param {string} brandifyBaseUrl {string} - base url from the site preferenc settings
 * @return {string} - iframe url for Brandify
 */
function createStoreLocatorURL(brandifyBaseUrl) {
    var src = brandifyBaseUrl;

    // if we're in a locale that is not English, then append the language to the URL
    // eslint-disable-next-line no-undef
    var cL = request.locale;

    // If locale in_ID use storelocator template of en_ID(en) locale
    if (cL === 'in_ID') { cL = 'en_ID'; }
    if (!(cL.indexOf('en') >= 0 || cL.indexOf('default') >= 0)) {
        var urlEdit = cL.substring(0, 2);
        src = src.replace('1.html', '_' + urlEdit + '1.html');
    }
    return src;
}

/**
 * Brandify returns a source url for a Brandify store locator iframe
 * Function gets the country code to send to the iframe
 * @return {string} - country code
 */
function getStoreCountryCode() {
    // eslint-disable-next-line no-undef
    var countryCode = request.locale.countryCode;

    // eslint-disable-next-line no-undef
    var geoLocationCountry = request.geolocation.countryCode;

    if (geoLocationCountry) {
        countryCode = geoLocationCountry;
    }

    return countryCode;
}

/**
 * Brandify returns a source url for a Brandify store locator iframe
 * Function gets the closest postal code using geoip
 * otherwise we use Baltimore  21230 to send to the iframe
 * @return {string} - postal code
 */
function getStorePostalCode() {
    var postalCode = '21230';
    // eslint-disable-next-line no-undef
    var geoLocationPostalCode = request.geolocation.postalCode;

    if (geoLocationPostalCode) {
        postalCode = geoLocationPostalCode;
    }
    return postalCode;
}

module.exports = {
    createStoreLocatorURL: createStoreLocatorURL,
    getStoreCountryCode: getStoreCountryCode,
    getStorePostalCode: getStorePostalCode
};
