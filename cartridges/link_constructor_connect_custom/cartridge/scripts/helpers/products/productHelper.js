var priceHelper = require('*/cartridge/scripts/helpers/products/priceHelper');

var Site = require('dw/system/Site');

/**
 * Checks if the product should be searchable even if unavailable based on a custom flag.
 * @param {*} product The product to check.
 * @returns {boolean} True if the product should be online and searchable even if unavailable; otherwise, false.
 */
function isSearchableIfUnavailable(product) {
  return product && product.searchableIfUnavailableFlag;
}

/**
 * @param {*} product The product.
 * @returns {boolean} Whether the product should be added or not.
 */
function shouldAddOOSProduct(product) {
  // Bypass conditions if searchableIfUnavailableFlag is true
  if (isSearchableIfUnavailable(product)) {
    return true;
  }

  // Do not add products with no inventory that do not have release date populated
  if (!product.availabilityModel.inStock) {
    var releaseDate = 'releaseDate' in product.custom && !empty(product.custom.releaseDate) ? product.custom.releaseDate : null;
    var now = new Date();

    if (empty(releaseDate) || releaseDate <= now) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a product has a valid price greater than 0. If the product is an e-gift card, it checks against
 * the minimum e-gift card amount. For other products, it verifies the standard price is greater than 0.
 *
 * @param {dw.catalog.Product} product The product to check the price for.
 * @param {string} listPriceBookID list pricebook id.
 * @param {string} salePriceBookID sale pricebook id.
 * @returns {boolean} true if the product has a valid price greater than 0, false otherwise.
 */
function hasValidPrice(product, listPriceBookID, salePriceBookID) {
  // Return set minimum if product is an e-gift card
  if (priceHelper.isEGiftCard(product)) {
    return Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin') > 0;
  }

  var listPrice = product.priceModel.getPriceBookPrice(listPriceBookID).value;
  var salePrice = product.priceModel.getPriceBookPrice(salePriceBookID).value;

  return !empty(listPrice) && listPrice > 0 && !empty(salePrice) && salePrice > 0;
}

module.exports = {
  isSearchableIfUnavailable: isSearchableIfUnavailable,
  shouldAddOOSProduct: shouldAddOOSProduct,
  hasValidPrice: hasValidPrice
};
