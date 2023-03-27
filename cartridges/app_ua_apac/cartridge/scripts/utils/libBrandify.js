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

    // As per LRA code, Store locators are displaying in english
    if (cL === 'in_ID') { cL = 'en_ID'; }
    if (cL === 'th_TH') { cL = 'en_TH'; }
    if (cL === 'zh_HK') { cL = 'en_HK'; }

    if (!(cL.indexOf('en') >= 0 || cL.indexOf('default') >= 0)) {
        var urlEdit = cL.substring(0, 2);
        src = src.replace('.html', '_' + urlEdit + '.html');
    }
    return src;
}

baselibBrandify.createStoreLocatorURL = createStoreLocatorURL;
module.exports = baselibBrandify;

