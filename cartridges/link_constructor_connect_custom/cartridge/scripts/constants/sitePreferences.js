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
  constructorApiKey: 'Constructor_ApiKey',

  /**
   * Attribute Ids with search refinement definitions.
   */
  CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_IDS_TO_SEND: 'Constructor_BucketedAttributeIdsToSend',

  /**
   * Enable/disable the capture and sending of promotional pricing.
   */
  CUSTOM_PROMO_PRICING_ENABLED: 'Constructor_PromoPricingEnabled',

  /**
   * Search refinement definition display names.
   */
  CUSTOM_CONSTRUCTOR_BUCKETED_ATTRIBUTE_DISPLAY_NAMES_TO_SEND: 'Constructor_BucketedAttributeDisplayNamesToSend'
};
