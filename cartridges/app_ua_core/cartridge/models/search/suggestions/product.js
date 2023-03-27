'use strict';

var URLUtils = require('dw/web/URLUtils');
var ACTION_ENDPOINT = 'Product-Show';

var ProductHelper = require('~/cartridge/scripts/helpers/ProductHelper');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');
var decorators = require('~/cartridge/models/product/decorators/index');

/**
 * Compile a list of relevant suggested products
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedProduct>} suggestedProducts - Iterator to retrieve
 *                                                                             SuggestedProducts
*  @param {number} maxItems - Maximum number of products to retrieve
 * @return {Object[]} - Array of suggested products
 */
function getProducts(suggestedProducts, maxItems) {
    var product = null;
    var productSearchHit = null;
    var products = [];

    while (suggestedProducts.hasNext() && products.length < maxItems) {
        productSearchHit = suggestedProducts.next().productSearchHit;
        product = productSearchHit.product;

        // istanbul ignore else
        if (product) {
            var suggestedProduct = {
                id: product.ID,
                productName: product.name,
                productType: ProductHelper.getProductType(product),
                url: URLUtils.url(ACTION_ENDPOINT, 'pid', product.ID)
            };

            decorators.searchPrice(suggestedProduct, productSearchHit, promotionCache.promotions, ProductHelper.getProductSearchHit);
            decorators.tileImages(suggestedProduct, product, productSearchHit, null);
            decorators.badges(suggestedProduct, product);
            decorators.customAttributes(suggestedProduct, product);
            products.push(suggestedProduct);
        }
    }

    return products;
}

/**
 * Compile a list of relevant suggested phrases
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve
 *                                                                           SuggestedPhrases
 * @param {number} maxItems - Maximum number of phrases to retrieve
 * @return {SuggestedPhrase[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases, maxItems) {
    var phrase = null;
    var phrases = [];

    while (suggestedPhrases.hasNext() && phrases.length < maxItems) {
        phrase = suggestedPhrases.next();
        phrases.push({
            exactMatch: phrase.exactMatch,
            value: phrase.phrase
        });
    }

    return phrases;
}

/**
 * @constructor
 * @classdesc ProductSuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of items to retrieve
 */
function ProductSuggestions(suggestions, maxItems) {
    var productSuggestions = suggestions.productSuggestions;

    if (!productSuggestions) {
        this.available = false;
        this.phrases = [];
        this.products = [];
        return;
    }

    var searchPhrasesSuggestions = productSuggestions.searchPhraseSuggestions;

    this.available = productSuggestions.hasSuggestions();
    this.phrases = getPhrases(searchPhrasesSuggestions.suggestedPhrases, maxItems);
    this.products = getProducts(productSuggestions.suggestedProducts, maxItems);
}

module.exports = ProductSuggestions;
