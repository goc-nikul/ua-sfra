var getCustomPreference = require('*/cartridge/scripts/helpers/config/getCustomPreference');
var sitePreferences = require('*/cartridge/scripts/constants/sitePreferences');

/**
 * Check if a string might be a JSON object.
 *
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string might be a JSON object, false otherwise.
 */
function mightBeJSONObject(str) {
  return typeof str === 'string' && str.trim().startsWith('{') && str.trim().endsWith('}');
}

/**
 * Get the API key for ConstructorIO based on locale.
 *
 * @param {string} locale - The locale to get the API key for.
 * @returns {string|null} - The API key for the provided locale, the default API key if the locale-specific key is not found, or null.
 */
function getApiKeyForLocale(locale) {
  var apiKeyData = getCustomPreference(sitePreferences.constructorApiKey);

  if (typeof apiKeyData !== 'string') {
    return null;
  }

  if (mightBeJSONObject(apiKeyData)) {
    var apiKeyObj = JSON.parse(apiKeyData); // Assuming the check in mightBeJSONObject is reliable
    return locale && apiKeyObj[locale] ? apiKeyObj[locale] : apiKeyObj.default;
  }

  return apiKeyData;
}

/**
 * Returns the credentials to Constructor.io if set, or null.
 * @param {string} apiKeyOverride The API key to use instead of the one in the config.
 * @returns The credentials object, or null if invalid.
 */
module.exports = function getCredentialsOrNull(apiKeyOverride) {
  var apiToken = getCustomPreference(sitePreferences.constructorApiToken);
  var apiKey = apiKeyOverride || getApiKeyForLocale(request.locale);

  if (!apiToken || !apiKey) {
    return null;
  }

  return {
    apiToken: apiToken,
    apiKey: apiKey
  };
};
