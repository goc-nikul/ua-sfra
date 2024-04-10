var buildLastSyncDateKey = require('*/cartridge/scripts/helpers/config/lastSyncDate/buildLastSyncDateKey');
var getCustomPreference = require('*/cartridge/scripts/helpers/config/getCustomPreference');
var sitePreferences = require('*/cartridge/scripts/constants/sitePreferences');

/**
 * Fetches the last sync date for the given job and locale.
 * @param {string} jobID The job ID.
 * @param {string} locale The locale used, if any.
 * @returns The last sync date, or null if not found.
 */
module.exports = function getLastSyncDate(jobID, locale) {
  var lastSyncDates = getCustomPreference(sitePreferences.constructorLastSyncDates);

  if (!lastSyncDates) {
    return null;
  }

  var jsonObject = JSON.parse(lastSyncDates);
  var key = buildLastSyncDateKey(jobID, locale);
  var value = jsonObject[key];

  return value
    ? new Date(value)
    : null;
};
