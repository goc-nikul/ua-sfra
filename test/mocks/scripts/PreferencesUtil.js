'use strict';

var Site = require('../../mocks/dw/dw_system_Site');
var System = require('../../mocks/dw/dw_system_System');
var JSONUtils = require('../../mocks/scripts/JsonUtils');

/* Global variables */
var currentSite = Site.getCurrent();
var orgPreferences = System.getPreferences();

function getValue(key) {
    return currentSite.getCustomPreferenceValue(key);
}

function getJsonValue(key) {
    return JSONUtils.parse(getValue(key));
}

function getGlobalValue(key) {
    return orgPreferences.getCustom()[key];
}

function getGlobalJsonValue(key) {
    return JSONUtils.parse(getGlobalValue(key));
}

module.exports = {
    getValue: getValue,
    getJsonValue: getJsonValue,
    getGlobalValue: getGlobalValue,
    getGlobalJsonValue: getGlobalJsonValue
};
