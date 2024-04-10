'use strict';

var Site = require('dw/system/Site');
var config = require('int_constructor_custom_legacy/cartridge/scripts/helpers/config');

/**
 * The cartridge version.
 * Will be used to ensure compatibility with the API.
 */
var cartridgeVersion = '3.0.0';

/**
 * The configuration keys used by the cartridge.
 */
var configKeys = {
  /**
   * Object to store last sync dates (without filters) in JSON format. Updates automatically. Used for delta feeds.
   */
  CONSTRUCTOR_LAST_SYNC_DATES: 'Constructor_LastSyncDates',

  /**
   * The API token for Constructor.io.
   */
  CONSTRUCTOR_API_TOKEN: 'Constructor_ApiToken',

  /**
   * The API key for Constructor.io.
   */
  CONSTRUCTOR_API_KEY: 'Constructor_ApiKey',

  /**
   * The product ingestion strategy to use when sending data to Constructor.
   */
  CONSTRUCTOR_PRODUCT_INGESTION_STRATEGY: 'Constructor_ProductIngestionStrategy',

  /**
   * The category ingestion strategy to use when sending data to Constructor.
   */
  CONSTRUCTOR_CATEGORY_INGESTION_STRATEGY: 'Constructor_CategoryIngestionStrategy',

  /**
   * The inventory ingestion strategy to use when sending data to Constructor.
   */
  CONSTRUCTOR_INVENTORY_INGESTION_STRATEGY: 'Constructor_InventoryIngestionStrategy'
};

/**
 * Gets the configuration value for the given key.
 * @param key The config identifier.
 * @returns The config value, or null.
 */
function getConfig(key) {
  var currentSite = Site.getCurrent();
  return currentSite.getCustomPreferenceValue(key);
}

/**
 * Builds the object key to store a given last sync date by job and locale.
 * @param {*} jobID The job ID.
 * @param {*} locale The locale used, if any.
 * @returns The key to use to store the last sync date.
 */
function buildLastSyncDateKey(jobID, locale) {
  var key = jobID + '_locale:';

  if (locale) {
    key += locale;
  } else {
    var currentSite = Site.getCurrent();
    key += currentSite.defaultLocale;
  }

  return key;
}

/**
 * Fetches the last sync date for the given job and locale.
 * @param {string} jobID The job ID.
 * @param {string} locale The locale used, if any.
 * @returns The last sync date, or null if not found.
 */
function getLastSyncDate(jobID, locale) {
  var lastSyncDates = getConfig(configKeys.CONSTRUCTOR_LAST_SYNC_DATES);

  if (!lastSyncDates) {
    return null;
  }

  var jsonObject = JSON.parse(lastSyncDates);
  var key = buildLastSyncDateKey(jobID, locale);
  var value = jsonObject[key];

  return value
    ? new Date(value)
    : null;
}

/**
 * Updates the last sync date for the given job and locale.
 * @param {Date} startedAt The date the job started at.
 * @param {string} jobID The job ID.
 * @param {string} locale The locale used, if any.
 */
function updateLastSyncDate(startedAt, jobID, locale) {
  var lastSyncDates = getConfig(configKeys.CONSTRUCTOR_LAST_SYNC_DATES);
  var sitePreferences = dw.system.Site.getCurrent().getPreferences();

  var jsonObject = lastSyncDates
    ? JSON.parse(lastSyncDates)
    : {};

  var key = buildLastSyncDateKey(jobID, locale);
  jsonObject[key] = startedAt.toISOString();

  sitePreferences.getCustom()[configKeys.CONSTRUCTOR_LAST_SYNC_DATES] = JSON.stringify(
    jsonObject,
    null,
    2
  );

  return true;
}

/**
 * Returns the credentials to Constructor.io if set, or null.
 * @param {string} apiKeyOverride The API key to use instead of the one in the config.
 * @returns The credentials object, or null if invalid.
 */
function getCredentialsOrNull(apiKeyOverride) {
  var apiToken = getConfig(configKeys.CONSTRUCTOR_API_TOKEN);
  var apiKey;

  if (!apiKeyOverride) {
    apiKey = require('app_ua_core/cartridge/scripts/helpers/constructorIOHelper').getApiKeyForLocale(request.locale);
  } else {
    apiKey = apiKeyOverride;
  }

  if (!apiToken || !apiKey) {
    return null;
  }

  return {
    apiToken: apiToken,
    apiKey: apiKey
  };
}

module.exports = {
  getCredentialsOrNull: getCredentialsOrNull,
  updateLastSyncDate: updateLastSyncDate,
  getLastSyncDate: getLastSyncDate,
  cartridgeVersion: cartridgeVersion,
  configKeys: configKeys,
  getConfig: getConfig
};
