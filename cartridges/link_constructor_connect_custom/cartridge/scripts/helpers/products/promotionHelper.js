var getCustomPreference = require('*/cartridge/scripts/helpers/config/getCustomPreference');
var sitePreferences = require('*/cartridge/scripts/constants/sitePreferences');

/**
 * Check if promo pricing is enabled.
 *
 * @return {boolean} Whether promo pricing is enabled
 */
function promoPricingEnabled() {
  return getCustomPreference(sitePreferences.CUSTOM_PROMO_PRICING_ENABLED) || false;
}

module.exports = {
  promoPricingEnabled: promoPricingEnabled
};
