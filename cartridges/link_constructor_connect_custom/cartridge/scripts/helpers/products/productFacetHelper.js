var getPriceMap = require('*/cartridge/scripts/helpers/categories/getPriceMap');

/**
 * Returns the primary category id for the specified product.
 * @param {dw.catalog.Product} product The product.
 * @returns {string} the category id.
 */
function getCategoryID(product) {
  var category = product.getPrimaryCategory();
  return !empty(category) ? category.ID : '';
}

/**
 * Returns the list of product icons
 *
 * @param {*} product The product.
 * @returns {Object} the list of product icons
 */
function getIcons(product) {
  if (!empty(product) && !empty(product.custom)) {
    var icons = product.custom.icons;

    // copy display values to a separate array and return them
    return !empty(icons) && icons.length ? icons.map(obj => (obj.displayValue)) : null;
  }

  return null;
}

/**
 * Returns the first color in the colorway string
 *
 * @param {string} colorway The product colorway.
 * @returns {string} The first color in the colorway string.
 */
function getColorwayPrimary(colorway) {
  if (!empty(colorway) && colorway.indexOf(' / ') > 0) {
    return colorway.split(' / ')[0];
  }

  return colorway;
}

/**
 * Returns price refinement value.
 * @param {*} price The price.
 * @param {Object} product The product.
 * @returns {string} The refinement.
 */
function getPriceRefinement(price, product) {
  if (!price || price === '' || !product || product === '') {
    return '';
  }

  var entry;
  var primaryCat = product.master ? product.primaryCategory : product.masterProduct.primaryCategory;

  // get price buckets
  var map = getPriceMap(primaryCat);

  // find bucket for the passed price
  entry = map.find(item => (price >= item.valueFrom && price < item.valueTo));

  return !empty(entry) && 'displayName' in entry ? entry.displayName : '';
}

/**
 * Returns customer group pricing for the specified product and promos.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.util.Collection} productPromotions The promos for this product.
 * @param {boolean} changeKeys Use fancy keys in the return pricing object.
 * @returns {Array} The customer group pricing.
 */
function getCustomerGroupPricing(product, productPromotions, changeKeys) {
  var pricing = [];

  if (!empty(productPromotions) && productPromotions.length) {
    var promos = productPromotions.toArray();

    // get promotion pricing for the passed product
    promos.forEach(function (promo) { // eslint-disable-line array-callback-return
      // only use promos not based on coupons
      if (!promo.basedOnCoupons) {
        var promoPrice = promo.getPromotionalPrice(product);
        // verify the promo is applicable
        if (!empty(promoPrice) && promoPrice.isAvailable() && !empty(promo.customerGroups) && promo.customerGroups.length) {
          // get customer groups on promo
          var groups = promo.customerGroups.toArray();

          // save promo customer groups and price
          groups.forEach(function (group) { // eslint-disable-line array-callback-return
            var groupId = changeKeys ? 'Price ' + group.ID : group.ID;

              // add customer group and price to the list if they are not in the list already
            if (pricing.findIndex(item => (item.key === groupId && item.value === promoPrice.value)) < 0) {
              pricing.push({ key: groupId, value: promoPrice.value });
            }
          });
        }
      }
    });
  }

  return pricing;
}

module.exports = {
  getIcons: getIcons,
  getCategoryID: getCategoryID,
  getPriceRefinement: getPriceRefinement,
  getColorwayPrimary: getColorwayPrimary,
  getCustomerGroupPricing: getCustomerGroupPricing
};
