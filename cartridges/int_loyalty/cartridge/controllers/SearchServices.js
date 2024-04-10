'use strict';

var server = require('server');

const cache = require('*/cartridge/scripts/middleware/cache');
const Resource = require('dw/web/Resource');
const ObjectsHelper = require('*/cartridge/scripts/helpers/ObjectsHelper');
// Unfortunately, by default, max suggestions is set to 10 and is not configurable in Business Manager.
// Also, you can set your custom values in 'getSuggestionsOptions' method.
const maxSuggestions = 10;

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
    const SuggestModel = require('dw/suggest/SuggestModel');
    let suggestionItems = {};
    const suggestions = new SuggestModel();

    suggestions.setSearchPhrase(searchTerms);
    suggestions.setMaxSuggestions(maxSuggestions);

    const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
    const hideLoyaltyItems = loyaltyHelper.isLoyaltyEnabled() && !loyaltyHelper.isLoyalCustomer();

    if (hideLoyaltyItems) {
        suggestions.addRefinementValues('isLoyaltyExclusive', false);
    }

    const suggestionsOptions = getSuggestionsOptions(suggestions);

    const options = ObjectsHelper.assign(
        suggestionsOptions.options.all,
        suggestionsOptions.options[isMobilePortraitView === 'true' ? 'mobile' : 'desktop']
    );

    Object.keys(options).forEach(function (key) {
        let option = options[key];
        let suggestion = new suggestionsOptions.models[option.model](option.container, option.max);
        if (suggestion.available) {
            suggestion.title = option.title;
            suggestionItems[key] = suggestion;
        }
    });

    return suggestionItems;
};

server.extend(module.superModule);

server.replace('GetSuggestions', cache.applyPromotionSensitiveCache, function (req, res, next) {
    const searchTerms = req.querystring.q;
    // If search terms.
    if (searchTerms && searchTerms.length > 0) {
        // Get suggestions object, according to client device.
        const suggestions = getSuggestions(req.querystring.q, req.querystring.isMobilePortraitView);
        const productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
        const enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
        const showPLPImageSlider = productHelper.enablePLPImageSlider();
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
