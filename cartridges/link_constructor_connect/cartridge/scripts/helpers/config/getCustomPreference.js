var Site = require('dw/system/Site');

/**
 * Gets the configuration value for the given key.
 * @param key The config identifier.
 * @returns The config value, or null.
 */
module.exports = function getCustomPreference(key) {
  var currentSite = Site.getCurrent();
  return currentSite.getCustomPreferenceValue(key) || null;
};
