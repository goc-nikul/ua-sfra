'use strict';

// Org Preferences Map
var preferenceMap = {
    sitesListBasic: '[{ "countryCode": "BE", "siteID": "PJG-BE", "locales": ["en_BE"], "currencyCode": "EUR" }, { "countryCode": "DE", "siteID": "PJG-DE", "locales": ["de_DE"], "currencyCode": "EUR" }]',
    testString: 'test',
    testJson: '{"test":1}'
};

// Available methods

// Provide a map with custom preferences
function getCustom() {
    return preferenceMap;
}

// dw.system.System methods
function getPreferences() {
    return {
        getCustom: getCustom
    };
}

module.exports = {
    getPreferences: getPreferences
};
