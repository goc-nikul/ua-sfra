var Site = require('dw/system/Site');

/* Script includes*/
var JSONUtils = require('*/cartridge/scripts/utils/JsonUtils');

/* Global variables */
var currentSite = Site.getCurrent();

/**
 * General wrapper for getCustomPreferenceValue(...)
 * @param {string} key - ID of the preference
 * @return {MultiData} value - Value of the site preference
 */
function getValue(key) {
  var value = null;

  if (!empty(key)) {
    value = currentSite.getCustomPreferenceValue(key);
  }

  return value;
}

/**
 * General wrapper for getCustomPreferenceValue(...) with parsing into JSON
 * @param {string} key - ID of the preference
 * @return {Object} value - Parsed into JSON site preference
 */
function getJsonValue(key) {
  var value = getValue(key);

  if (!empty(value)) {
    value = JSONUtils.parse(value);
  }

  return value;
}


module.exports = {
  getJsonValue: getJsonValue
};
