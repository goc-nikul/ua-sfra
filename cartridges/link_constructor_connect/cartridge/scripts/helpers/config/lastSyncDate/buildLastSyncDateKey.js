var Site = require('dw/system/Site');

/**
 * Builds the object key to store a given last sync date by job and locale.
 * @param {string} jobID The job ID.
 * @param {string | null} locale The locale used, if any.
 * @returns The key to use to store the last sync date.
 */
module.exports = function buildLastSyncDateKey(jobID, locale) {
  var key = jobID + '_locale:';

  if (locale) {
    key += locale;
  } else {
    var currentSite = Site.getCurrent();
    key += currentSite.defaultLocale;
  }

  return key;
};
