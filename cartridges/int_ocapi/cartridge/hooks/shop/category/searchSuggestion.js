/**
 * searchSuggestion.js
 *
 * Handles OCAPI hooks for category calls
 */
var Status = require('dw/system/Status');
var CatalogMgr = require('dw/catalog/CatalogMgr');

/**
* @param {Object} suggestionResponse OCAPI response object.
* @returns {Status} - Status
*/
exports.modifyGETResponse = function (suggestionResponse) {
    if (suggestionResponse.category_suggestions && suggestionResponse.category_suggestions.categories) {
        Object.keys(suggestionResponse.category_suggestions.categories).forEach(function (key) {
            var categorySuggestion = suggestionResponse.category_suggestions.categories[key];
            if (categorySuggestion && categorySuggestion.id) {
                var category = CatalogMgr.getCategory(categorySuggestion.id);
                categorySuggestion.c_categorySearchDisplayName = category && 'categorySearchDisplayName' in category.custom && category.custom.categorySearchDisplayName ? category.custom.categorySearchDisplayName : '';
            }
        });
    }
    return new Status(Status.OK);
};
