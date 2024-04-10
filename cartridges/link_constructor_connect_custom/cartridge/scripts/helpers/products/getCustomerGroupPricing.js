/**
 * Returns customer group pricing for the specified product and promos.
 * @param {dw.catalog.Product} product The product.
 * @param {dw.util.Collection} productPromotions The promos for this product.
 * @param {boolean} changeKeys Use fancy keys in the return pricing object.
 * @returns {Array} The customer group pricing.
 */
module.exports = function getCustomerGroupPricing(product, productPromotions, changeKeys) {
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
};
