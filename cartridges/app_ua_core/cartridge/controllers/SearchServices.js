'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var Resource = require('dw/web/Resource');
var ObjectsHelper = require('~/cartridge/scripts/helpers/ObjectsHelper');
// Unfortunately, by default, max suggestions is set to 10 and is not configurable in Business Manager.
// Also, you can set your custom values in 'getSuggestionsOptions' method.
var maxSuggestions = 10;

/**
 * get suggestions options according to devices.
 * @param {Object} suggestions SuggestModel instance.
 * @returns {Object} Configurations object.
 */
var getSuggestionsOptions = function (suggestions) {
    return {
        models: {
            category: require('*/cartridge/models/search/suggestions/category'),
            product: require('*/cartridge/models/search/suggestions/product'),
            search: require('*/cartridge/models/search/suggestions/searchPhrase')
        },
        options: {
            all: {
                // Suggested categories.
                category: {
                    model: 'category',
                    container: suggestions,
                    title: Resource.msgf('label.header.search.modal.suggestions.category', 'search', null),
                    max: 7
                },
                // Recent searches.
                recent: {
                    model: 'search',
                    container: suggestions.recentSearchPhrases,
                    title: Resource.msgf('label.header.search.modal.suggestions.recent', 'search', null),
                    max: 3
                }
            },
            mobile: {
                // Top product.
                product: {
                    model: 'product',
                    container: suggestions,
                    title: Resource.msgf('label.header.search.modal.suggestions.product.mobile', 'search', null),
                    max: 1
                }
            },
            desktop: {
                // Top products.
                product: {
                    model: 'product',
                    container: suggestions,
                    title: Resource.msgf('label.header.search.modal.suggestions.product', 'search', null),
                    max: 4
                }
            }
        }
    };
};

/**
 * Get suggestions by search term.
 * @param {string} searchTerms Search term from input field.
 * @param {string} isMobilePortraitView Is client device: portrait-orientated mobile.
 * @returns {Object} Suggestions object, prepared for template.
 */
var getSuggestions = function (searchTerms, isMobilePortraitView) {
    var SuggestModel = require('dw/suggest/SuggestModel');
    var suggestionItems = {};
    var suggestions = new SuggestModel();

    suggestions.setSearchPhrase(searchTerms);
    suggestions.setMaxSuggestions(maxSuggestions);

    var suggestionsOptions = getSuggestionsOptions(suggestions);

    var options = ObjectsHelper.assign(
        suggestionsOptions.options.all,
        suggestionsOptions.options[isMobilePortraitView === 'true' ? 'mobile' : 'desktop']
    );

    Object.keys(options).forEach(function (key) {
        var option = options[key];
        var suggestion = new suggestionsOptions.models[option.model](option.container, option.max);
        if (suggestion.available) {
            suggestion.title = option.title;
            suggestionItems[key] = suggestion;
        }
    });

    return suggestionItems;
};

server.extend(module.superModule);

server.replace('GetSuggestions', cache.applyDefaultCache, function (req, res, next) {
    var searchTerms = req.querystring.q;
    // If search terms.
    if (searchTerms && searchTerms.length > 0) {
        // Get suggestions object, according to client device.
        var suggestions = getSuggestions(req.querystring.q, req.querystring.isMobilePortraitView);
        var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
        var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
        var showPLPImageSlider = productHelper.enablePLPImageSlider();
        if (Object.keys(suggestions).length > 0) {
            res.render('search/suggestions', { suggestions: suggestions, personalized: res.personalized, enableAvailablePerLocale: enableAvailablePerLocale, showPLPImageSlider: showPLPImageSlider });
        } else {
            res.json({});
        }
    } else {
        res.json({});
    }
    next();
});

module.exports = server.exports();
