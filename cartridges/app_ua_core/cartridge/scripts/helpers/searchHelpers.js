/* eslint-disable spellcheck/spell-checker */
'use strict';

const searchHelpers = require('app_storefront_base/cartridge/scripts/helpers/searchHelpers');
const preferences = require('*/cartridge/config/preferences');
const DEFAULT_PAGE_SIZE = preferences.defaultPageSize ? preferences.defaultPageSize : 12;

/**
 * Get canonical category ID for a category
 * @param  {string} cgid - The category ID
 * @return {string} - The ID of the canonical category
 */
function getCanonicalCategoryID(cgid) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var tempCurrentCat = CatalogMgr.getCategory(cgid);

    if (tempCurrentCat && tempCurrentCat.custom && tempCurrentCat.custom.canonicalCategory) {
        // Load the canonicalCategory to verify it exists and is online
        var tempCanonicalCat = CatalogMgr.getCategory(tempCurrentCat.custom.canonicalCategory);
        if (tempCanonicalCat && tempCanonicalCat.online) {
            return tempCanonicalCat.ID;
        }
    }
    return cgid;
}

/**
 * performs a search
 *
 * @param {Object} req - Provided HTTP query parameters
 * @param {Object} res - Provided HTTP query parameters
 * @return {Object} - an object with relevant search information
 */
searchHelpers.search = function (req, res) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');

    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');

    var apiProductSearch = new ProductSearchModel();
    var categoryTemplate = '';
    var maxSlots = 4;
    var productSearch;
    var reportingURLs;

    var searchRedirect = req.querystring.q ? apiProductSearch.getSearchRedirect(req.querystring.q) : null;

    if (searchRedirect) {
        return { searchRedirect: searchRedirect.getLocation() };
    }

    apiProductSearch = searchHelpers.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
    apiProductSearch.search();

    if (!apiProductSearch.personalizedSort) {
        searchHelpers.applyCache(res);
    }

    var params = req.querystring;
    if (typeof (params.start) !== 'undefined' && typeof (params.sz) === 'undefined') {
        params.sz = parseInt(req.querystring.start, 10) + DEFAULT_PAGE_SIZE;
        params.start = 0;
    }
    if (Site.current.getCustomPreferenceValue('enableHideLoadMoreProductsCTA') && typeof (params.start) !== 'undefined' && !empty(session.custom.internalnavigation) && session.custom.internalnavigation) {
        params.sz = parseInt(params.start, 10) + DEFAULT_PAGE_SIZE;
        params.start = 0;
        delete session.custom.internalnavigation;
    }
    categoryTemplate = searchHelpers.getCategoryTemplate(apiProductSearch, params);
    productSearch = new ProductSearch(
        apiProductSearch,
        params,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);
    var canonicalUrl = URLUtils.abs('Search-Show');
    if (req.querystring.cgid) {
        canonicalUrl.append('cgid', getCanonicalCategoryID(req.querystring.cgid));
    }
    var refineurl = URLUtils.url('Search-Refinebar');
    var whitelistedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule'];
    var isRefinedSearch = false;
    var ArrayList = require('dw/util/ArrayList');
    var queryParams = new ArrayList();

    Object.keys(req.querystring).forEach(function (element) {
        if (whitelistedParams.indexOf(element) > -1) {
            refineurl.append(element, req.querystring[element]);

            if (element !== 'cgid') {
                canonicalUrl.append(element, req.querystring[element]);
            }
        }
        if (['pmin', 'pmax'].indexOf(element) > -1) {
            isRefinedSearch = true;
        }
        if (element === 'preferences') {
            var i = 1;
            isRefinedSearch = true;
            Object.keys(req.querystring[element]).forEach(function (preference) {
                if (preference !== 'isMFOItem' && preference !== 'experienceType' && preference !== 'premiumFilter' && preference !== 'isLoyaltyExclusive') {
                    refineurl.append('prefn' + i, preference);
                    refineurl.append('prefv' + i, req.querystring[element][preference]);
                    canonicalUrl.append('prefn' + i, preference);
                    canonicalUrl.append('prefv' + i, req.querystring[element][preference]);
                    var queryParamsObject = {};
                    queryParamsObject.key = (preference);
                    queryParamsObject.value = (req.querystring[element][preference]);
                    queryParams.push(queryParamsObject);
                    i++;
                }
            });
        }
        if (element === 'start') {
            isRefinedSearch = true;
            canonicalUrl.append('start', req.querystring[element]);
        }
        if (element === 'viewPreference') {
            isRefinedSearch = true;
            canonicalUrl.append('viewPreference', req.querystring[element]);
        }
        if (element === 'isShopAllUrl') {
            isRefinedSearch = true;
            canonicalUrl.append('isShopAllUrl', req.querystring[element]);
        }
        // Adding for selected Refinement
        if (element === 'selectedFilter') {
            refineurl.append('selectedFilter', req.querystring[element]);
        }
    });
    if (req.querystring.sz) canonicalUrl.append('sz', req.querystring.sz);
    if (productSearch.searchKeywords !== null && !isRefinedSearch) {
        reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    var result = {
        productSearch: productSearch,
        maxSlots: maxSlots,
        reportingURLs: reportingURLs,
        refineurl: refineurl,
        canonicalUrl: canonicalUrl,
        QueryParams: queryParams,
        enableAvailablePerLocale: enableAvailablePerLocale
    };

    if (productSearch.isCategorySearch && categoryTemplate) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);
        result.category = apiProductSearch.category;
        result.categoryTemplate = categoryTemplate;
    }

    if ((empty(result.category) || result.category.online === false) && empty(params.q)) {
        result.productSearch.productIds = [];
    }

    if (!categoryTemplate || categoryTemplate === 'rendering/category/categoryproducthits') {
        result.schemaData = schemaHelper.getListingPageSchema(productSearch.productIds);
    }

    return result;
};

/**
 * Set search configuration values
 *
 * @param {dw.catalog.ProductSearchModel} apiProductSearch - API search instance
 * @param {Object} params - Provided HTTP query parameters
 * @param {Object} httpParameterMap - Query params
 * @return {dw.catalog.ProductSearchModel} - API search instance
 */
searchHelpers.setupSearch = function (apiProductSearch, params, httpParameterMap) {
    var Site = require('dw/system/Site');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var searchModelHelper = require('*/cartridge/scripts/search/search');
    let searchQuery = params;

    // START Add internal refinement(s)
    let enableExperienceTypes = ('enableExperienceTypes' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enableExperienceTypes'); //eslint-disable-line
    let experienceTypeFilter = ('experienceTypeFilter' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('experienceTypeFilter'); //eslint-disable-line
    // Filter by experience type if enableExperienceTypes is true
    if (enableExperienceTypes) {
        var experienceType = '';
        if (searchQuery.cgid) {
            let category = CatalogMgr.getCategory(searchQuery.cgid);
            if (category) {
                let categoryDefaultExperience = ('categoryDefaultExperience' in Site.current.preferences.custom) ? Site.current.getCustomPreferenceValue('categoryDefaultExperience').value : null; //eslint-disable-line
                let catExpType = category.custom.experienceType.value; //eslint-disable-line
                experienceType = catExpType || categoryDefaultExperience;
            }
        } else {
            let searchDefaultExperience = ('searchDefaultExperience' in Site.current.preferences.custom) ? Site.current.getCustomPreferenceValue('searchDefaultExperience').value : null; //eslint-disable-line
            experienceType = searchDefaultExperience;
        }

        // The old, master-level filter was experienceType. The new variant-level filter is premiumFilter. Important because price-sort does not work correctly with master-level attributes.
        if (empty(searchQuery.preferences)) {
            let obj = {};
            obj[experienceTypeFilter] = experienceType;
            searchQuery.preferences = obj;
        } else {
            // searchQuery.preferences.experienceType = experienceType;
            searchQuery.preferences[experienceTypeFilter] = experienceType;
        }
    }

    let hideMFOItems = ('hideMFOItems' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('hideMFOItems') == true; //eslint-disable-line
    if (hideMFOItems) {
        if (empty(searchQuery.preferences)) searchQuery.preferences =  { "isMFOItem" : false }; //eslint-disable-line
        else searchQuery.preferences.isMFOItem = false;
    }
    let isAvailablePerLocale = ('enableAvailablePerLocale' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enableAvailablePerLocale');
    if (isAvailablePerLocale) {
        if (empty(searchQuery.preferences)) searchQuery.preferences =  { "availableForLocale" : "Yes" }; //eslint-disable-line
        else {
            searchQuery.preferences.availableForLocale = 'Yes';
        }
    }
    const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    const hideLoyaltyItems = PreferencesUtil.getValue('isLoyaltyEnable') && !session.customer.isMemberOfCustomerGroup('Loyalty');
    if (hideLoyaltyItems) {
        if (empty(searchQuery.preferences)) {
            searchQuery.preferences = { isLoyaltyExclusive: false };
        } else {
            searchQuery.preferences.isLoyaltyExclusive = false;
        }
    }
    // END Add internal refinement(s)

    var sortingRule = searchQuery.srule ? CatalogMgr.getSortingRule(searchQuery.srule) : null;
    var selectedCategory = CatalogMgr.getCategory(searchQuery.cgid);
    selectedCategory = selectedCategory && selectedCategory.online ? selectedCategory : null;

    searchModelHelper.setProductProperties(apiProductSearch, searchQuery, selectedCategory, sortingRule, httpParameterMap);

    if (searchQuery.preferences) {
        searchModelHelper.addRefinementValues(apiProductSearch, searchQuery.preferences);
    }

    return apiProductSearch;
};

/**
 * Set page URLs
 *
 * @param {Object} req - Provided HTTP query parameters
 * @param {Object} result - Provided object parameters
 * @return {Object} - an object with relevant search information
 */
searchHelpers.setupPageURLs = function (req, result) {
    var URLUtils = require('dw/web/URLUtils');
    var productCount = result.productSearch.count ? result.productSearch.count : '';
    var PageURLs = [];
    var pageURL = URLUtils.abs('Search-Show');
    if (req.querystring.cgid) {
        pageURL.append('cgid', req.querystring.cgid);
    }

    for (var i = DEFAULT_PAGE_SIZE; i <= productCount; i += DEFAULT_PAGE_SIZE) {
        PageURLs.push(pageURL + '?start=' + i + '&sz=' + DEFAULT_PAGE_SIZE);
    }
    return PageURLs;
};

/**
 * Retrieve a category's template filepath if available
 *
 * @param {dw.catalog.ProductSearchModel} apiProductSearch - API search instance
 * @param {Object} queryString - query param
 * @return {string} - Category's template filepath
 */
searchHelpers.getCategoryTemplate = function (apiProductSearch, queryString) {
    var categoryTemplate = apiProductSearch.category ? apiProductSearch.category.template : '';
    var isShopUrl = 'isShopAllUrl' in queryString && queryString.isShopAllUrl;
    if (isShopUrl === 'true' && apiProductSearch.category && apiProductSearch.category.custom.displayShopAllLinkInMobile) {
        categoryTemplate = 'search/searchResults';
    }
    return categoryTemplate;
};
/**
 * detect the browser back button when coming back to PDP
 * @param {Object} req - req object
 * @return {boolean} - return status of PDP back button
 */
searchHelpers.pdpBackButtonDetectionWithSize = function (req) {
    var Site = require('dw/system/Site');
    var returnFromPDP = false;
    var clickStream = req.session.clickStream;
    var limit = !empty(Site.current.getCustomPreferenceValue('clickStreamLimit')) ? Site.current.getCustomPreferenceValue('clickStreamLimit') : 10;
    var clicks = clickStream.clicks.reverse().slice(0, limit);
    var productClick = null;
    var searchClick = null;
    var counter = 0;
    var done = false;

    // find the last pdp click and the last search click
    var backClicks = clicks.filter(function (click) {
        if (counter === 0) {
            counter++;
            return true;
        }
        if (click.pipelineName.indexOf('Product-Show') > -1 && productClick == null && !done) {
            productClick = click;
            counter++;
            return true;
        }
        if ((click.pipelineName.indexOf('Search-Show') > -1 && searchClick == null)) {
            searchClick = click;
            counter++;
            done = true;
            return true;
        }
        counter++;
        return false;
    });
    returnFromPDP = backClicks.length > 1 && productClick !== null;

    return returnFromPDP;
};
/**
 * Return true if user has applied refinement(s)
 *
 * @param {Object} querystring - querystring
 * @return {boolean} - true if at least one refinement is applied, else false
 */
searchHelpers.isUserRefinedSearch = function (querystring) {
    var isUserRefinedSearch = false;
    if (!empty(querystring)) {
        Object.keys(querystring).forEach(function (element) {
            if (element === 'preferences') {
                Object.keys(querystring[element]).forEach(function (preference) {
                    if (preference !== 'isMFOItem' && preference !== 'premiumFilter' && preference !== 'isLoyaltyExclusive') {
                        isUserRefinedSearch = true;
                    }
                });
            }
            if (['pmin', 'pmax'].indexOf(element) > -1) {
                isUserRefinedSearch = true;
            }
        });
    }
    return isUserRefinedSearch;
};

/**
 * Checks if user has two values of same refinement type eg. color: white and red
 * @param {Object} querystring - querystring
 * @returns {boolean} - true if has two value of same refinement type
 */

searchHelpers.hasTwoOrMoreRefinementValuesOfSameType = function (querystring) {
    var hasTwoOrMoreRefinementValuesOfSameType = false;

    Object.keys(querystring).forEach(function (element) {
        if (element === 'preferences') {
            Object.keys(querystring[element]).forEach(function (preference) {
                const val = querystring[element][preference];
                if (val && typeof val === 'string' && val.indexOf('|') !== -1) {
                    hasTwoOrMoreRefinementValuesOfSameType = true;
                }
            });
        }
    });

    return hasTwoOrMoreRefinementValuesOfSameType;
};

/**
 * When the user has refinements on its category search, sets up the h1 value for the refinements
 * @param {Object[]} queryParamsValues - List of attribute values from Query params
 * @returns {string} - the h1 value that goes with the category display name
 */
searchHelpers.setupRefinementsDisplayTitle = function (queryParamsValues) {
    var allowedParamsInOrder = ['gender', 'colorgroup', 'enduse', 'silhouette', 'subsilhouette', 'subsubsilhouette', 'division', 'fittype', 'size'];
    var queryParamsMatch = [];
    var filterParams;
    var refinementDisplayTitle = '';
    var prefix;
    var hasFitTypeParam = false;

    allowedParamsInOrder.forEach(function (param) {
        filterParams = queryParamsValues.toArray().filter(function (queryParam) {
            return queryParam.key === param;
        });

        if (filterParams.length) queryParamsMatch.push(filterParams[0]);
    });

    var maxLength = queryParamsMatch.length > 5 ? 5 : queryParamsMatch.length;

    for (var i = 0; i < maxLength; i++) {
        prefix = queryParamsMatch[i].key === 'fittype' || (queryParamsMatch[i].key === 'size' && !hasFitTypeParam) ? ' - ' : ' ';

        if (queryParamsMatch[i].key === 'fittype') hasFitTypeParam = true;

        refinementDisplayTitle += prefix + queryParamsMatch[i].value;
    }

    return refinementDisplayTitle;
};

/**
 * Set up the Category Search Display Name based on the user selected refinment
 *
 * @param {string} categoryDisplayName - categoryDisplayName from custom object
 * @param {Object[]} queryParamsValues - List of attribute values from Query params
 * @return {string} - an categoryDisplayName based on the user selected refinment
 */
searchHelpers.setupCategoryDisplayName = function (categoryDisplayName, queryParamsValues) {
    var displayName = categoryDisplayName;
    var searchDisplayName = '';
    var allowedKeys = ['colorgroup', 'enduse', 'gender', 'division', 'subsilhouette', 'subsubsilhouette', 'length', 'fittype', 'merchCollection', 'gearline', 'agegroup', 'team', 'silhouette', 'alphatechnology', 'type'];
    if (!empty(queryParamsValues) && queryParamsValues.length >= 1) {
        for (var i = 0; i < queryParamsValues.length; i++) {
            var queryParams = queryParamsValues[i];
            if (!empty(queryParams.key) && allowedKeys.indexOf(queryParams.key) !== -1) {
                if (!empty(queryParams.value) && (queryParams.value.split('|').length > 1)) {
                    displayName = categoryDisplayName;
                    searchDisplayName = '';
                    break;
                } else if (i <= 1) {
                    displayName += ' - ' + queryParams.value;
                    searchDisplayName += searchDisplayName ? ' - ' + queryParams.value : queryParams.value;
                }
            }
        }
    } else if (!empty(queryParamsValues)) {
        for (var j = 0; j < queryParamsValues.length; j++) {
            displayName += ' - ' + queryParamsValues[j].value;
        }
    }
    var titleNames = {
        searchDisplayName: searchDisplayName,
        displayName: displayName
    };
    return titleNames;
};
/**
 * create breadcrumb url based on  user selected refinment and query string
 *
 * @param {Object[]} breadCrumbSelectedRefinment  - sorted seleted refinement
 * @param {Object[]} queryString - query string
 */
function createBreadCrumbUrl(breadCrumbSelectedRefinment, queryString) {
    var URLUtils = require('dw/web/URLUtils');
    var listedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule'];
    var refinmentArrayLength = breadCrumbSelectedRefinment.length;
    var count = 0;
    for (var a = refinmentArrayLength - 1; a >= 0; a--) {
        var breadCrumbUrl = URLUtils.url('Search-Show');
        var currentRefinementId = breadCrumbSelectedRefinment[a].id;
        if (a !== refinmentArrayLength - 1) {
            count++;
        }
        if ((a !== refinmentArrayLength - 1) && (currentRefinementId === breadCrumbSelectedRefinment[a + 1].id)) {
            breadCrumbSelectedRefinment[a].breadcrumbRefinementUrl = breadCrumbSelectedRefinment[a + 1].breadcrumbRefinementUrl; // eslint-disable-line
            continue; // eslint-disable-line
        }
        Object.keys(queryString).forEach(function (element) { // eslint-disable-line
            if (listedParams.indexOf(element) > -1) {
                breadCrumbUrl.append(element, queryString[element]);
            }
            if (element === 'viewPreference' || element === 'isShopAllUrl') {
                breadCrumbUrl.append(element, queryString[element]);
            }
            if (element === 'preferences') {
                // logic for different-different refinment url
                var n = 1;
                Object.keys(queryString[element]).forEach(function (preference) {
                    if (a === refinmentArrayLength - 1) {
                        breadCrumbUrl.append('prefn' + n, preference);
                        breadCrumbUrl.append('prefv' + n, queryString[element][preference]);
                        n++;
                    } else {
                        for (var b = (refinmentArrayLength - count - 1); b >= 0; b--) {
                            if (breadCrumbSelectedRefinment[b].id === preference) {
                                breadCrumbUrl.append('prefn' + n, preference);
                                breadCrumbUrl.append('prefv' + n, queryString[element][preference]);
                                n++;
                            }
                        }
                        var isfoundPreference = false;
                        for (var m = 0; m < refinmentArrayLength; m++) {
                            if (breadCrumbSelectedRefinment[m].id === preference) {
                                isfoundPreference = true;
                                break;
                            }
                        }
                        if (!isfoundPreference) {
                            breadCrumbUrl.append('prefn' + n, preference);
                            breadCrumbUrl.append('prefv' + n, queryString[element][preference]);
                            n++;
                        }
                    }
                });
            }
        });
        breadCrumbSelectedRefinment[a].breadcrumbRefinementUrl = breadCrumbUrl; // eslint-disable-line
    }
}
/**
 * create seo breadcrumb refinemt,sort the selcted refinments and add same type of refinement
 *
 * @param {Object[]} selectedRefinements  - seleted refinement
 * @param {Object[]} queryString - query string
 * @return {Object[]} - breadCrumbSelectedRefinment - return array object for breadcrumb refinement
 */
searchHelpers.breadcrumRefinement = function (selectedRefinements, queryString) {
    var breadCrumbSelectedRefinment = [];
    var refinementsOrder = ['gender', 'colorgroup', 'fittype', 'size', 'enduse', 'silhouette', 'subsilhouette', 'subsubsilhouette', 'division'];
    var sortedSelectedRefinment = selectedRefinements.sort(function (refOne, refSecond) {
        var refOneId = refOne.id;
        var refSecondId = refSecond.id;
        if (refinementsOrder.indexOf(refOneId) < refinementsOrder.indexOf(refSecondId) || refinementsOrder.indexOf(refOneId) === -1 || refinementsOrder.indexOf(refSecondId) === -1) {
            return -1;
        } else { // eslint-disable-line
            return 1;
        }
    });
    for (var k = 0; k < sortedSelectedRefinment.length; k++) {
        var refinedId = sortedSelectedRefinment[k].id;
        if ((refinedId === 'gender' || refinedId === 'colorgroup' || refinedId === 'fittype' || refinedId === 'size' || refinedId === 'enduse' || refinedId === 'silhouette' || refinedId === 'subsilhouette' || refinedId === 'subsubsilhouette' || refinedId === 'division') && (breadCrumbSelectedRefinment.length < 15)) {
            breadCrumbSelectedRefinment.push(sortedSelectedRefinment[k]);
        }
    }
    for (var i = 0; i < breadCrumbSelectedRefinment.length; i++) {
        var selectedRef = breadCrumbSelectedRefinment[i].id;
        var sameRefinementGroupValue = breadCrumbSelectedRefinment[i].displayValue;
        if (i !== 0 && breadCrumbSelectedRefinment[i - 1].id === selectedRef) {
            breadCrumbSelectedRefinment[i].sameRefinementGroupValue = breadCrumbSelectedRefinment[i - 1].sameRefinementGroupValue;
            continue; // eslint-disable-line
        }
        for (var j = i + 1; j < breadCrumbSelectedRefinment.length; j++) {
            if (selectedRef === breadCrumbSelectedRefinment[j].id) {
                sameRefinementGroupValue = sameRefinementGroupValue + ' + ' + breadCrumbSelectedRefinment[j].displayValue;
            }
        }
        breadCrumbSelectedRefinment[i].sameRefinementGroupValue = sameRefinementGroupValue;
    }
    createBreadCrumbUrl(breadCrumbSelectedRefinment, queryString);
    return breadCrumbSelectedRefinment;
};

/**
 * Set up the Breadcrumb Schema Markup with respect to updated Breadcrumb Navigation in PLP
 * If any refinement selected ,Then it will merge that refinment with existing breadcrumb and creates a new list
 *
 * @param {Object[]} breadcrumbs - List of breadcrumb attribute values
 * @param {Object[]} breadcrumbSelectedFilters - List of filter attribute values
 * @return {Object[]} - List of new attribute values
 */
searchHelpers.setupBreadcrumbSchemaMarkup = function (breadcrumbs, breadcrumbSelectedFilters) {
    breadcrumbSelectedFilters.forEach(function (item) {
        breadcrumbs.push({
            htmlValue: item.displayValue,
            url: item.pageUrl,
            hide: false
        });
    });
    return breadcrumbs;
};

/**
 * Retrieves the Category Landing Page, if available in Page Designer
 * @param {Object} categoryID - the category ID as determined from the request
 * @returns {Object} a lookup result with these fields:
 *  * page - the page that is configured for this category, if any
 *  * invisiblePage - the page that is configured for this category if we ignore visibility, if it is different from page
 *  * aspectAttributes - the aspect attributes that should be passed to the PageMgr, null if no page was found
 */
searchHelpers.getPageDesignerCategoryPage = function (categoryID) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var PageMgr = require('dw/experience/PageMgr');
    var HashMap = require('dw/util/HashMap');

    var category = CatalogMgr.getCategory(categoryID.toLowerCase());
    var page = PageMgr.getPageByCategory(category, true, 'plp');
    var invisiblePage = PageMgr.getPageByCategory(category, false, 'plp');

    if (page) {
        var aspectAttributes = new HashMap();
        aspectAttributes.category = category;

        return {
            page: page,
            invisiblePage: page.ID !== invisiblePage.ID ? invisiblePage : null,
            aspectAttributes: aspectAttributes
        };
    }

    return {
        page: null,
        invisiblePage: invisiblePage,
        aspectAttributes: null
    };
};
/**
 * The Filtered URL for category search with enabled Category Search Refinement
 * @param {Object} req - Provided HTTP query parameters
 * @param {Object[]} queryParamsValues - List of attribute values from Query params
 * @returns {string} - Enable Category Search Refinement Filtered URL
 */
searchHelpers.setupCatRefinementFilteredUrl = function (req, queryParamsValues) {
    let Site = require('dw/system/Site');
    let sitePreferences = Site.current.preferences.custom;
    let allowedParamsInOrder = 'enabledCategorySearchRefinements' in sitePreferences ? sitePreferences.enabledCategorySearchRefinements.split(',') : [];
    let queryParamsMatch = [];
    let filterParams;
    let URLUtils = require('dw/web/URLUtils');
    let filteredUrl = URLUtils.url('Search-Show', 'cgid', req.querystring.cgid);

    allowedParamsInOrder.forEach(function (param) {
        filterParams = queryParamsValues.toArray().filter(function (queryParam) {
            return queryParam.key === param;
        });

        if (filterParams.length) queryParamsMatch.push(filterParams[0]);
    });

    let maxLength = queryParamsMatch.length > 5 ? 5 : queryParamsMatch.length;

    for (let i = 0; i < maxLength; i++) {
        filteredUrl.append('prefn' + i, queryParamsMatch[i].key);
        filteredUrl.append('prefv' + i, queryParamsMatch[i].value);
    }

    return filteredUrl.toString();
};

module.exports = searchHelpers;
