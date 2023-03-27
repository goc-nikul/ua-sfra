'use strict';

function getWebsiteURL(siteID, locale) {
    return 'test/' + siteID + '/' + locale + '/Home-Show';
}

function getCurrent(pdict, locale) {
    return 'test/' + locale;
}

module.exports = {
    getWebsiteURL: getWebsiteURL,
    getCurrent: getCurrent
};
