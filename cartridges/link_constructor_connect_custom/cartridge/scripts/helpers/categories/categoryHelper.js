var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

/**
 * Removes unneeded text from URL.
 *
 * @param {string} url The url.
 * @returns {string} The scrubbed url.
 */
function cleanUrl(url) {
  if (!empty(url)) {
    if (url.indexOf('://') >= 0) {
      var protocolSplit = url.split('://');
      var domainSplit = protocolSplit[1].split('/');
      var host = 'https://' + domainSplit[0];
      url = url.replace(host, '');
    }

    url = url.replace(/&amp;/g, '&');

    var sitePattern = '/s/' + Site.current.getID();
    var localePattern = '/' + request.locale.toLowerCase().replace('_', '-');

    url = url.replace(sitePattern, '').replace(localePattern, '');
  }

  return url;
}

/**
* Returns the same category URL as UACAPI.
*
* @param {dw.catalog.Category} category The category.
* @returns {string} The category url.
*/
function getCategoryUrl(category) {
  if (!empty(category)) {
    var url = URLUtils.url('Search-Show', 'cgid', category.ID).toString();
    return cleanUrl(url);
  }

  return '';
}

/**
 * Returns the alternate category URL.
 *
 * @param {dw.catalog.Category} category The category.
 * @returns {string} The category url.
 */
function getCategoryAltUrl(category) {
  var url = !empty(category.custom.alternativeUrl) ? category.custom.alternativeUrl.toString() : URLUtils.url('Search-Show', 'cgid', category.ID).toString();
  return cleanUrl(url);
}

/**
 * Returns the parent category ID.
 *
 * @param {dw.catalog.Category} category The category.
 * @returns {string} The parent category ID.
 */
function getCategoryParentID(category) {
  return (!empty(category) && !empty(category.parent)) ? category.parent.ID : '';
}

/**
 * Returns the parent category name.
 *
 * @param {dw.catalog.Category} category The category.
 * @returns {string} The parent category name.
 */
function getCategoryParentName(category) {
  return (!empty(category) && !empty(category.parent)) ? category.parent.displayName : '';
}

/**
 * Returns the list of parent categories(including the passed category) with data.
 *
 * @param {dw.catalog.Category} category The category.
 * @param {Array} categories The list of categories.
 * @param {'asc' | 'desc'} sortOrder The sort order for the list of categories.
 * @param {boolean} excludeRoot Whether or not to exclude the root category.
 * @param {boolean} includeSelf Whether or not to include the passed category.
 * @returns {Array|string} The list of parent categories.
 */
function getParentCategories(category, categories, sortOrder, excludeRoot, includeSelf) {
  sortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
  categories = Array.isArray(categories) ? categories : [];

  if (!empty(category)) {
    var shouldIncludeCategory = (!excludeRoot || (excludeRoot && category.ID !== 'root')) && includeSelf;

    if (shouldIncludeCategory) {
      categories.push({
        id: category.ID,
        name: category.displayName,
        url: getCategoryUrl(category),
        altUrl: getCategoryAltUrl(category),
        hideFromBreadCrumbs: category.custom.hideFromBreadCrumbs
      });
    }

    if (category.parent) {
      getParentCategories(category.parent, categories, sortOrder, excludeRoot, true);
    }
  }

  if (sortOrder === 'desc' && categories.length > 1) {
    categories = categories.reverse();
  }

  return categories.length > 0 ? categories : '';
}

module.exports = {
  getCategoryUrl: getCategoryUrl,
  getCategoryAltUrl: getCategoryAltUrl,
  getCategoryParentID: getCategoryParentID,
  getCategoryParentName: getCategoryParentName,
  getParentCategories: getParentCategories
};
