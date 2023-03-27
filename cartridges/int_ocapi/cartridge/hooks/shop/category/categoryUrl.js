const Status = require('dw/system/Status');
const URLUtils = require('dw/web/URLUtils');
const Site = require('dw/system/Site');

/**
 * Get category url
 * @param {Object} category - Current category
 * @returns {string} - Url of the category
 *
 * @param {dw.catalog.Category} - category to be checked if it loyalty
**/
function getCategoryUrl(category) {
    const searchUrl = URLUtils.url('Search-Show', 'cgid', category.id).toString();
    // Convert searchUrl to expected format, e.g. /s/US/c/shoes/ -> /c/shoes/
    const siteId = Site.getCurrent().getID();
    const sitePattern = '/s/' + siteId;
    // eslint-disable-next-line no-undef
    const localePattern = '/' + request.getLocale().toLowerCase().replace('_', '-');
    return searchUrl.replace(sitePattern, '').replace(localePattern, '');
}

/**
 * @param {Object} categories Array of categories from OCAPI response object.
 */
function transformCategories(categories) {
    for (let i = 0; i < categories.length; i++) {
        let category = categories[i];
        category.c_url = getCategoryUrl(category);
        if (category.categories && category.categories.length) {
            transformCategories(category.categories);
        }
    }
}

/**
* @param {dw.catalog.Category} categoryInstance an instance of dw.catalog.Category.
* @param {Object} category OCAPI response object.
* @returns {Status} - Status
*/
exports.modifyGETResponse = function (categoryInstance, category) {
    if (category && category.id !== 'root') {
        // eslint-disable-next-line no-param-reassign
        category.c_url = getCategoryUrl(category);
        // eslint-disable-next-line no-param-reassign
        category.c_renderingTemplate = categoryInstance.getTemplate();
    }
    if (category && category.categories && category.categories.length) {
        transformCategories(category.categories);
    }
    return new Status(Status.OK);
};
