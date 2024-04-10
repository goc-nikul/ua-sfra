var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var CacheMgr = require('dw/system/CacheMgr');
var Site = require('dw/system/Site');

/**
 * Retrieves the ID of a price book based on the given type.
 *
 * @param {array} pricebookIds - The array of price book IDs to filter through.
 * @param {string} type - The type to search for within the price book IDs.
 * @return {string|null} The ID of the price book matching the type, or null if not found.
 */
function getPricebookIdByType(pricebookIds, type) {
  var filteredIds = pricebookIds.filter(function (id) {
    return id.indexOf(type) !== -1;
  });

  if (filteredIds.length > 0) {
    var pricebook = PriceBookMgr.getPriceBook(filteredIds[0]);
    return pricebook ? pricebook.getID() : null;
  }

  return null;
}

/**
 * Retrieves pricebook IDs based on the provided locale.
 *
 * @param {string} locale - The locale for which to retrieve pricebook IDs
 * @return {Array} An array of pricebook IDs corresponding to the provided locale
 */
function getPricebookIdsFromPref(locale) {
  var customPreferenceHelper = require('*/cartridge/scripts/helpers/config/customPreferenceHelper');
  var countriesJSON = customPreferenceHelper.getJsonValue('countriesJSON');
  var pricebookIds = [];

  Object.keys(countriesJSON || {}).forEach(function (key) {
    var country = countriesJSON[key];
    if (country.locales && country.locales.indexOf(locale) !== -1) {
      pricebookIds = country.priceBooks || [];
    }
  });

  return pricebookIds;
}

/**
 * Retrieves the ID of a price book based on the provided currency code and type.
 *
 * @param {string} currencyCode - The currency code used to identify the price book.
 * @param {string} type - The type of the price book.
 * @return {string|null} The ID of the price book, or null if the price book is not found.
 */
function getDirectPricebookID(currencyCode, type) {
  var pricebook = PriceBookMgr.getPriceBook(currencyCode + '-' + type);
  return pricebook ? pricebook.getID() : null;
}

/**
 * Gets and returns the IDs of 'list' and 'sale' pricebooks for the current locale and currency,
 * utilizing caching to enhance performance.
 *
 * @returns {Object} An object containing the 'list' and 'sale' pricebook IDs.
 */
module.exports = function getPricebookIDs() {
  var locale = request.locale;
  var currencyCode = Site.getCurrent().getDefaultCurrency();
  var cacheKey = 'pricebookIDs_' + locale;
  var cache = CacheMgr.getCache('ConstructorProductFeedData');
  var cachedResult = cache.get(cacheKey);

  // Check if the result is already cached
  if (cachedResult) {
    return JSON.parse(cachedResult);
  }

  // Fetch pricebook IDs from preferences if not directly available
  var pricebookIdsFromPref = getPricebookIdsFromPref(locale);
  var listPricebookID = getPricebookIdByType(pricebookIdsFromPref, 'list');
  var salePricebookID = getPricebookIdByType(pricebookIdsFromPref, 'sale');

  // Fallback to direct pricebook ID retrieval if necessary
  listPricebookID = listPricebookID || getDirectPricebookID(currencyCode, 'list');
  salePricebookID = salePricebookID || getDirectPricebookID(currencyCode, 'sale');

  var result = {
    list: listPricebookID,
    sale: salePricebookID
  };

  cache.put(cacheKey, JSON.stringify(result));

  return result;
};
