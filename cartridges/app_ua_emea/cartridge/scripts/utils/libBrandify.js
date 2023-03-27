'use strict';

var baselibBrandify = require('app_ua_core/cartridge/scripts/utils/libBrandify');
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
        src = src.replace('.html', '_' + urlEdit + '.html');
    }
    return src;
}

baselibBrandify.createStoreLocatorURL = createStoreLocatorURL;
module.exports = baselibBrandify;

