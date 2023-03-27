'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/models/categories', function() {
    let Category = require('../../mocks/dw/dw_catalog_Category');
    let Collection = require('../../mocks/dw/dw_util_Collection');

    let categorySuggestion = proxyquire('../../../cartridges/app_ua_core/cartridge/models/search/suggestions/category', {
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils')
    });

    it('Testing method: CategorySuggestions', () => {
        let suggestionModel = {};
        let category = new Category();

        category.parent = new Category();
        let suggestions = new Collection({
            category: category
        });
        suggestions.hasSuggestions = function() {
            return true;
        }
        suggestions.suggestedCategories = suggestions.iterator();
        suggestionModel.categorySuggestions = suggestions;

        suggestionModel

        let result = new categorySuggestion(suggestionModel, 3);

        assert.equal('testDisplayName', result.categories[0].name, 'category suggestions generated');
    });    it('Testing method: CategorySuggestions', () => {
        let suggestionModel = {};
        let category = new Category();

        category.image = {url: 'URL Test'};
        category.custom.categorySearchDisplayName = 'categorySearchDisplayName';

        category.parent = new Category();
        let suggestions = new Collection({
            category: category
        });
        suggestions.hasSuggestions = function() {
            return true;
        }
        suggestions.suggestedCategories = suggestions.iterator();
        suggestionModel.categorySuggestions = suggestions;

        suggestionModel

        let result = new categorySuggestion(suggestionModel, 3);

        assert.equal('testDisplayName', result.categories[0].name, 'category suggestions generated');
    });

    it('Testing method: CategorySuggestions', () => {
        let result = new categorySuggestion({categorySuggestions: false}, 0);

        assert.equal(result.available, false, 'category suggestions available is false');
        assert.equal(result.categories.length, 0, 'categories length is zero');
    });

});
