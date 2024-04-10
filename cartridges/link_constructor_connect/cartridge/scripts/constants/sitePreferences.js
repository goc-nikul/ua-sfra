/**
 * Defines available site preferences that can be used by the cartridge.
 */
module.exports = {
  /**
   * Object to store last sync dates (without filters) in JSON format.
   * Updates automatically - do not modify.
   * Used for partial feeds.
   */
  constructorLastSyncDates: 'Constructor_LastSyncDates',

  /**
   * The API token for Constructor.io.
   */
  constructorApiToken: 'Constructor_ApiToken',

  /**
   * The API key for Constructor.io.
   */
  constructorApiKey: 'Constructor_ApiKey'
};
