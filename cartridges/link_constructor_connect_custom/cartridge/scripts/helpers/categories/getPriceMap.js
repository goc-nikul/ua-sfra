var getSearchRefinements = require('*/cartridge/scripts/helpers/categories/getSearchRefinements');

/**
 * Gets the price buckets for the passed category
 *
 * @param {dw.catalog.Category} category The category to populate the price buckets from.
 * @returns {Array} The price map.
 */
module.exports = function getPriceMap(category) {
  var map = [];

  if (!empty(category) && 'ID' in category && !empty(category.ID)) {
    var searchRefinements = getSearchRefinements(category, 'category', true);
    if (!empty(searchRefinements) && 'priceRefinementDefinition' in searchRefinements && !empty(searchRefinements.priceRefinementDefinition)) {
      var priceValues = searchRefinements.getAllRefinementValues(searchRefinements.priceRefinementDefinition).toArray();
      priceValues.forEach(function (priceValue) {
        map.push({
          displayName: priceValue.displayValue,
          valueFrom: priceValue.valueFrom,
          valueTo: priceValue.valueTo
        });
      });
    }
  }

  return map;
};
