var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');
var ContentModel = require('*/cartridge/models/content');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var CacheMgr = require('dw/system/CacheMgr');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var MessageDigest = require('dw/crypto/MessageDigest');
var Money = require('dw/value/Money');

/**
 * Computes the SHA-256 hash of the given data.
 *
 * @param {string|Buffer} data - The data to be hashed.
 * @returns {string} The SHA-256 hash.
 */
function sha256(data) {
    var digest = new MessageDigest(MessageDigest.DIGEST_SHA_256);
    return digest.digest(data);
}

/**
 * Get content for "no-search-results-category-text".
 *
 * @returns {Object} - Content model instance.
 */
function getNoSearchSuggestionsResultsContent() {
    return new ContentModel(ContentMgr.getContent('no-search-results-category-text'), 'components/content/contentAssetInc');
}

/**
 * Retrieve the constructorIOSettings object from the custom cache.
 *
 * @param {string} locale - The locale to get the API key for.
 * @returns {Object|null} The constructorIOSettings object if found, or null if not.
 */
function getLocalisedConstructorIOSettingsFromCache(locale) {
    var cacheName = 'ConstructorIOSettings';
    var cacheKey = 'settings_' + locale;
    var customObjectType = 'constructorIOSettings';
    var customObjectKey = 'default';

    var cache = CacheMgr.getCache(cacheName);
    var constructorIOSettings = cache.get(cacheKey);

    if (constructorIOSettings) {
        return constructorIOSettings;
    }

    var objectDefinition = CustomObjectMgr.getCustomObject(customObjectType, customObjectKey);

    if (objectDefinition && objectDefinition.custom) {
        var localisedSettings = {
            constructorIOSortOptionsMap: objectDefinition.custom.constructorIOSortOptionsMap,
            defaultCutoffThreshold: Number(objectDefinition.custom.defaultCutoffThreshold) || 0,
            displayableRefinementCategories: objectDefinition.custom.displayableRefinementCategories,
            routeRefinements: objectDefinition.custom.routeRefinements,
            sortOptionsURLMap: objectDefinition.custom.sortOptionsURLMap,
            sizeSortRules: objectDefinition.custom.sizeSortRules,
            sizeRangeMap: objectDefinition.custom.sizeRangeMap,
            variationMap: objectDefinition.custom.variationMap
        };

        cache.put(cacheKey, localisedSettings);
        return localisedSettings;
    }

    return null;
}

/**
 * Check if a string might be a JSON object.
 *
 * @param {string} str - The string to check.
 * @returns {boolean} - True if the string might be a JSON object, false otherwise.
 */
function mightBeJSONObject(str) {
    return typeof str === 'string' && str.trim().startsWith('{') && str.trim().endsWith('}');
}

/**
 * Get the API key for ConstructorIO based on locale.
 *
 * @param {string} locale - The locale to get the API key for.
 * @returns {string|null} - The API key for the provided locale, the default API key if the locale-specific key is not found, or null.
 */
function getApiKeyForLocale(locale) {
    var apiKeyData = Site.current.getCustomPreferenceValue('Constructor_ApiKey');

    if (typeof apiKeyData !== 'string') {
        return null;
    }

    if (mightBeJSONObject(apiKeyData)) {
        var apiKeyObj = JSON.parse(apiKeyData); // Assuming the check in mightBeJSONObject is reliable
        return locale && apiKeyObj[locale] ? apiKeyObj[locale] : apiKeyObj.default;
    }

    return apiKeyData;
}

/**
 * Retrieves the customer group IDs associated with the given customer.
 *
 * @param {Object} currentCustomer - The customer object whose groups we want to fetch.
 * @returns {string} - A JSON stringified array containing the IDs of the customer groups.
 */
function getCustomerGroups(currentCustomer) {
    if (!currentCustomer) {
        return JSON.stringify([]);
    }

    var customerGroupIds = [];
    var customerGroups = currentCustomer.getCustomerGroups().toArray();
    customerGroups.forEach(function (customerGroup) {
        customerGroupIds.push(customerGroup.ID);
    });

    return JSON.stringify(customerGroupIds);
}

/**
 * Check Constructor Enabled or Disabled
 *
 * @returns {boolean} - returns cio search enabled or disabled
 */
function isConstructorEnabled() {
    const isSearchEnabled = ('Constructor_Search_Enabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('Constructor_Search_Enabled')) || false;
    const isConstructorPerLocale = ('Constructor_Enable_Locale' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('Constructor_Enable_Locale')) || false;
    if (isSearchEnabled && isConstructorPerLocale) {
        const currentLocale = request.getLocale();
        const enabledConstructorLocales = ('Constructor_Enabled_Locales' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('Constructor_Enabled_Locales')) || [];
        return enabledConstructorLocales.indexOf(currentLocale) > -1;
    }

    return isSearchEnabled;
}

/**
 * Get settings related to ConstructorIO.
 *
 * @param {Object} pdict - Dictionary of parameters.
 * @returns {string} - ConstructorIO settings as a JSON string.
 */
function getConstructorIOSettings(pdict) {
    // TODO: check if customer data is cached
    var currentCustomer = pdict.CurrentCustomer;
    var localisedConstructorIOSettings = getLocalisedConstructorIOSettingsFromCache(pdict.locale);
    var serviceURL = Site.current.getCustomPreferenceValue('Constructor_ServiceURL');

    var custEmail = currentCustomer && currentCustomer.profile ? sha256(currentCustomer.profile.email) : '';
    if (currentCustomer && currentCustomer.externalProfiles && currentCustomer.externalProfiles[0].externalID) {
        custEmail = currentCustomer.externalProfiles[0].externalID;
    }

    var settings = {
        initialSearchParams: pdict.initialSearchParams || null,
        apiKey: getApiKeyForLocale(pdict.locale),
        search_enabled: isConstructorEnabled(),
        browse_enabled: 'Category_Data_Source' in Site.current.preferences.custom && [1, 2].includes(Site.current.getCustomPreferenceValue('Category_Data_Source')),
        timeout: Site.current.getCustomPreferenceValue('Constructor_ResponseTimeout') || 0,
        serviceUrl: serviceURL ? serviceURL.toString() : 'https://ac.cnstrc.com',
        customerEmail: custEmail,
        customerGroups: getCustomerGroups(currentCustomer) || [],
        samplePrice: require('dw/util/StringUtils').formatMoney(new Money(14.97, session.currency.currencyCode)),
        samplePriceThousand: require('dw/util/StringUtils').formatMoney(new Money(1497.5, session.currency.currencyCode)),
        priceRange: {
            '-inf': Number(Resource.msg('constructor.price.range.min', 'search', null)),
            inf: Number(Resource.msg('constructor.price.range.max', 'search', null))
        }
    };

    if (localisedConstructorIOSettings) {
        settings.constructorIOSortOptionsMap = localisedConstructorIOSettings.constructorIOSortOptionsMap;
        settings.defaultCutoffThreshold = localisedConstructorIOSettings.defaultCutoffThreshold;
        settings.displayableRefinementCategories = localisedConstructorIOSettings.displayableRefinementCategories;
        settings.routeRefinements = localisedConstructorIOSettings.routeRefinements;
        settings.sortOptionsURLMap = localisedConstructorIOSettings.sortOptionsURLMap;
        settings.sizeSortRules = localisedConstructorIOSettings.sizeSortRules;
        settings.sizeRangeMap = localisedConstructorIOSettings.sizeRangeMap;
        settings.variationMap = localisedConstructorIOSettings.variationMap;
    }

    return settings;
}

/**
 * Get resources related to ConstructorIO.
 *
 * @returns {string} - ConstructorIO resources as a JSON string.
 */
function getConstructorIOResources() {
    var noSearchSuggestionsResultsContent = getNoSearchSuggestionsResultsContent();

    return {
        'label.sort': Resource.msg('label.sort', 'search', null),
        'label.search.title': Resource.msg('label.search.title', 'search', null),
        'label.num.items.more': Resource.msg('label.num.items.more', 'search', null),
        'label.num.items': Resource.msg('label.num.items', 'search', null),
        'label.num.item': Resource.msg('label.num.item', 'search', null),
        'label.load.more.products': Resource.msg('label.load.more.products', 'search', null),
        'button.more': Resource.msg('button.more', 'search', null),
        'title.previous': Resource.msg('title.previous', 'search', null),
        'label.previous': Resource.msg('search.nojspagination.previous', 'search', null),
        'label.next': Resource.msg('search.nojspagination.next', 'search', null),
        'title.next': Resource.msg('search.nojspagination.next.label', 'search', null),
        'title.default': Resource.msg('search.nojspagination.link', 'search', null),
        'refine.title': Resource.msg('label.refinement.title', 'search', null),
        'refinements.amount': Resource.msg('refinements.amount', 'search', null),
        'refinements.clear': Resource.msg('refinements.clear', 'search', null),
        'refinements.apply': Resource.msg('refinements.apply', 'search', null),
        'assistive.text.remove.filter.button': Resource.msg('assistive.text.remove.filter.button', 'search', null),
        'refinements.close': Resource.msg('refinements.close', 'search', null),
        'refinements.title': Resource.msg('refinements.title', 'search', null),
        'refinements.show.button': Resource.msg('refinements.show.button', 'search', null),
        'refinements.hide.button': Resource.msg('refinements.hide.button', 'search', null),
        'product.view.color': Resource.msg('product.view.color', 'product', null) + ' {0}-{1}',
        'refinement.discountpercentage.20': Resource.msg('refinement.discountpercentage.20', 'search', null),
        'refinement.discountpercentage.30': Resource.msg('refinement.discountpercentage.30', 'search', null),
        'refinement.discountpercentage.40': Resource.msg('refinement.discountpercentage.40', 'search', null),
        'refinement.discountpercentage.50': Resource.msg('refinement.discountpercentage.50', 'search', null),
        'refinement.discountpercentage.51': Resource.msg('refinement.discountpercentage.51', 'search', null),
        tileSkeletonLoader: URLUtils.staticURL('/images/Tile_Skeleton_Loader.svg').toString(),
        flameIcon: URLUtils.staticURL('/images/iconimages/flame.png').toString(),
        flameIconAlt: Resource.msg('badge.flameIcon.text', 'common', null),
        refinementsViewall: Resource.msg('refinements.viewall', 'search', null),
        headerModalSuggestionsProduct: Resource.msg('label.header.search.modal.suggestions.product', 'search', null),
        headerModalSuggestionsCategory: Resource.msg('label.header.search.modal.suggestions.category', 'search', null),
        headerModalSuggestionsRecentSearch: Resource.msg('label.header.search.modal.suggestions.recent', 'search', null),
        soldOut: Resource.msg('label.outofstock.soldOut', 'common', null),
        buttonComingsoon: Resource.msg('button.comingsoon', 'common', null),
        searchColorLabel: Resource.msg('label.constructor.color', 'search', null),
        searchColorsLabel: Resource.msg('label.constructor.colors', 'search', null),
        wishlistButtonLabel: Resource.msg('button.add_to_wishlist.txt', 'wishlist', null),
        noResultsFound: Resource.msg('label.header.search.modal.suggestions.noresults', 'search', null),
        noSearchSuggestions: noSearchSuggestionsResultsContent && noSearchSuggestionsResultsContent.body ? noSearchSuggestionsResultsContent.body.toString() : '',
        sortingRules: {
            featured: Resource.msg('sorting.featured', 'search', null),
            relevance: Resource.msg('sorting.relevance', 'search', null),
            bestsellers: Resource.msg('sorting.bestsellers', 'search', null),
            'saleprice.descending': Resource.msg('sorting.saleprice.descending', 'search', null),
            'saleprice.ascending': Resource.msg('sorting.saleprice.ascending', 'search', null),
            rating: Resource.msg('sorting.rating', 'search', null),
            newest: Resource.msg('sorting.newest', 'search', null),
            topsellers: Resource.msg('sorting.topsellers', 'search', null)
        }
    };
}

/**
 * Get URLs related to ConstructorIO.
 *
 * @returns {string} - ConstructorIO URLs as a JSON string.
 */
function getConstructorIOURLs() {
    return {
        updateGrid: URLUtils.url('Search-UpdateGrid').toString(),
        searchShowAjax: URLUtils.url('Search-ShowAjax').toString(),
        searchURL: (URLUtils.url('Search-Show').toString() + '?q='),
        wishlistAddProduct: URLUtils.url('Wishlist-AddProduct').toString(),
        wishlistRemoveProduct: URLUtils.url('Wishlist-RemoveProduct').toString(),
        productShow: (URLUtils.url('Product-Show').toString() + '?pid=')
    };
}

module.exports = {
    sha256: sha256,
    getNoSearchSuggestionsResultsContent: getNoSearchSuggestionsResultsContent,
    getLocalisedConstructorIOSettingsFromCache: getLocalisedConstructorIOSettingsFromCache,
    mightBeJSONObject: mightBeJSONObject,
    getApiKeyForLocale: getApiKeyForLocale,
    getCustomerGroups: getCustomerGroups,
    getConstructorIOSettings: getConstructorIOSettings,
    getConstructorIOResources: getConstructorIOResources,
    getConstructorIOURLs: getConstructorIOURLs,
    isConstructorEnabled: isConstructorEnabled
};
