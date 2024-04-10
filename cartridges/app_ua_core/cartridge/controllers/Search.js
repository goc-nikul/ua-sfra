'use strict';

var server = require('server');

var URLUtils = require('dw/web/URLUtils');

server.extend(module.superModule);
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productHelpers = require('*/cartridge/scripts/helpers/productHelpers');
var preferences = require('*/cartridge/config/preferences');

server.prepend('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var categoryLocaleCheck = Site.current.getCustomPreferenceValue('isCategoryLocaleCheckEnabled');
    if (categoryLocaleCheck) {
        var ProductSearchModel = require('dw/catalog/ProductSearchModel');
        var apiProductSearch = new ProductSearchModel();
        var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
        apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
        apiProductSearch.search();
        var category = apiProductSearch.category;

        if (category && ('isCategoryOnline' in category.custom) && category.custom.isCategoryOnline.valueOf() === 'false') {
            res.setRedirectStatus(404);
            res.render('error/notFound');
            this.emit('route:Complete', req, res);
            return;
        }
    }
    next();
});

server.append('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var Locale = require('dw/util/Locale');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var categoryHelper = require('*/cartridge/scripts/helpers/categoryHelper');
    var result = searchHelper.search(req, res);
    var categoryID = result.category ? result.category.ID : null;
    var viewData = res.getViewData();
    var breadcrumbs = productHelpers.getAllBreadcrumbs(categoryID, null, []).reverse();
    var CategoryObject;
    let enableExperienceTypes = ('enableExperienceTypes' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enableExperienceTypes'); //eslint-disable-line
    var redirectUrl;
    var PreferencesUtil = require('~/cartridge/scripts/utils/PreferencesUtil');
    var showSelectedFiltersOnBreadcrumbs = PreferencesUtil.isCountryEnabled(
        'showSelectedFiltersOnBreadcrumbs'
    );
    if (req.querystring.start && !req.querystring.sz) {
        redirectUrl = URLUtils.url('Search-Show').toString() + '?' + req.querystring.toString() + '&sz=' + result.productSearch.defaultPageSize;
        res.redirect(redirectUrl);
    }
    if (result.category && req.querystring.start && req.querystring.sz && result.productSearch.productIds && result.productSearch.productIds.length < 1) {
        redirectUrl = result && !empty(result.QueryParams) ? searchHelper.setupCatRefinementFilteredUrl(req, result.QueryParams) : URLUtils.url('Search-Show', 'cgid', req.querystring.cgid).toString();
        if (redirectUrl) {
            res.setRedirectStatus(301);
            res.redirect(redirectUrl);
        }
    }

    if (enableExperienceTypes) {
        let experienceType = null; //eslint-disable-line
        if (result.category) {
            let categoryDefaultExperience = ('categoryDefaultExperience' in Site.current.preferences.custom) ? Site.getCurrent().getCustomPreferenceValue('categoryDefaultExperience').value : null; //eslint-disable-line 
            let catExpType = result.category.custom.experienceType.value; //eslint-disable-line
            experienceType = catExpType || categoryDefaultExperience;
        } else {
            let searchDefaultExperience = ('searchDefaultExperience' in Site.current.preferences.custom) ? Site.getCurrent().getCustomPreferenceValue('searchDefaultExperience').value : null; //eslint-disable-line
            experienceType = searchDefaultExperience;
        }
        viewData.enableExperienceTypes = enableExperienceTypes;
        viewData.experienceType = experienceType;
    }
    var categoryLocaleCheckEnabled = Site.current.getCustomPreferenceValue('isCategoryLocaleCheckEnabled');
    if (categoryLocaleCheckEnabled && result.category && ('isCategoryOnline' in result.category.custom && result.category.custom.isCategoryOnline.valueOf() === 'true')) {
        CategoryObject = categoryHelper.getCategoryObject(result);
    } else if (result.category) {
        CategoryObject = categoryHelper.getCategoryObject(result);
    }
    viewData.CategoryObject = CategoryObject;
    viewData.pageURLs = searchHelper.setupPageURLs(req, result);
    viewData.colorGroup = (req.querystring.preferences && req.querystring.preferences.colorgroup) ? req.querystring.preferences.colorgroup : '';
    viewData.noIndexSEOTag = result.category && 'noIndexSEOTag' in result.category.custom && result.category.custom.noIndexSEOTag;
    viewData.team = (req.querystring.preferences && req.querystring.preferences.team) ? req.querystring.preferences.team : '';
    viewData.isPLP = true;
    viewData.categoryID = categoryID;
    viewData.breadcrumbs = breadcrumbs;
    viewData.isHideSubCategoriesInCategoryMenu = result.category ? result.category.custom.hideSubCategoriesInCategoryMenu : null;
    viewData.isOutlet = result.category ? result.category.custom.experienceType.value : null;
    var fitModelEnabled = result.category && 'showFitModelSelection' in result.category.custom ? result.category.custom.showFitModelSelection : false;
    viewData.fitModelEnabled = fitModelEnabled;
    viewData.viewPreference = req.querystring.viewPreference ? req.querystring.viewPreference : '';
    var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
    var ratingPref = Site.getCurrent().getCustomPreferenceValue('bvEnableInlineRatings');
    var enableFitModel = 'enableFitModels' in Site.current.preferences.custom ? Site.current.getCustomPreferenceValue('enableFitModels') : false;
    var addScout = false;
    var sizeModelObject;
    if (enableFitModel && fitModelEnabled) {
        sizeModelObject = productHelpers.fetchSizeModelJSON();
    }
    viewData.sizeModelValues = sizeModelObject;
    viewData.enableFitModel = enableFitModel;
    if (ratingPref && ratingPref.value && ratingPref.value.equals('hosted')) {
        addScout = true;
    }

    if (addScout) {
        viewData.bvScout = BVHelper.getBvLoaderUrl();
    }
    var categoryDisplayName = result.category && 'categorySearchDisplayName' in result.category.custom && result.category.custom.categorySearchDisplayName ? result.category.custom.categorySearchDisplayName : null;
    var queryParamsValues = result && !empty(result.QueryParams) ? result.QueryParams : '';
    var categorySearchDisplayName = searchHelper.setupCategoryDisplayName(categoryDisplayName, queryParamsValues);
    viewData.categoryDisplayName = categorySearchDisplayName ? categorySearchDisplayName.displayName : '';
    viewData.searchDisplayName = categorySearchDisplayName ? categorySearchDisplayName.searchDisplayName : '';
    viewData.fromPDP = req.querystring.fromPDP;
    viewData.QueryParams = result && !empty(result.QueryParams) ? result.QueryParams : '';
    viewData.isDirectSearch = (req.querystring.start > 0) ? true : false; // eslint-disable-line
    viewData.isUserRefinedSearch = searchHelper.isUserRefinedSearch(req.querystring);
    viewData.hasTwoOrMoreRefinementValuesOfSameType = viewData.isUserRefinedSearch ? searchHelper.hasTwoOrMoreRefinementValuesOfSameType(req.querystring) : false;
    if (!empty(queryParamsValues)) {
        viewData.refinementsDisplayTitle = result.category && viewData.isUserRefinedSearch && !viewData.hasTwoOrMoreRefinementValuesOfSameType ? searchHelper.setupRefinementsDisplayTitle(queryParamsValues) : '';
    }
    viewData.pageContext = {
        ns: 'search'
    };
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper.js');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    viewData.enableAvailablePerLocale = enableAvailablePerLocale;
    var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line
    if (showSelectedFiltersOnBreadcrumbs && viewData.isUserRefinedSearch) {
        var breadcrumbSelectedFilters = viewData.productSearch.selectedFilters;
        if (!empty(breadcrumbSelectedFilters)) {
            viewData.productSearch.breadcrumbSelectedFilters = searchHelper.breadcrumRefinement(breadcrumbSelectedFilters, req.querystring);
        }
    }
    if (showSelectedFiltersOnBreadcrumbs && (viewData.productSearch && viewData.productSearch.breadcrumbSelectedFilters)) {
        var ArrayList = require('dw/util/ArrayList');
        var breadcrumbSchemaMarkup = new ArrayList(breadcrumbs);
        viewData.breadcrumbForSchema = searchHelper.setupBreadcrumbSchemaMarkup(breadcrumbSchemaMarkup, viewData.productSearch.breadcrumbSelectedFilters);
        viewData.countryCode = countryCode;
    }
    viewData.showPLPImageSlider = productHelper.enablePLPImageSlider();
    var selectedRefinements = {};
    if (req.querystring.preferences) {
        Object.keys(req.querystring.preferences).forEach(function (refinementName) {
            const value = req.querystring.preferences[refinementName];
            selectedRefinements[refinementName] = typeof value === 'string' ? value.split('|') : value;
        });
    }
    if (req.querystring.q) {
        var priceRange;

        if (req.querystring.pmin || req.querystring.pmax) {
            const pmin = req.querystring.pmin || '';
            const pmax = req.querystring.pmax || '';
            priceRange = [parseInt(pmin.toString().replace(',', ''), 10) || 0, parseInt(pmax.toString().replace(',', ''), 10) || 9999];
        }
        var extraParams = {};
        Object.keys(req.querystring).forEach(function (key) {
            if (['q', 'sz', 'start', 'pmin', 'pmax', 'srule', 'preferences'].indexOf(key) === -1 && !/^(prefn|prefv)\d+$/.test(key)) {
                extraParams[key] = req.querystring[key];
            }
        });
        viewData.initialSearchParams = {
            query: req.querystring.q,
            sortRule: req.querystring.srule,
            start: parseInt(req.querystring.start, 10) || 0,
            pageSize: parseInt(req.querystring.sz, 10) || preferences.defaultPageSize || 12,
            priceRange: priceRange,
            filterParams: selectedRefinements,
            extraParams: extraParams
        };
    }

    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);

server.prepend('Show', function (req, res, next) {
    var Site = require('dw/system/Site');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var hideLoadMoreButton = false;
    session.custom.internalnavigation = false;
    if (Site.current.getCustomPreferenceValue('enableHideLoadMoreProductsCTA')) {
        var comingBackFromPDP = searchHelper.pdpBackButtonDetectionWithSize(req);
        if (comingBackFromPDP) {
            hideLoadMoreButton = true;
            session.custom.internalnavigation = true;
        }
    }
    var viewData = res.getViewData();
    viewData.hideLoadMoreButton = hideLoadMoreButton;
    res.setViewData(viewData);
    next();
});

server.append('Refinebar', function (req, res, next) {
    var viewData = res.getViewData();
    var refinements = viewData.productSearch.refinements;

    var selectedRefinements = refinements.filter(function (ref) {
        return !ref.isCategoryRefinement;
    }).reduce(function (selectedRefs, ref) {
        ref.values.map(function (elem) {
            if (elem.selected) {
                selectedRefs.push({
                    title: elem.displayValue,
                    urlForUnselect: elem.url
                });
            }
            return elem;
        });
        return selectedRefs;
    }, []);
    var selectedFilters = req.querystring ? req.querystring.selectedFilter : '';
    var selectedRefinementArray;
    if (!empty(selectedFilters)) {
        selectedRefinementArray = selectedFilters.split(',');
    }
    viewData.productSearch.refinements = refinements.map(function (refinement) {
        // eslint-disable-next-line no-param-reassign
        refinement.amountSelectedValues = 0;
        refinement.values.forEach(function (value) {
            if (value.selected) {
                // eslint-disable-next-line no-param-reassign
                refinement.amountSelectedValues++;
            }
        });
        if (!empty(selectedRefinementArray) && selectedRefinementArray.length > 0) {
            var openedRefiment = '';
            if (refinement.isAttributeRefinement) {
                openedRefiment = refinement.values[0].id;
            } else {
                openedRefiment = refinement.displayName;
            }
            if (!empty(openedRefiment)) {
                for (var i = 0; i < selectedRefinementArray.length; i++) {
                    if (selectedRefinementArray[i] === openedRefiment) {
                        // eslint-disable-next-line no-param-reassign
                        refinement.refinementOpen = selectedRefinementArray[i];
                    }
                }
            }
        }
        return refinement;
    });
    viewData.selectedRefinements = selectedRefinements;
    viewData.canonicalUrl = URLUtils.url('Search-Show', 'cgid', req.querystring.cgid);
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper.js');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    viewData.enableAvailablePerLocale = enableAvailablePerLocale;
    res.setViewData(viewData);
    next();
});

server.append('ShowAjax', function (req, res, next) {
    var Site = require('dw/system/Site');
    var Locale = require('dw/util/Locale');
    var viewData = res.getViewData();
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var result = searchHelper.search(req, res);
    let enableExperienceTypes = ('enableExperienceTypes' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enableExperienceTypes'); //eslint-disable-line
    var PreferencesUtil = require('~/cartridge/scripts/utils/PreferencesUtil');
    var showSelectedFiltersOnBreadcrumbs = PreferencesUtil.isCountryEnabled(
        'showSelectedFiltersOnBreadcrumbs'
    );

    if (enableExperienceTypes) {
        let experienceType = null; //eslint-disable-line
        if (result.category) {
            let categoryDefaultExperience = ('categoryDefaultExperience' in Site.current.preferences.custom) ? Site.getCurrent().getCustomPreferenceValue('categoryDefaultExperience').value : null; //eslint-disable-line 
            let catExpType = result.category.custom.experienceType.value; //eslint-disable-line
            experienceType = catExpType || categoryDefaultExperience;
        } else {
            let searchDefaultExperience = ('searchDefaultExperience' in Site.current.preferences.custom) ? Site.getCurrent().getCustomPreferenceValue('searchDefaultExperience').value : null; //eslint-disable-line
            experienceType = searchDefaultExperience;
        }
        viewData.enableExperienceTypes = enableExperienceTypes;
        viewData.experienceType = experienceType;
    }

    var categoryDisplayName;
    if (result.category) {
        viewData.category = result.category;
        var breadcrumbs = productHelpers.getAllBreadcrumbs(result.category.ID, null, []).reverse();
        viewData.breadcrumbs = breadcrumbs;
        categoryDisplayName = 'categorySearchDisplayName' in result.category.custom && result.category.custom.categorySearchDisplayName ? result.category.custom.categorySearchDisplayName : null;
    }
    var queryParamsValues = result && !empty(result.QueryParams) ? result.QueryParams : '';
    var categorySearchDisplayName = searchHelper.setupCategoryDisplayName(categoryDisplayName, queryParamsValues);
    viewData.categoryDisplayName = categorySearchDisplayName ? categorySearchDisplayName.displayName : '';
    viewData.searchDisplayName = categorySearchDisplayName ? categorySearchDisplayName.searchDisplayName : '';
    viewData.colorGroup = (req.querystring.preferences && req.querystring.preferences.colorgroup) ? req.querystring.preferences.colorgroup : '';
    viewData.team = (req.querystring.preferences && req.querystring.preferences.team) ? req.querystring.preferences.team : '';
    viewData.canonicalUrl = result.canonicalUrl;
    viewData.QueryParams = result && !empty(result.QueryParams) ? result.QueryParams : '';
    viewData.viewPreference = req.querystring.viewPreference ? req.querystring.viewPreference : '';
    viewData.isUserRefinedSearch = searchHelper.isUserRefinedSearch(req.querystring);
    viewData.hasTwoOrMoreRefinementValuesOfSameType = viewData.isUserRefinedSearch ? searchHelper.hasTwoOrMoreRefinementValuesOfSameType(req.querystring) : false;
    if (!empty(queryParamsValues)) {
        viewData.refinementsDisplayTitle = result.category && viewData.isUserRefinedSearch && !viewData.hasTwoOrMoreRefinementValuesOfSameType ? searchHelper.setupRefinementsDisplayTitle(queryParamsValues) : '';
    }
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper.js');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    viewData.enableAvailablePerLocale = enableAvailablePerLocale;
    var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line
    if (showSelectedFiltersOnBreadcrumbs && viewData.isUserRefinedSearch) {
        var breadcrumbSelectedFilters = viewData.productSearch.selectedFilters;
        if (!empty(breadcrumbSelectedFilters)) {
            viewData.productSearch.breadcrumbSelectedFilters = searchHelper.breadcrumRefinement(breadcrumbSelectedFilters, req.querystring);
        }
    }
    if (showSelectedFiltersOnBreadcrumbs && (viewData.productSearch && viewData.productSearch.breadcrumbSelectedFilters)) {
        var ArrayList = require('dw/util/ArrayList');
        var breadcrumbSchemaMarkup = new ArrayList(viewData.breadcrumbs);
        viewData.breadcrumbForSchema = searchHelper.setupBreadcrumbSchemaMarkup(breadcrumbSchemaMarkup, viewData.productSearch.breadcrumbSelectedFilters);
        viewData.countryCode = countryCode;
    }

    viewData.isPLP = true;
    viewData.showPLPImageSlider = productHelper.enablePLPImageSlider();
    res.setViewData(viewData);
    next();
});

server.append('UpdateGrid', function (req, res, next) {
    var Site = require('dw/system/Site');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var apiProductSearch = new ProductSearchModel();
    var viewData = res.getViewData();
    let enableExperienceTypes = ('enableExperienceTypes' in Site.current.preferences.custom) && Site.current.getCustomPreferenceValue('enableExperienceTypes'); //eslint-disable-line

    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring, req.httpParameterMap);
    if (enableExperienceTypes) {
        let experienceType = null; //eslint-disable-line
        if (apiProductSearch.category) {
            let categoryDefaultExperience = ('categoryDefaultExperience' in Site.current.preferences.custom) ? Site.getCurrent().getCustomPreferenceValue('categoryDefaultExperience').value : null; //eslint-disable-line 
            let catExpType = apiProductSearch.category.custom.experienceType.value; //eslint-disable-line
            experienceType = catExpType || categoryDefaultExperience;
        } else {
            let searchDefaultExperience = ('searchDefaultExperience' in Site.current.preferences.custom) ? Site.getCurrent().getCustomPreferenceValue('searchDefaultExperience').value : null; //eslint-disable-line
            experienceType = searchDefaultExperience;
        }
        viewData.enableExperienceTypes = enableExperienceTypes;
        viewData.experienceType = experienceType;
    }

    viewData.colorGroup = (req.querystring.preferences && req.querystring.preferences.colorgroup) ? req.querystring.preferences.colorgroup : '';
    viewData.team = (req.querystring.preferences && req.querystring.preferences.team) ? req.querystring.preferences.team : '';
    viewData.fromPDP = req.querystring.fromPDP;
    viewData.previous = req.querystring.previous;
    viewData.viewPreference = req.querystring.viewPreference ? req.querystring.viewPreference : '';
    var productHelper = require('*/cartridge/scripts/helpers/ProductHelper.js');
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    viewData.enableAvailablePerLocale = enableAvailablePerLocale;
    viewData.showPLPImageSlider = productHelper.enablePLPImageSlider();
    viewData.isPLP = true;
    res.setViewData(viewData);

    next();
});

module.exports = server.exports();
