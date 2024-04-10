var buildLastSyncDateKey = require('*/cartridge/scripts/helpers/config/lastSyncDate/buildLastSyncDateKey');
var getCustomPreference = require('*/cartridge/scripts/helpers/config/getCustomPreference');
var sitePreferences = require('*/cartridge/scripts/constants/sitePreferences');
var logger = require('*/cartridge/scripts/helpers/logger');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

/**
 * Updates the last sync date for the given job and locale.
 *
 * @param {{
 *  locale: string | undefined,
 *  jobID: string,
 *  value: Date,
 * }} args The function arguments.
 */
module.exports = function updateLastSyncDate(args) {
  var lastSyncDates = getCustomPreference(sitePreferences.constructorLastSyncDates);

  var lastSyncDatesJson = lastSyncDates
    ? JSON.parse(lastSyncDates)
    : {};

  var key = buildLastSyncDateKey(args.jobID, args.locale);
  lastSyncDatesJson[key] = args.value.toISOString();

  var newValue = JSON.stringify(lastSyncDatesJson, null, 2);

  /**
   * Wrap the logic into a new transaction, so that we can write to the database.
   */
  Transaction.wrap(function () {
    var allSitePreferences = Site.getCurrent().getPreferences();
    allSitePreferences.getCustom()[sitePreferences.constructorLastSyncDates] = newValue;
  });

  logger.log(
    [
      'Updated last sync date for locale',
      args.locale || 'default',
      'to',
      args.value
    ].join(' ')
  );

  return true;
};
