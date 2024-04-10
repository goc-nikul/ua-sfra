'use strict';

var URLUtils = require('dw/web/URLUtils');
var endpoint = 'Search-Show';

/**
 * @constructor
 * @classdesc CategorySuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of categories to retrieve
 */
function CategorySuggestions(suggestions, maxItems) {
    this.categories = [];

    if (!suggestions.categorySuggestions) {
        this.available = false;
        return;
    }

    var categorySuggestions = suggestions.categorySuggestions;
    var iter = categorySuggestions.suggestedCategories;

    this.available = categorySuggestions.hasSuggestions();

    while (iter.hasNext() && this.categories.length < maxItems) {
        var category = iter.next().category;
        // istanbul ignore else
        if (category && ('showInMenu' in category.custom && category.custom.showInMenu.valueOf() && category.custom.showInMenu.valueOf().toString() === 'true')) {
            this.categories.push({
                name: category.displayName,
                imageUrl: category.image ? category.image.url : '',
                url: URLUtils.url(endpoint, 'cgid', category.ID),
                parentID: category.parent.ID,
                parentName: category.parent.displayName,
                categorySearchDisplayName: 'categorySearchDisplayName' in category.custom && category.custom.categorySearchDisplayName != null ? category.custom.categorySearchDisplayName : ''
            });
        }
    }
}

module.exports = CategorySuggestions;
