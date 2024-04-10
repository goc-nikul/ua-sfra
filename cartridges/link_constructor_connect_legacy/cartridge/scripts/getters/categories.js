/**
 * Pushes a category to the array if it's not already in it.
 * @param {*} categories The categories array.
 * @param {*} category The category to push.
 */
function pushCategoryIfNotPresent(categories, category) {
  var index = 0;
  var currentCategory = null;

  for (index = 0; index < categories.length; index += 1) {
    currentCategory = categories[index];

    if (currentCategory.ID === category.ID) {
      return;
    }
  }

  categories.push(category);
}

/**
 * Deeply maps categories, including subcategories for any nested level.
 * @param {*} currentIterator The current categories iterator.
 * @param {*} categories The current categories array.
 * @returns The categories array.
 */
function deepMapCategories(currentIterator, categories) {
  var subCategoriesIterator = null;
  var nestedCategories = [];
  var iteratorItem = null;

  if (!currentIterator.hasOnlineSubCategories()) {
    return categories;
  }

  subCategoriesIterator = currentIterator.getOnlineSubCategories().iterator();

  while (subCategoriesIterator.hasNext()) {
    iteratorItem = subCategoriesIterator.next();
    pushCategoryIfNotPresent(categories, iteratorItem);

    nestedCategories = deepMapCategories(iteratorItem, []);

    nestedCategories.forEach(function match(nestedCategory) {
      pushCategoryIfNotPresent(categories, nestedCategory);
    });
  }

  return categories;
}

/**
 * Gets all categories, including subcategories for any nested level.
 * Returns an array of categories.
 *
 * IMPORTANT: You can customize the way categories are fetched on this file, but keep in mind
 * that you'll need to return an array of categories so that the rest of the integration can work.
 *
 * @see https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges/b2c-cartridges-customize
 * @returns {Array} The categories array.
 */
function getAllCategories() {
  var CatalogMgr = require('dw/catalog/CatalogMgr');
  var siteCatalog = CatalogMgr.getSiteCatalog();
  var siteRootCategory = siteCatalog.getRoot();

  var result = [];

  pushCategoryIfNotPresent(result, siteRootCategory);
  deepMapCategories(siteRootCategory, result);

  return result;
}

module.exports.getAllCategories = getAllCategories;
