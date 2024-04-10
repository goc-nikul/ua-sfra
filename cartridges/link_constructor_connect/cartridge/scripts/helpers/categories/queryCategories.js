var CatalogMgr = require('dw/catalog/CatalogMgr');

/**
 * Pushes a category to the array if it's not already in it.
 * @param {Array<dw.catalog.Category>} categories The categories array.
 * @param {Array<dw.catalog.Category>} category The category to push.
 */
function pushCategoryIfNotPresent(categories, category) {
  for (var index = 0; index < categories.length; index += 1) {
    var currentCategory = categories[index];

    if (currentCategory.ID === category.ID) {
      return;
    }
  }

  categories.push(category);
}

/**
 * Deeply maps categories, including subcategories for any nested level.
 * @param {Array<dw.catalog.Category>} categories The current categories array.
 * @param {dw.catalog.Category} currentCategory The current category.
 * @returns The categories array.
 */
function deepMapCategories(categories, currentCategory) {
  if (!currentCategory.hasOnlineSubCategories()) {
    return [];
  }

  var subCategoriesIterator = currentCategory.getOnlineSubCategories().iterator();

  while (subCategoriesIterator.hasNext()) {
    var subcategory = subCategoriesIterator.next();
    pushCategoryIfNotPresent(categories, subcategory);

    var nestedCategories = deepMapCategories([], subcategory);

    for (var index = 0; index < nestedCategories.length; index += 1) {
      pushCategoryIfNotPresent(categories, nestedCategories[index]);
    }
  }

  return categories;
}

/**
 * Gets all categories, including subcategories for any nested level.
 * Returns an array of categories.
 *
 * @returns {Array<dw.catalog.Category>} The categories array.
 */
module.exports = function queryCategories() {
  var rootCategory = CatalogMgr.getSiteCatalog().getRoot();
  var categories = [];

  pushCategoryIfNotPresent(categories, rootCategory);
  deepMapCategories(categories, rootCategory);

  return categories;
};
