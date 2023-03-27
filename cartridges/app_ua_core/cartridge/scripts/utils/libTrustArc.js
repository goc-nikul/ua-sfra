'use strict';

/* API Includes */
var Site = require('dw/system/Site');

/* Global variables */
var currentSite = Site.getCurrent();

/**
 * Trustarc returns a source url for a TrustArc script include
 * TrusArc Script is using src url to load specific Cookie Pop up.
 * Function checks request locale and adds related language to src.
 * @return {string} - script url for trustarc
 */
function createTrustArcURL() {
    // eslint-disable-next-line no-undef
    var localeArr = request.locale.toLowerCase().split('_');
    var src = currentSite.getCustomPreferenceValue('trustarcSRC') ? currentSite.getCustomPreferenceValue('trustarcSRC') : 'https://consent.truste.com/notice?domain=underarmour.com&c=teconsent&text=true&gtm=1';
    // check for language and adding it to result src
    // eslint-disable-next-line no-undef
    if (request.locale) {
        // eslint-disable-next-line no-undef
        src += '&language=' + request.locale;
    }
    // check locale country and add it to result src
    if (localeArr.length > 1 && localeArr[1]) {
        src += '&country=' + localeArr[1];
    }
    return src;
}

module.exports = {
    createTrustArcURL: createTrustArcURL
};
