'use strict';


/**
 * Curalate module returns current locale in appropriate format
 * @param {string} currentLocale - the locale of the site
 * @return {string} - local with a dash
 */
function prepareLocale(currentLocale) {
    var locale = currentLocale === 'default' ? 'en_US' : currentLocale;
    return locale.replace(/_/, '-');
}

/* Module exports */
exports.prepareLocale = prepareLocale;
