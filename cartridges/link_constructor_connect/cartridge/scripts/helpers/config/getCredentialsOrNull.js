var getCustomPreference = require('*/cartridge/scripts/helpers/config/getCustomPreference');
var sitePreferences = require('*/cartridge/scripts/constants/sitePreferences');

/**
 * Returns the credentials to Constructor.io if set, or null.
 * @param {string} apiKeyOverride The API key to use instead of the one in the config.
 * @returns The credentials object, or null if invalid.
 */
module.exports = function getCredentialsOrNull(apiKeyOverride) {
  var apiToken = getCustomPreference(sitePreferences.constructorApiToken);
  var apiKey = apiKeyOverride || getCustomPreference(sitePreferences.constructorApiKey);

  if (!apiToken || !apiKey) {
    return null;
  }

  return {
    apiToken: apiToken,
    apiKey: apiKey
  };
};
