var Site = require('dw/system/Site');

/**
 * Determines if a product is an e-gift card.
 * @param {dw.catalog.Product} product The product.
 * @returns {boolean} true if product is an e-gift card. false if not.
 */
function isEGiftCard(product) {
  return 'giftCard' in product.custom && !empty(product.custom.giftCard) && product.custom.giftCard.value === 'EGIFT_CARD';
}

/**
 * Returns the lowest price for a product in the specified price book.
 * @param {dw.catalog.Product} product The product.
 * @param {string} priceBookID price book id.
 * @returns {number|null} The price.
 */
function getMinPrice(product, priceBookID) {
  // Return set minimum if product is an e-gift card
  if (isEGiftCard(product)) {
    return Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMin');
  }

  var priceModel = product.priceModel;
  var price = priceModel.getMinPriceBookPrice(priceBookID).value;
  if (empty(price)) {
    price = priceModel.getPrice().value;
  }

  return price;
}

/**
 * Returns the highest price for a product in the specified price book.
 * @param {dw.catalog.Product} product The product.
 * @param {string} priceBookID price book id.
 * @returns {number|null} The price.
 */
function getMaxPrice(product, priceBookID) {
  // Return set maximum if product is an e-gift card
  if (isEGiftCard(product)) {
    return Site.getCurrent().getCustomPreferenceValue('eGiftCardAmountMax');
  }

  var priceModel = product.priceModel;
  var price = priceModel.getMaxPriceBookPrice(priceBookID).value;
  if (empty(price)) {
    price = priceModel.getPrice().value;
  }

  return price;
}

module.exports = {
  isEGiftCard: isEGiftCard,
  getMinPrice: getMinPrice,
  getMaxPrice: getMaxPrice
};
