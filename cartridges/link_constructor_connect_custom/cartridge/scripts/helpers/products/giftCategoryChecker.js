/**
 * Returns whether or not a product is assigned to a category that matches specific naming conventions for gifts.
 *
 * @param {*} product The product.
 * @returns {boolean} Whether or not a product is assigned to a category that matches gifts naming conventions.
 */
module.exports = function inGiftsCategoryByNaming(product) {
  if (product.isVariant()) {
    product = product.getMasterProduct();
  }

  var names = [
    'gifts by price',
    'cadeaux par prix'
  ];

  if (!empty(product.onlineCategories) && product.onlineCategories.length) {
    var productCategories = product.onlineCategories.toArray();

    return productCategories.some(function (category) {
      var categoryName = category.displayName.toLowerCase();
      return names.indexOf(categoryName) !== -1;
    });
  }

  return false;
};
